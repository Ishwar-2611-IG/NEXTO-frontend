import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  AlertCircle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Globe,
  Image as ImageIcon,
  Layers,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Shirt,
  Sparkles,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import {
  ConfirmModal,
  DataTable,
  EmptyState,
  FilterBar,
  ImageUploadZone,
  PageHeader,
  StatusBadge,
  useToast,
} from '../../components/admin/index';
import type { BulkAction, Column, FilterConfig, ImageUploadItem } from '../../components/admin/index';
import { api, ApiError } from '../../services/api';

// ─── Domain Types ────────────────────────────────────────────────────────────

export type ProductAudience = 'men' | 'women' | 'unisex' | 'accessories';
export type FitType = 'Slim' | 'Regular' | 'Relaxed' | 'Oversized';
export type CareIconType = 'wash' | 'iron' | 'dry' | 'bleach' | 'warning';

export interface ProductImage {
  url: string;
  alt: string;
  publicId?: string;
}

export interface ProductVariant {
  sku: string;
  size: string;
  color: string;
  stock: number;
  pricePaise?: number;
  compareAtPricePaise?: number;
  barcode?: string;
  weightGrams?: number;
  images?: ProductImage[];
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;
  tags?: string[];
  material?: string;
  fitType?: FitType;
  careInstructions?: Array<{ icon: CareIconType; text: string }>;
  price: number;
  basePrice?: number;
  compareAtPrice?: number;
  category: string;
  audience?: ProductAudience;
  categoryId?: string;
  images: ProductImage[];
  variants: ProductVariant[];
  isActive: boolean;
  status?: 'draft' | 'active';
  featured?: boolean;
  newArrival?: boolean;
  availableFrom?: string;
  averageRating?: number;
  reviewCount?: number;
  createdAt: string;
  updatedAt: string;
}

interface ProductsPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface ProductsListResponse {
  products: Product[];
  pagination: ProductsPagination;
}

interface CategoryItem {
  _id: string;
  name: string;
  slug: string;
  isActive?: boolean;
}

interface CategoriesResponse {
  categories?: CategoryItem[];
}

interface ColorOption {
  name: string;
  hex: string;
}

interface EditableVariant {
  id: string;
  size: string;
  color: string;
  colorHex: string;
  sku: string;
  priceRupees: string;
  compareAtRupees: string;
  barcode: string;
  stock: string;
}

interface CareInstructionItem {
  id: string;
  icon: CareIconType;
  text: string;
}

type EditorMode = null | 'create' | { id: string; product: Product };

type DeleteModalState =
  | null
  | { type: 'single'; product: Product }
  | { type: 'bulk'; ids: string[] };

// ─── Constants & Helpers ─────────────────────────────────────────────────────

const DEFAULT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const;

const CARE_ICON_OPTIONS: Array<{ value: CareIconType; label: string }> = [
  { value: 'wash', label: '🫧 Wash' },
  { value: 'iron', label: '♨️ Iron' },
  { value: 'dry', label: '🧺 Dry' },
  { value: 'bleach', label: '🧪 Bleach' },
  { value: 'warning', label: '⚠️ Warning' },
];

const AUDIENCE_OPTIONS: Array<{ value: ProductAudience; label: string }> = [
  { value: 'men', label: 'Men' },
  { value: 'women', label: 'Women' },
  { value: 'unisex', label: 'Unisex' },
  { value: 'accessories', label: 'Accessories' },
];

const FIT_OPTIONS: FitType[] = ['Slim', 'Regular', 'Relaxed', 'Oversized'];

const COLOR_HEX_FALLBACKS: Record<string, string> = {
  black: '#1A1A1A',
  white: '#F7F6F2',
  olive: '#4A5D4E',
  forest: '#1F3A2E',
  sage: '#7B8F7E',
  sand: '#D8CFC0',
  beige: '#E5DCCB',
  cream: '#F5F0E6',
  charcoal: '#36383A',
  navy: '#1E2D40',
  grey: '#8C8C86',
  gray: '#8C8C86',
  brown: '#6E4F3A',
  terracotta: '#B85D43',
  rust: '#9E472E',
  maroon: '#61252C',
  blue: '#2E5984',
  green: '#2E5A44',
  red: '#A33333',
};

const INR_FORMATTER = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
});

function formatPaise(paise: number): string {
  return INR_FORMATTER.format(paise / 100);
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function sanitizeSkuSegment(value: string): string {
  const cleaned = value
    .toUpperCase()
    .trim()
    .replace(/[^A-Z0-9]+/g, '')
    .slice(0, 12);
  return cleaned || 'STD';
}

function buildAutoSku(productName: string, size: string, color: string): string {
  return `${sanitizeSkuSegment(productName)}-${sanitizeSkuSegment(size)}-${sanitizeSkuSegment(color)}`;
}

function guessHexForColor(colorName: string): string {
  const key = colorName.toLowerCase().trim();
  return COLOR_HEX_FALLBACKS[key] ?? '#1F3A2E';
}

function getStockSummary(variants: ProductVariant[]): {
  total: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
} {
  const total = variants.reduce((sum, v) => sum + (v.stock || 0), 0);
  if (total <= 0) return { total: 0, status: 'out_of_stock' };
  const hasLowVariant = variants.some((v) => v.stock > 0 && v.stock < 5);
  if (total < 10 || hasLowVariant) return { total, status: 'low_stock' };
  return { total, status: 'in_stock' };
}

function parseRupeesToPaise(raw: string): number | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) return undefined;
  return Math.round(parsed * 100);
}

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Zod Validation Schema ───────────────────────────────────────────────────

const productFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Product name must be at least 2 characters')
      .max(160, 'Product name must be at most 160 characters'),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .min(2, 'URL slug must be at least 2 characters')
      .max(180, 'URL slug must be at most 180 characters')
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        'Slug may only contain lowercase letters, numbers, and single hyphens',
      ),
    description: z
      .string()
      .trim()
      .min(1, 'Description is required')
      .max(5000, 'Description must be at most 5000 characters'),
    category: z
      .string()
      .trim()
      .min(1, 'Category is required')
      .max(80, 'Category must be at most 80 characters'),
    audience: z.enum(['men', 'women', 'unisex', 'accessories']),
    tagsText: z
      .string()
      .max(1500, 'Tags are too long')
      .refine((value) => value.split(',').map((tag) => tag.trim()).filter(Boolean).length <= 30, 'Use no more than 30 tags')
      .refine((value) => value.split(',').every((tag) => tag.trim().length <= 50), 'Each tag must be 50 characters or fewer'),
    basePriceRupees: z
      .string()
      .trim()
      .min(1, 'Base price is required')
      .refine((val) => {
        const n = Number(val);
        return Number.isFinite(n) && n >= 0;
      }, 'Enter a valid non-negative price'),
    compareAtPriceRupees: z
      .string()
      .trim()
      .refine((val) => {
        if (!val) return true;
        const n = Number(val);
        return Number.isFinite(n) && n >= 0;
      }, 'Enter a valid non-negative compare-at price'),
    material: z.string().max(200, 'Material description is too long'),
    fitType: z.enum(['Slim', 'Regular', 'Relaxed', 'Oversized']),
    metaTitle: z.string().max(60, 'Meta title must be at most 60 characters'),
    metaDescription: z.string().max(160, 'Meta description must be at most 160 characters'),
    isActive: z.boolean(),
    featured: z.boolean(),
    newArrival: z.boolean(),
    availableFrom: z.string(),
  })
  .refine(
    (data) => {
      if (!data.compareAtPriceRupees.trim()) return true;
      const base = Number(data.basePriceRupees);
      const compareAt = Number(data.compareAtPriceRupees);
      if (!Number.isFinite(base) || !Number.isFinite(compareAt)) return true;
      return compareAt >= base;
    },
    {
      message: 'Compare-at price must be greater than or equal to base price',
      path: ['compareAtPriceRupees'],
    },
  );

type ProductFormValues = z.infer<typeof productFormSchema>;

const editableVariantSchema = z.object({
  sku: z.string().trim().min(1, 'SKU is required').max(80).regex(/^[A-Za-z0-9_-]+$/, 'Use letters, numbers, hyphens, or underscores'),
  size: z.string().trim().min(1, 'Size is required').max(30),
  color: z.string().trim().min(1, 'Color is required').max(50),
  stock: z.string().trim().regex(/^(0|[1-9]\d*)$/, 'Stock must be a whole number of 0 or more'),
  barcode: z.string().trim().max(80).regex(/^[A-Za-z0-9_-]*$/, 'Barcode contains unsupported characters'),
  priceRupees: z.string().trim().refine((value) => !value || parseRupeesToPaise(value) !== undefined, 'Enter a valid variant price'),
  compareAtRupees: z.string().trim().refine((value) => !value || parseRupeesToPaise(value) !== undefined, 'Enter a valid compare-at price'),
}).strict();

type VariantFieldName = keyof z.infer<typeof editableVariantSchema>;

// ─── Product Editor Component ────────────────────────────────────────────────

interface ProductEditorProps {
  mode: 'create' | { id: string; product: Product };
  categories: CategoryItem[];
  onClose: () => void;
  onSaved: () => void;
}

const ProductEditor: React.FC<ProductEditorProps> = ({
  mode,
  categories,
  onClose,
  onSaved,
}) => {
  const { toast } = useToast();
  const isEditing = mode !== 'create';
  const existingProduct = isEditing ? mode.product : null;

  // Compute initial values for images, sizes, colors, and variants
  const initialImages: ProductImage[] = useMemo(
    () =>
      existingProduct?.images?.map((img) => ({
        url: img.url,
        alt: img.alt ?? '',
        ...(img.publicId ? { publicId: img.publicId } : {}),
      })) ?? [],
    [existingProduct],
  );

  const initialVariants: EditableVariant[] = useMemo(() => {
    if (!existingProduct?.variants?.length) {
      return [];
    }
    return existingProduct.variants.map((v, idx) => ({
      id: `var-${idx}-${v.sku}`,
      size: v.size,
      color: v.color,
      colorHex: guessHexForColor(v.color),
      sku: v.sku,
      priceRupees:
        v.pricePaise !== undefined ? String(Number((v.pricePaise / 100).toFixed(2))) : '',
      compareAtRupees: v.compareAtPricePaise !== undefined
        ? String(Number((v.compareAtPricePaise / 100).toFixed(2)))
        : '',
      barcode: v.barcode ?? '',
      stock: String(v.stock),
    }));
  }, [existingProduct]);

  const initialSizes = useMemo(() => {
    if (!existingProduct?.variants?.length) return ['S', 'M', 'L', 'XL'];
    const set = new Set(existingProduct.variants.map((v) => v.size));
    return Array.from(set);
  }, [existingProduct]);

  const initialColors = useMemo<ColorOption[]>(() => {
    if (!existingProduct?.variants?.length) {
      return [{ name: 'Obsidian', hex: '#1A1A1A' }];
    }
    const map = new Map<string, ColorOption>();
    existingProduct.variants.forEach((v) => {
      const key = v.color.toLowerCase();
      if (!map.has(key)) {
        map.set(key, { name: v.color, hex: guessHexForColor(v.color) });
      }
    });
    return Array.from(map.values());
  }, [existingProduct]);

  const [images, setImages] = useState<ProductImage[]>(initialImages);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [availableSizes, setAvailableSizes] = useState<string[]>(() => {
    const merged = new Set<string>([...DEFAULT_SIZES, ...initialSizes]);
    return Array.from(merged);
  });
  const [selectedSizes, setSelectedSizes] = useState<string[]>(initialSizes);
  const [customSizeInput, setCustomSizeInput] = useState('');

  const [colors, setColors] = useState<ColorOption[]>(initialColors);
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#1F3A2E');

  const [variants, setVariants] = useState<EditableVariant[]>(initialVariants);
  const [variantError, setVariantError] = useState<string | null>(null);
  const [bulkPrice, setBulkPrice] = useState('');
  const [bulkStock, setBulkStock] = useState('');

  const [careInstructions, setCareInstructions] = useState<CareInstructionItem[]>(() =>
    existingProduct?.careInstructions?.map((item, index) => ({
      id: `care-${index}-${item.icon}`,
      icon: item.icon,
      text: item.text,
    })) ?? [{ id: 'care-default-1', icon: 'wash', text: 'Machine wash cold with similar colours' }],
  );
  const [variantFieldErrors, setVariantFieldErrors] = useState<Record<string, Partial<Record<VariantFieldName, string>>>>({});
  const [isAddingImageUrl, setIsAddingImageUrl] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);

  const [slugManuallyEdited, setSlugManuallyEdited] = useState(isEditing);
  const [extraDirty, setExtraDirty] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const initialBasePaise = existingProduct
    ? (existingProduct.basePrice ?? existingProduct.price)
    : 0;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: existingProduct?.name ?? '',
      slug: existingProduct?.slug ?? '',
      description: existingProduct?.description ?? '',
      category: existingProduct?.category ?? '',
      audience: existingProduct?.audience ?? 'unisex',
      tagsText: existingProduct?.tags?.join(', ') ?? '',
      basePriceRupees: existingProduct
        ? String(Number((initialBasePaise / 100).toFixed(2)))
        : '',
      compareAtPriceRupees:
        existingProduct?.compareAtPrice !== undefined
          ? String(Number((existingProduct.compareAtPrice / 100).toFixed(2)))
          : '',
      material: existingProduct?.material ?? '',
      fitType: existingProduct?.fitType ?? 'Regular',
      metaTitle: (existingProduct?.metaTitle ?? '').slice(0, 60),
      metaDescription: (existingProduct?.metaDescription ?? '').slice(0, 160),
      isActive: existingProduct?.isActive ?? true,
      featured: existingProduct?.featured ?? false,
      newArrival: existingProduct?.newArrival ?? false,
      availableFrom: existingProduct?.availableFrom
        ? new Date(existingProduct.availableFrom).toISOString().slice(0, 10)
        : '',
    },
  });

  const watchedName = watch('name');
  const watchedSlug = watch('slug');
  const watchedDescription = watch('description');
  const watchedTagsText = watch('tagsText');
  const watchedMetaTitle = watch('metaTitle');
  const watchedMetaDescription = watch('metaDescription');
  const watchedIsActive = watch('isActive');
  const watchedBasePrice = watch('basePriceRupees');

  // Auto-generate slug from product name while not manually edited
  useEffect(() => {
    if (!slugManuallyEdited) {
      setValue('slug', slugify(watchedName), { shouldValidate: false });
    }
  }, [watchedName, slugManuallyEdited, setValue]);

  const parsedTags = useMemo(
    () =>
      watchedTagsText
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    [watchedTagsText],
  );

  const hasUnsavedChanges = isDirty || extraDirty;

  const requestClose = () => {
    if (hasUnsavedChanges) {
      setShowLeaveModal(true);
    } else {
      onClose();
    }
  };

  // ─── Media Handlers ────────────────────────────────────────────────────────

  const handleImagesUploaded = (uploadedImages: ImageUploadItem[]) => {
    if (uploadedImages.length === 0) return;
    setImages((prev) => {
      const remaining = Math.max(0, 10 - prev.length);
      const additions = uploadedImages
        .filter((image): image is ProductImage & { publicId: string } => Boolean(image.publicId))
        .slice(0, remaining)
        .map((image) => ({ ...image, alt: '' }));
      return [...prev, ...additions];
    });
    setMediaError(null);
    setExtraDirty(true);
  };

  const handleAddImageUrl = async () => {
    const trimmed = imageUrlInput.trim();
    if (!trimmed) return;
    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol !== 'https:') {
        toast({ message: 'Image URL must use HTTPS', type: 'error' });
        return;
      }
    } catch {
      toast({ message: 'Please enter a valid image URL', type: 'error' });
      return;
    }
    if (images.length >= 10) {
      toast({ message: 'A product can have at most 10 images', type: 'error' });
      return;
    }
    setIsAddingImageUrl(true);
    try {
      const image = await api.post<{ url: string; publicId: string }>('/admin/upload', {
        folder: 'products',
        url: trimmed,
      });
      setImages((prev) => [...prev, { ...image, alt: '' }]);
      setMediaError(null);
      setImageUrlInput('');
      setExtraDirty(true);
      toast({ message: 'Image imported to Cloudinary', type: 'success' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unable to import this image.';
      toast({ message, type: 'error' });
    } finally {
      setIsAddingImageUrl(false);
    }
  };

  const handleMoveImage = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    setImages((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[target];
      next[target] = temp;
      return next;
    });
    setExtraDirty(true);
  };

  const handleSetPrimaryImage = (index: number) => {
    if (index <= 0 || index >= images.length) return;
    setImages((prev) => {
      const chosen = prev[index];
      return [chosen, ...prev.filter((_, i) => i !== index)];
    });
    setExtraDirty(true);
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setExtraDirty(true);
  };

  const handleImageAltChange = (index: number, alt: string) => {
    setImages((prev) => prev.map((img, i) => (i === index ? { ...img, alt } : img)));
    setExtraDirty(true);
  };

  // ─── Variant Matrix Handlers ───────────────────────────────────────────────

  const toggleSize = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size],
    );
  };

  const handleAddCustomSize = () => {
    const normalized = customSizeInput.trim().toUpperCase();
    if (!normalized) return;
    if (!availableSizes.includes(normalized)) {
      setAvailableSizes((prev) => [...prev, normalized]);
    }
    if (!selectedSizes.includes(normalized)) {
      setSelectedSizes((prev) => [...prev, normalized]);
    }
    setCustomSizeInput('');
  };

  const handleAddColor = () => {
    const trimmed = newColorName.trim();
    if (!trimmed) return;
    const exists = colors.some((c) => c.name.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      toast({ message: `Color "${trimmed}" is already added`, type: 'info' });
      return;
    }
    setColors((prev) => [...prev, { name: trimmed, hex: newColorHex }]);
    setNewColorName('');
  };

  const handleRemoveColor = (name: string) => {
    setColors((prev) => prev.filter((c) => c.name !== name));
  };

  const handleGenerateMatrix = () => {
    if (selectedSizes.length === 0 || colors.length === 0) {
      setVariantError('Select at least one size and add at least one color to generate variants.');
      return;
    }
    setVariantError(null);
    const existingByPair = new Map<string, EditableVariant>();
    variants.forEach((v) => {
      existingByPair.set(`${v.color.toLowerCase()}::${v.size.toLowerCase()}`, v);
    });

    const nextVariants: EditableVariant[] = [];
    for (const color of colors) {
      for (const size of selectedSizes) {
        const key = `${color.name.toLowerCase()}::${size.toLowerCase()}`;
        const existing = existingByPair.get(key);
        if (existing) {
          nextVariants.push({ ...existing, colorHex: color.hex });
        } else {
          nextVariants.push({
            id: createId('var'),
            size,
            color: color.name,
            colorHex: color.hex,
            sku: buildAutoSku(watchedName, size, color.name),
            priceRupees: watchedBasePrice.trim(),
            compareAtRupees: '',
            barcode: '',
            stock: '10',
          });
        }
      }
    }
    setVariants(nextVariants);
    setExtraDirty(true);
  };

  const handleAddSingleVariantRow = () => {
    const defaultSize = selectedSizes[0] ?? 'M';
    const defaultColor = colors[0] ?? { name: 'Black', hex: '#1A1A1A' };
    const suffix = variants.length + 1;
    setVariants((prev) => [
      ...prev,
      {
        id: createId('var'),
        size: defaultSize,
        color: defaultColor.name,
        colorHex: defaultColor.hex,
        sku: `${buildAutoSku(watchedName, defaultSize, defaultColor.name)}-${suffix}`,
        priceRupees: watchedBasePrice.trim(),
        compareAtRupees: '',
        barcode: '',
        stock: '0',
      },
    ]);
    setVariantError(null);
    setExtraDirty(true);
  };

  const handleUpdateVariantField = (
    id: string,
    field: keyof Omit<EditableVariant, 'id'>,
    value: string,
  ) => {
    setVariants((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    );
    setVariantFieldErrors((previous) => {
      const current = previous[id];
      if (!current) return previous;
      const next = { ...current };
      delete next[field as VariantFieldName];
      return { ...previous, [id]: next };
    });
    setVariantError(null);
    setExtraDirty(true);
  };

  const handleRemoveVariant = (id: string) => {
    setVariants((prev) => prev.filter((row) => row.id !== id));
    setExtraDirty(true);
  };

  const handleBulkFill = () => {
    if (variants.length === 0) {
      toast({ message: 'Generate or add variants first', type: 'info' });
      return;
    }
    if (!bulkPrice.trim() && !bulkStock.trim()) {
      toast({ message: 'Enter a price and/or stock value to apply', type: 'info' });
      return;
    }
    setVariants((prev) =>
      prev.map((row) => ({
        ...row,
        ...(bulkPrice.trim() !== '' ? { priceRupees: bulkPrice.trim() } : {}),
        ...(bulkStock.trim() !== '' ? { stock: bulkStock.trim() } : {}),
      })),
    );
    setExtraDirty(true);
    toast({ message: `Applied bulk values to ${variants.length} variants`, type: 'success' });
  };

  // ─── Care Instruction Handlers ─────────────────────────────────────────────

  const handleAddCareInstruction = () => {
    setCareInstructions((prev) => [
      ...prev,
      { id: createId('care'), icon: 'wash', text: '' },
    ]);
    setExtraDirty(true);
  };

  const handleUpdateCareInstruction = (
    id: string,
    field: 'icon' | 'text',
    value: string,
  ) => {
    setCareInstructions((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              ...(field === 'icon' ? { icon: value as CareIconType } : { text: value }),
            }
          : item,
      ),
    );
    setExtraDirty(true);
  };

  const handleRemoveCareInstruction = (id: string) => {
    setCareInstructions((prev) => prev.filter((item) => item.id !== id));
    setExtraDirty(true);
  };

  // ─── Submit Handler ────────────────────────────────────────────────────────

  const onSubmit = async (values: ProductFormValues) => {
    setVariantFieldErrors({});
    if (variants.length === 0) {
      setVariantError('Add or generate at least one product variant before saving.');
      toast({ message: 'At least one product variant is required', type: 'error' });
      return;
    }

    const seenSkus = new Set<string>();
    const formattedVariants: Array<{
      sku: string;
      size: string;
      color: string;
      stock: number;
      pricePaise?: number;
      compareAtPricePaise?: number;
      barcode?: string;
    }> = [];
    const rowErrors: Record<string, Partial<Record<VariantFieldName, string>>> = {};

    for (const row of variants) {
      const parsed = editableVariantSchema.safeParse(row);
      if (!parsed.success) {
        rowErrors[row.id] = Object.fromEntries(
          parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message]),
        );
        continue;
      }
      const sku = parsed.data.sku.toUpperCase();
      if (seenSkus.has(sku)) {
        rowErrors[row.id] = { ...(rowErrors[row.id] ?? {}), sku: 'Each variant SKU must be unique.' };
        continue;
      }
      seenSkus.add(sku);
      const variantPricePaise = parseRupeesToPaise(parsed.data.priceRupees);
      const variantCompareAtPaise = parseRupeesToPaise(parsed.data.compareAtRupees);
      const compareAgainst = variantPricePaise ?? parseRupeesToPaise(values.basePriceRupees);
      if (variantCompareAtPaise !== undefined && compareAgainst !== undefined && variantCompareAtPaise < compareAgainst) {
        rowErrors[row.id] = { ...(rowErrors[row.id] ?? {}), compareAtRupees: 'Compare-at must be at least the variant price.' };
        continue;
      }
      formattedVariants.push({
        sku,
        size: parsed.data.size,
        color: parsed.data.color,
        stock: Number(parsed.data.stock),
        ...(variantPricePaise !== undefined ? { pricePaise: variantPricePaise } : {}),
        ...(variantCompareAtPaise !== undefined ? { compareAtPricePaise: variantCompareAtPaise } : {}),
        ...(parsed.data.barcode ? { barcode: parsed.data.barcode } : {}),
      });
    }
    if (Object.keys(rowErrors).length > 0) {
      setVariantFieldErrors(rowErrors);
      setVariantError('Correct the highlighted variant fields before saving.');
      toast({ message: 'Please correct the variant errors', type: 'error' });
      return;
    }

    const basePricePaise = parseRupeesToPaise(values.basePriceRupees);
    if (basePricePaise === undefined) {
      toast({ message: 'Please enter a valid base price', type: 'error' });
      return;
    }

    const compareAtPaise = parseRupeesToPaise(values.compareAtPriceRupees);
    if (values.isActive && images.length === 0) {
      setMediaError('Add at least one image before publishing an active product.');
      toast({ message: 'Add at least one image before publishing an active product.', type: 'error' });
      return;
    }
    if (images.some((image) => !image.publicId || !/^nexto\/products\/[A-Za-z0-9_-]+$/.test(image.publicId))) {
      setMediaError('Re-upload each existing image to Cloudinary before saving this product.');
      toast({ message: 'Re-upload each existing image to Cloudinary before saving this product.', type: 'error' });
      return;
    }

    // Match categoryId if an active category with the same name exists
    const matchedCategory = categories.find(
      (cat) =>
        cat.name.toLowerCase() === values.category.trim().toLowerCase() &&
        cat.isActive !== false,
    );

    const uploadedImages = images.filter(
      (img): img is ProductImage & { publicId: string } =>
        typeof img.publicId === 'string' && /^nexto\/products\/[A-Za-z0-9_-]+$/.test(img.publicId),
    );
    if (uploadedImages.length !== images.length) {
      toast({ message: 'Re-upload each existing image to Cloudinary before saving this product.', type: 'error' });
      return;
    }

    const normalizedImages = uploadedImages.slice(0, 10).map((img) => ({
      url: img.url.trim(),
      alt: img.alt.trim().slice(0, 200),
      publicId: img.publicId,
    }));

    const primaryImageUrl = normalizedImages[0]?.url ?? '';

    const payload: Record<string, unknown> = {
      name: values.name.trim(),
      slug: values.slug.trim().toLowerCase(),
      description: values.description.trim(),
      metaTitle: values.metaTitle.trim(),
      metaDescription: values.metaDescription.trim(),
      tags: parsedTags,
      material: values.material.trim(),
      fitType: values.fitType,
      careInstructions: careInstructions
        .filter((item) => item.text.trim())
        .map(({ icon, text }) => ({ icon, text: text.trim() })),
      ogImage: primaryImageUrl,
      price: basePricePaise,
      ...(compareAtPaise !== undefined ? { compareAtPrice: compareAtPaise } : {}),
      category: matchedCategory ? matchedCategory.name : values.category.trim(),
      ...(matchedCategory ? { categoryId: matchedCategory._id } : {}),
      audience: values.audience,
      images: normalizedImages,
      variants: formattedVariants,
      isActive: values.isActive,
      status: values.isActive ? 'active' : 'draft',
      featured: values.featured,
      newArrival: values.newArrival,
      ...(values.availableFrom ? { availableFrom: new Date(`${values.availableFrom}T00:00:00.000Z`) } : {}),
    };

    setSubmitting(true);
    try {
      if (isEditing) {
        await api.patch<{ product: Product }>(`/admin/products/${mode.id}`, payload);
        toast({ message: 'Product saved successfully', type: 'success' });
      } else {
        await api.post<{ product: Product }>('/admin/products', payload);
        toast({ message: 'Product created successfully', type: 'success' });
      }
      onSaved();
    } catch (err: unknown) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
          ? err.message
          : 'Failed to save product.';
      toast({ message, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const previewTitle = watchedMetaTitle.trim() || watchedName.trim() || 'Untitled Product — NEXTO';
  const previewDesc =
    watchedMetaDescription.trim() ||
    watchedDescription.trim().slice(0, 160) ||
    'Crafted streetwear essentials designed for everyday movement.';
  const previewSlug = watchedSlug.trim() || 'your-product-slug';

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Catalogue"
        title={isEditing ? `Edit ${existingProduct?.name ?? 'Product'}` : 'New Product'}
        breadcrumbs={[
          { label: 'Products' },
          { label: isEditing ? existingProduct?.name ?? 'Edit' : 'New' },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={requestClose}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#1A1A1A] bg-white border border-[#E5E4DF] rounded-lg hover:bg-[#F7F6F2] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Products</span>
            </button>
            <button
              type="submit"
              form="product-editor-form"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#1F3A2E] hover:bg-[#162a21] rounded-lg transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{submitting ? 'Saving...' : 'Save Product'}</span>
            </button>
          </div>
        }
      />

      <form
        id="product-editor-form"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
      >
        {/* ─── Main Column (Sections 1–4) ──────────────────────────────────── */}
        <div className="lg:col-span-8 space-y-6">
          {/* Section 1 — Core Info */}
          <section className="bg-white border border-[#E5E4DF] rounded-xl p-6 space-y-5">
            <div className="flex items-center gap-2.5 border-b border-[#E5E4DF] pb-4">
              <div className="w-8 h-8 rounded-lg bg-[#E8EDE9] text-[#1F3A2E] flex items-center justify-center">
                <Package className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-serif text-lg font-semibold text-[#1A1A1A]">
                  Core Information
                </h2>
                <p className="text-xs text-[#6B6B65]">
                  Essential product identity, category, and storefront copy.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Product Name */}
              <div>
                <label
                  htmlFor="product-name"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#6B6B65] mb-1.5"
                >
                  Product Name <span className="text-red-600">*</span>
                </label>
                <input
                  id="product-name"
                  type="text"
                  placeholder="e.g. Heavyweight Boxy Tee — Washed Obsidian"
                  {...register('name')}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E5E4DF] rounded-lg text-[#1A1A1A] placeholder-[#6B6B65] focus:outline-none focus:ring-2 focus:ring-[#1F3A2E]"
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="product-description"
                    className="block text-xs font-semibold uppercase tracking-wider text-[#6B6B65]"
                  >
                    Description <span className="text-red-600">*</span>
                  </label>
                  <span className="text-xs text-[#6B6B65]">
                    {watchedDescription.length}/5000
                  </span>
                </div>
                <textarea
                  id="product-description"
                  rows={5}
                  placeholder="Describe silhouette, fabric handfeel, construction details, and styling notes..."
                  {...register('description')}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E5E4DF] rounded-lg text-[#1A1A1A] placeholder-[#6B6B65] focus:outline-none focus:ring-2 focus:ring-[#1F3A2E]"
                />
                {errors.description && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.description.message}
                  </p>
                )}
              </div>

              {/* Category & Audience */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="product-category"
                    className="block text-xs font-semibold uppercase tracking-wider text-[#6B6B65] mb-1.5"
                  >
                    Category <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="product-category"
                    type="text"
                    list="nexto-category-suggestions"
                    placeholder="e.g. T-Shirts, Hoodies, Outerwear"
                    {...register('category')}
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E5E4DF] rounded-lg text-[#1A1A1A] placeholder-[#6B6B65] focus:outline-none focus:ring-2 focus:ring-[#1F3A2E]"
                  />
                  <datalist id="nexto-category-suggestions">
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat.name} />
                    ))}
                  </datalist>
                  {errors.category && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.category.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="product-audience"
                    className="block text-xs font-semibold uppercase tracking-wider text-[#6B6B65] mb-1.5"
                  >
                    Audience
                  </label>
                  <select
                    id="product-audience"
                    {...register('audience')}
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E5E4DF] rounded-lg text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#1F3A2E]"
                  >
                    {AUDIENCE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label
                  htmlFor="product-tags"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#6B6B65] mb-1.5"
                >
                  Tags (comma-separated)
                </label>
                <input
                  id="product-tags"
                  type="text"
                  placeholder="streetwear, heavyweight, drop-04, essentials"
                  {...register('tagsText')}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E5E4DF] rounded-lg text-[#1A1A1A] placeholder-[#6B6B65] focus:outline-none focus:ring-2 focus:ring-[#1F3A2E]"
                />
                {errors.tagsText && <p className="mt-1 text-xs text-red-600">{errors.tagsText.message}</p>}
                {parsedTags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {parsedTags.map((tag, idx) => (
                      <span
                        key={`${tag}-${idx}`}
                        className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full bg-[#E8EDE9] text-[#1F3A2E]"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Section 2 — Media */}
          <section className="bg-white border border-[#E5E4DF] rounded-xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[#E5E4DF] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#E8EDE9] text-[#1F3A2E] flex items-center justify-center">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-serif text-lg font-semibold text-[#1A1A1A]">Media</h2>
                  <p className="text-xs text-[#6B6B65]">
                    Upload up to 10 images. The first image is used as the primary catalogue photo.
                  </p>
                </div>
              </div>
              <span className="text-xs font-medium text-[#6B6B65]">{images.length}/10</span>
            </div>

            <ImageUploadZone
              multiple
              maxSizeMb={5}
              folder="products"
              maxFiles={Math.max(0, 10 - images.length)}
              onUpload={handleImagesUploaded}
              onError={(message) => toast({ message, type: 'error' })}
              existingImages={[]}
            />
            {mediaError && <p role="alert" className="text-xs text-red-600">{mediaError}</p>}

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddImageUrl();
                  }
                }}
                placeholder="Paste an HTTPS image URL to import into Cloudinary"
                className="flex-1 px-3.5 py-2 text-sm bg-white border border-[#E5E4DF] rounded-lg text-[#1A1A1A] placeholder-[#6B6B65] focus:outline-none focus:ring-2 focus:ring-[#1F3A2E]"
              />
              <button
                type="button"
                onClick={handleAddImageUrl}
                disabled={isAddingImageUrl || !imageUrlInput.trim()}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium text-[#1F3A2E] bg-[#E8EDE9] hover:bg-[#dbe4dd] rounded-lg transition-colors"
              >
                {isAddingImageUrl ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                <span>{isAddingImageUrl ? 'Importing...' : 'Import image'}</span>
              </button>
            </div>

            {/* Reorderable Thumbnails */}
            {images.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
                {images.map((img, idx) => (
                  <div
                    key={`${img.url}-${idx}`}
                    className={`rounded-xl border overflow-hidden bg-[#FAF9F6] flex flex-col ${
                      idx === 0 ? 'border-[#1F3A2E] ring-1 ring-[#1F3A2E]/20' : 'border-[#E5E4DF]'
                    }`}
                  >
                    <div className="relative aspect-square bg-[#F7F6F2]">
                      <img
                        src={img.url}
                        alt={img.alt || `Product image ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {idx === 0 && (
                        <span className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-full bg-[#1F3A2E] text-white">
                          <Star className="w-3 h-3 fill-current" />
                          Primary
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        aria-label={`Remove image ${idx + 1}`}
                        className="absolute top-2 right-2 p-1 rounded-full bg-black/65 text-white hover:bg-red-600 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="p-2.5 space-y-2 bg-white border-t border-[#E5E4DF]">
                      <input
                        type="text"
                        value={img.alt}
                        onChange={(e) => handleImageAltChange(idx, e.target.value)}
                        placeholder="Alt text..."
                        maxLength={200}
                        className="w-full px-2.5 py-1 text-xs bg-[#FAF9F6] border border-[#E5E4DF] rounded-md text-[#1A1A1A] placeholder-[#6B6B65] focus:outline-none focus:ring-1 focus:ring-[#1F3A2E]"
                      />
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveImage(idx, -1)}
                            aria-label="Move image left"
                            className="p-1 rounded border border-[#E5E4DF] text-[#1A1A1A] hover:bg-[#F7F6F2] disabled:opacity-35 disabled:cursor-not-allowed"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === images.length - 1}
                            onClick={() => handleMoveImage(idx, 1)}
                            aria-label="Move image right"
                            className="p-1 rounded border border-[#E5E4DF] text-[#1A1A1A] hover:bg-[#F7F6F2] disabled:opacity-35 disabled:cursor-not-allowed"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {idx !== 0 && (
                          <button
                            type="button"
                            onClick={() => handleSetPrimaryImage(idx)}
                            className="text-[11px] font-medium text-[#1F3A2E] hover:underline"
                          >
                            Set primary
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Section 3 — Pricing & Variant Matrix */}
          <section className="bg-white border border-[#E5E4DF] rounded-xl p-6 space-y-5">
            <div className="flex items-center gap-2.5 border-b border-[#E5E4DF] pb-4">
              <div className="w-8 h-8 rounded-lg bg-[#E8EDE9] text-[#1F3A2E] flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-serif text-lg font-semibold text-[#1A1A1A]">
                  Pricing &amp; Variant Matrix
                </h2>
                <p className="text-xs text-[#6B6B65]">
                  Set base pricing in ₹ (stored in paise) and generate size × color SKUs.
                </p>
              </div>
            </div>

            {/* Base Price & Compare-at Price */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="product-base-price"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#6B6B65] mb-1.5"
                >
                  Base Price (₹) <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-sm text-[#6B6B65]">
                    ₹
                  </span>
                  <input
                    id="product-base-price"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="1999"
                    {...register('basePriceRupees')}
                    className="w-full pl-8 pr-3.5 py-2.5 text-sm bg-white border border-[#E5E4DF] rounded-lg text-[#1A1A1A] placeholder-[#6B6B65] focus:outline-none focus:ring-2 focus:ring-[#1F3A2E]"
                  />
                </div>
                {errors.basePriceRupees && (
                  <p className="mt-1 text-xs text-red-600">{errors.basePriceRupees.message}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="product-compare-price"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#6B6B65] mb-1.5"
                >
                  Compare-at Price (₹)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-sm text-[#6B6B65]">
                    ₹
                  </span>
                  <input
                    id="product-compare-price"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="2499"
                    {...register('compareAtPriceRupees')}
                    className="w-full pl-8 pr-3.5 py-2.5 text-sm bg-white border border-[#E5E4DF] rounded-lg text-[#1A1A1A] placeholder-[#6B6B65] focus:outline-none focus:ring-2 focus:ring-[#1F3A2E]"
                  />
                </div>
                {errors.compareAtPriceRupees && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.compareAtPriceRupees.message}
                  </p>
                )}
              </div>
            </div>

            {/* Size Axis */}
            <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#E5E4DF] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]">
                  Size Axis
                </span>
                <span className="text-xs text-[#6B6B65]">{selectedSizes.length} selected</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {availableSizes.map((size) => {
                  const active = selectedSizes.includes(size);
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => toggleSize(size)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                        active
                          ? 'bg-[#1F3A2E] text-white border-[#1F3A2E]'
                          : 'bg-white text-[#1A1A1A] border-[#E5E4DF] hover:bg-[#E8EDE9]/50'
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={customSizeInput}
                  onChange={(e) => setCustomSizeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomSize();
                    }
                  }}
                  placeholder="Add custom size (e.g. 3XL, 32, ONE SIZE)"
                  className="flex-1 px-3 py-1.5 text-xs bg-white border border-[#E5E4DF] rounded-lg text-[#1A1A1A] placeholder-[#6B6B65] focus:outline-none focus:ring-2 focus:ring-[#1F3A2E]"
                />
                <button
                  type="button"
                  onClick={handleAddCustomSize}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-white border border-[#E5E4DF] rounded-lg text-[#1A1A1A] hover:bg-[#E8EDE9]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Size
                </button>
              </div>
            </div>

            {/* Color Axis */}
            <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#E5E4DF] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]">
                  Color Axis
                </span>
                <span className="text-xs text-[#6B6B65]">{colors.length} added</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {colors.map((color) => (
                  <span
                    key={color.name}
                    className="inline-flex items-center gap-2 pl-2.5 pr-2 py-1 text-xs font-medium bg-white border border-[#E5E4DF] rounded-full text-[#1A1A1A]"
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/15"
                      style={{ backgroundColor: color.hex }}
                    />
                    <span>{color.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveColor(color.name)}
                      aria-label={`Remove color ${color.name}`}
                      className="text-[#6B6B65] hover:text-red-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <input
                  type="color"
                  value={newColorHex}
                  onChange={(e) => setNewColorHex(e.target.value)}
                  aria-label="Choose color hex"
                  className="w-9 h-8 p-0.5 bg-white border border-[#E5E4DF] rounded-lg cursor-pointer"
                />
                <input
                  type="text"
                  value={newColorName}
                  onChange={(e) => setNewColorName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddColor();
                    }
                  }}
                  placeholder="Color name (e.g. Moss Green, Bone)"
                  className="flex-1 min-w-[180px] px-3 py-1.5 text-xs bg-white border border-[#E5E4DF] rounded-lg text-[#1A1A1A] placeholder-[#6B6B65] focus:outline-none focus:ring-2 focus:ring-[#1F3A2E]"
                />
                <button
                  type="button"
                  onClick={handleAddColor}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-white border border-[#E5E4DF] rounded-lg text-[#1A1A1A] hover:bg-[#E8EDE9]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Color
                </button>
              </div>
            </div>

            {/* Matrix Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleGenerateMatrix}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#1F3A2E] hover:bg-[#162a21] rounded-lg transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    Generate Matrix ({selectedSizes.length} × {colors.length})
                  </span>
                </button>
                <button
                  type="button"
                  onClick={handleAddSingleVariantRow}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#1A1A1A] bg-white border border-[#E5E4DF] hover:bg-[#F7F6F2] rounded-lg transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Row</span>
                </button>
              </div>

              {variants.length > 0 && (
                <span className="text-xs font-medium text-[#6B6B65]">
                  {variants.length} variant{variants.length === 1 ? '' : 's'} configured
                </span>
              )}
            </div>

            {variantError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{variantError}</span>
              </div>
            )}

            {/* Bulk Fill Row */}
            {variants.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg bg-[#E8EDE9]/60 border border-[#1F3A2E]/15">
                <span className="text-xs font-semibold text-[#1F3A2E] mr-1">Bulk fill:</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={bulkPrice}
                  onChange={(e) => setBulkPrice(e.target.value)}
                  placeholder="Price (₹)"
                  className="w-28 px-2.5 py-1.5 text-xs bg-white border border-[#E5E4DF] rounded-md text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#1F3A2E]"
                />
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={bulkStock}
                  onChange={(e) => setBulkStock(e.target.value)}
                  placeholder="Stock qty"
                  className="w-24 px-2.5 py-1.5 text-xs bg-white border border-[#E5E4DF] rounded-md text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#1F3A2E]"
                />
                <button
                  type="button"
                  onClick={handleBulkFill}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-[#1F3A2E] hover:bg-[#162a21] rounded-md transition-colors"
                >
                  Apply to All
                </button>
              </div>
            )}

            {/* Variants Table */}
            {variants.length > 0 ? (
              <div className="overflow-x-auto border border-[#E5E4DF] rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#FAF9F6] border-b border-[#E5E4DF] text-[#6B6B65] uppercase tracking-wider">
                    <tr>
                      <th className="px-3 py-2.5 font-semibold">Size</th>
                      <th className="px-3 py-2.5 font-semibold">Color</th>
                      <th className="px-3 py-2.5 font-semibold">SKU</th>
                      <th className="px-3 py-2.5 font-semibold">Price (₹)</th>
                      <th className="px-3 py-2.5 font-semibold">Compare-at (₹)</th>
                      <th className="px-3 py-2.5 font-semibold">Barcode</th>
                      <th className="px-3 py-2.5 font-semibold">Stock</th>
                      <th className="px-3 py-2.5 text-right font-semibold">Remove</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E4DF] bg-white">
                    {variants.map((row) => (
                      <tr key={row.id} className="hover:bg-[#FAF9F6]">
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={row.size}
                            onChange={(e) =>
                              handleUpdateVariantField(row.id, 'size', e.target.value)
                            }
                            aria-label="Variant size"
                            className="w-16 px-2 py-1 text-xs font-medium bg-white border border-[#E5E4DF] rounded-md focus:outline-none focus:ring-1 focus:ring-[#1F3A2E]"
                          />
                          {variantFieldErrors[row.id]?.size && (
                            <p className="mt-1 text-[10px] text-red-600">{variantFieldErrors[row.id]?.size}</p>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-black/15 flex-shrink-0"
                              style={{ backgroundColor: row.colorHex }}
                            />
                            <input
                              type="text"
                              value={row.color}
                              onChange={(e) =>
                                handleUpdateVariantField(row.id, 'color', e.target.value)
                              }
                              aria-label="Variant color"
                              className="w-24 px-2 py-1 text-xs bg-white border border-[#E5E4DF] rounded-md focus:outline-none focus:ring-1 focus:ring-[#1F3A2E]"
                            />
                          </div>
                          {variantFieldErrors[row.id]?.color && (
                            <p className="mt-1 text-[10px] text-red-600">{variantFieldErrors[row.id]?.color}</p>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={row.sku}
                            onChange={(e) =>
                              handleUpdateVariantField(
                                row.id,
                                'sku',
                                e.target.value.toUpperCase(),
                              )
                            }
                            aria-label="Variant SKU"
                            className="w-36 px-2 py-1 text-xs font-mono bg-white border border-[#E5E4DF] rounded-md focus:outline-none focus:ring-1 focus:ring-[#1F3A2E]"
                          />
                          {variantFieldErrors[row.id]?.sku && (
                            <p className="mt-1 text-[10px] text-red-600">{variantFieldErrors[row.id]?.sku}</p>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={row.priceRupees}
                            onChange={(e) =>
                              handleUpdateVariantField(row.id, 'priceRupees', e.target.value)
                            }
                            placeholder={watchedBasePrice || 'Base'}
                            aria-label="Variant price in rupees"
                            className="w-24 px-2 py-1 text-xs bg-white border border-[#E5E4DF] rounded-md focus:outline-none focus:ring-1 focus:ring-[#1F3A2E]"
                          />
                          {variantFieldErrors[row.id]?.priceRupees && (
                            <p className="mt-1 text-[10px] text-red-600">{variantFieldErrors[row.id]?.priceRupees}</p>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={row.compareAtRupees}
                            onChange={(e) =>
                              handleUpdateVariantField(row.id, 'compareAtRupees', e.target.value)
                            }
                            placeholder="—"
                            aria-label="Variant compare-at price"
                            className="w-24 px-2 py-1 text-xs bg-white border border-[#E5E4DF] rounded-md focus:outline-none focus:ring-1 focus:ring-[#1F3A2E]"
                          />
                          {variantFieldErrors[row.id]?.compareAtRupees && (
                            <p className="mt-1 text-[10px] text-red-600">{variantFieldErrors[row.id]?.compareAtRupees}</p>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={row.barcode}
                            onChange={(e) => handleUpdateVariantField(row.id, 'barcode', e.target.value)}
                            aria-label="Variant barcode"
                            className="w-28 px-2 py-1 text-xs font-mono bg-white border border-[#E5E4DF] rounded-md focus:outline-none focus:ring-1 focus:ring-[#1F3A2E]"
                          />
                          {variantFieldErrors[row.id]?.barcode && (
                            <p className="mt-1 text-[10px] text-red-600">{variantFieldErrors[row.id]?.barcode}</p>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={row.stock}
                            onChange={(e) =>
                              handleUpdateVariantField(row.id, 'stock', e.target.value)
                            }
                            aria-label="Variant stock quantity"
                            className="w-20 px-2 py-1 text-xs bg-white border border-[#E5E4DF] rounded-md focus:outline-none focus:ring-1 focus:ring-[#1F3A2E]"
                          />
                          {variantFieldErrors[row.id]?.stock && (
                            <p className="mt-1 text-[10px] text-red-600">{variantFieldErrors[row.id]?.stock}</p>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveVariant(row.id)}
                            aria-label={`Remove variant ${row.sku}`}
                            className="p-1.5 text-[#6B6B65] hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center rounded-xl border border-dashed border-[#E5E4DF] bg-[#FAF9F6]">
                <p className="text-sm font-medium text-[#1A1A1A]">No variants generated yet</p>
                <p className="mt-1 text-xs text-[#6B6B65]">
                  Select sizes and colors above, then click &ldquo;Generate Matrix&rdquo;.
                </p>
              </div>
            )}
          </section>

          {/* Section 4 — Apparel Details */}
          <section className="bg-white border border-[#E5E4DF] rounded-xl p-6 space-y-5">
            <div className="flex items-center gap-2.5 border-b border-[#E5E4DF] pb-4">
              <div className="w-8 h-8 rounded-lg bg-[#E8EDE9] text-[#1F3A2E] flex items-center justify-center">
                <Shirt className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-serif text-lg font-semibold text-[#1A1A1A]">
                  Apparel Details
                </h2>
                <p className="text-xs text-[#6B6B65]">
                  Fabric composition, silhouette fit, and garment care instructions.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="product-material"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#6B6B65] mb-1.5"
                >
                  Material
                </label>
                <input
                  id="product-material"
                  type="text"
                  placeholder="e.g. 100% Organic Cotton, 280 GSM French Terry"
                  {...register('material')}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E5E4DF] rounded-lg text-[#1A1A1A] placeholder-[#6B6B65] focus:outline-none focus:ring-2 focus:ring-[#1F3A2E]"
                />
              </div>

              <div>
                <label
                  htmlFor="product-fit"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#6B6B65] mb-1.5"
                >
                  Fit Type
                </label>
                <select
                  id="product-fit"
                  {...register('fitType')}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E5E4DF] rounded-lg text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#1F3A2E]"
                >
                  {FIT_OPTIONS.map((fit) => (
                    <option key={fit} value={fit}>
                      {fit}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#6B6B65]">
                  Care Instructions
                </span>
                <button
                  type="button"
                  onClick={handleAddCareInstruction}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#1F3A2E] hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add instruction
                </button>
              </div>

              <div className="space-y-2">
                {careInstructions.map((item) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <select
                      value={item.icon}
                      onChange={(e) =>
                        handleUpdateCareInstruction(item.id, 'icon', e.target.value)
                      }
                      aria-label="Care instruction icon"
                      className="w-36 px-2.5 py-2 text-xs bg-white border border-[#E5E4DF] rounded-lg text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#1F3A2E]"
                    >
                      {CARE_ICON_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={item.text}
                      onChange={(e) =>
                        handleUpdateCareInstruction(item.id, 'text', e.target.value)
                      }
                      placeholder="e.g. Wash inside out at 30°C"
                      className="flex-1 px-3 py-2 text-sm bg-white border border-[#E5E4DF] rounded-lg text-[#1A1A1A] placeholder-[#6B6B65] focus:outline-none focus:ring-2 focus:ring-[#1F3A2E]"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveCareInstruction(item.id)}
                      aria-label="Remove care instruction"
                      className="p-2 text-[#6B6B65] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* ─── Sidebar Column (Sections 5–6) ───────────────────────────────── */}
        <div className="lg:col-span-4 space-y-6">
          {/* Section 6 — Publishing */}
          <section className="bg-white border border-[#E5E4DF] rounded-xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[#E5E4DF] pb-4">
              <h2 className="font-serif text-lg font-semibold text-[#1A1A1A]">Publishing</h2>
              <StatusBadge status={watchedIsActive ? 'active' : 'draft'} />
            </div>

            {/* Active / Draft Toggle */}
            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 rounded-lg bg-[#FAF9F6] border border-[#E5E4DF] cursor-pointer">
                <div>
                  <span className="block text-sm font-medium text-[#1A1A1A]">
                    Product Status
                  </span>
                  <span className="text-xs text-[#6B6B65]">
                    {watchedIsActive ? 'Visible on storefront' : 'Saved as hidden draft'}
                  </span>
                </div>
                <input
                  type="checkbox"
                  {...register('isActive')}
                  className="w-4 h-4 rounded border-[#E5E4DF] text-[#1F3A2E] focus:ring-[#1F3A2E]"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-lg bg-white border border-[#E5E4DF] cursor-pointer">
                <div>
                  <span className="block text-sm font-medium text-[#1A1A1A]">Featured</span>
                  <span className="text-xs text-[#6B6B65]">Highlight on homepage collections</span>
                </div>
                <input
                  type="checkbox"
                  {...register('featured')}
                  className="w-4 h-4 rounded border-[#E5E4DF] text-[#1F3A2E] focus:ring-[#1F3A2E]"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-lg bg-white border border-[#E5E4DF] cursor-pointer">
                <div>
                  <span className="block text-sm font-medium text-[#1A1A1A]">New Arrival</span>
                  <span className="text-xs text-[#6B6B65]">Display in New Drops feed</span>
                </div>
                <input
                  type="checkbox"
                  {...register('newArrival')}
                  className="w-4 h-4 rounded border-[#E5E4DF] text-[#1F3A2E] focus:ring-[#1F3A2E]"
                />
              </label>

              <div>
                <label
                  htmlFor="product-available-from"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#6B6B65] mb-1.5"
                >
                  Available From
                </label>
                <input
                  id="product-available-from"
                  type="date"
                  {...register('availableFrom')}
                  className="w-full px-3 py-2 text-sm bg-white border border-[#E5E4DF] rounded-lg text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#1F3A2E]"
                />
              </div>
            </div>

            <div className="pt-2 space-y-2.5 border-t border-[#E5E4DF]">
              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#1F3A2E] hover:bg-[#162a21] rounded-lg transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{submitting ? 'Saving Product...' : 'Save Product'}</span>
              </button>

              <button
                type="button"
                onClick={requestClose}
                className="w-full inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium text-[#1A1A1A] bg-white border border-[#E5E4DF] hover:bg-[#F7F6F2] rounded-lg transition-colors"
              >
                Discard Changes
              </button>
            </div>
          </section>

          {/* Section 5 — SEO */}
          <section className="bg-white border border-[#E5E4DF] rounded-xl p-6 space-y-5">
            <div className="flex items-center gap-2.5 border-b border-[#E5E4DF] pb-4">
              <div className="w-8 h-8 rounded-lg bg-[#E8EDE9] text-[#1F3A2E] flex items-center justify-center">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-serif text-lg font-semibold text-[#1A1A1A]">
                  Search &amp; Social SEO
                </h2>
                <p className="text-xs text-[#6B6B65]">
                  Customize metadata and preview social sharing cards.
                </p>
              </div>
            </div>

            {/* URL Slug */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="product-slug"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#6B6B65]"
                >
                  URL Slug <span className="text-red-600">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setSlugManuallyEdited(false);
                    setValue('slug', slugify(watchedName), { shouldDirty: true });
                  }}
                  className="text-[11px] font-medium text-[#1F3A2E] hover:underline"
                >
                  Auto-generate
                </button>
              </div>
              <input
                id="product-slug"
                type="text"
                placeholder="heavyweight-boxy-tee"
                {...register('slug', {
                  onChange: () => setSlugManuallyEdited(true),
                })}
                className="w-full px-3 py-2 text-xs font-mono bg-white border border-[#E5E4DF] rounded-lg text-[#1A1A1A] placeholder-[#6B6B65] focus:outline-none focus:ring-2 focus:ring-[#1F3A2E]"
              />
              {errors.slug && (
                <p className="mt-1 text-xs text-red-600">{errors.slug.message}</p>
              )}
            </div>

            {/* Meta Title */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="product-meta-title"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#6B6B65]"
                >
                  Meta Title
                </label>
                <span
                  className={`text-xs ${
                    watchedMetaTitle.length > 55 ? 'text-amber-700 font-medium' : 'text-[#6B6B65]'
                  }`}
                >
                  {watchedMetaTitle.length}/60
                </span>
              </div>
              <input
                id="product-meta-title"
                type="text"
                maxLength={60}
                placeholder="SEO page title..."
                {...register('metaTitle')}
                className="w-full px-3 py-2 text-sm bg-white border border-[#E5E4DF] rounded-lg text-[#1A1A1A] placeholder-[#6B6B65] focus:outline-none focus:ring-2 focus:ring-[#1F3A2E]"
              />
              {errors.metaTitle && (
                <p className="mt-1 text-xs text-red-600">{errors.metaTitle.message}</p>
              )}
            </div>

            {/* Meta Description */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="product-meta-desc"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#6B6B65]"
                >
                  Meta Description
                </label>
                <span
                  className={`text-xs ${
                    watchedMetaDescription.length > 145
                      ? 'text-amber-700 font-medium'
                      : 'text-[#6B6B65]'
                  }`}
                >
                  {watchedMetaDescription.length}/160
                </span>
              </div>
              <textarea
                id="product-meta-desc"
                rows={3}
                maxLength={160}
                placeholder="Concise summary for search engines and social previews..."
                {...register('metaDescription')}
                className="w-full px-3 py-2 text-sm bg-white border border-[#E5E4DF] rounded-lg text-[#1A1A1A] placeholder-[#6B6B65] focus:outline-none focus:ring-2 focus:ring-[#1F3A2E]"
              />
              {errors.metaDescription && (
                <p className="mt-1 text-xs text-red-600">{errors.metaDescription.message}</p>
              )}
            </div>

            {/* Social Preview Card Mockup */}
            <div className="space-y-2 pt-1">
              <span className="block text-xs font-semibold uppercase tracking-wider text-[#6B6B65]">
                Social Preview Card
              </span>
              <div className="rounded-xl border border-[#E5E4DF] overflow-hidden bg-[#FAF9F6]">
                <div className="h-32 bg-[#E8EDE9] flex items-center justify-center overflow-hidden">
                  {images[0]?.url ? (
                    <img
                      src={images[0].url}
                      alt={previewTitle}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center text-[#6B6B65] text-xs gap-1">
                      <ImageIcon className="w-5 h-5" />
                      <span>Primary image preview</span>
                    </div>
                  )}
                </div>
                <div className="p-3.5 bg-white space-y-1">
                  <p className="text-[11px] text-[#6B6B65] truncate">
                    nexto.store/products/{previewSlug}
                  </p>
                  <p className="text-sm font-semibold text-[#1A1A1A] line-clamp-1">
                    {previewTitle}
                  </p>
                  <p className="text-xs text-[#6B6B65] line-clamp-2 leading-relaxed">
                    {previewDesc}
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </form>

      <ConfirmModal
        open={showLeaveModal}
        title="Discard unsaved changes?"
        description="You have unsaved changes in this product editor. Leaving now will permanently discard them."
        confirmLabel="Discard Changes"
        cancelLabel="Keep Editing"
        isDangerous
        onConfirm={() => {
          setShowLeaveModal(false);
          onClose();
        }}
        onCancel={() => setShowLeaveModal(false)}
      />
    </div>
  );
};

// ─── Main Products Page ──────────────────────────────────────────────────────

export const ProductsPage: React.FC = () => {
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [editorMode, setEditorMode] = useState<EditorMode>(() =>
    location.pathname.endsWith('/new') ? 'create' : null,
  );
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [pagination, setPagination] = useState<ProductsPagination>({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [deleteModal, setDeleteModal] = useState<DeleteModalState>(null);

  // Read URL-synced filters
  const page = Math.max(1, Number(searchParams.get('page') || '1') || 1);
  const search = searchParams.get('search') || '';
  const categoryFilter = searchParams.get('category') || '';
  const statusFilter = searchParams.get('status') || '';
  const audienceFilter = searchParams.get('audience') || '';

  useEffect(() => {
    if (location.pathname.endsWith('/new') && editorMode === null) {
      setEditorMode('create');
    } else if (!location.pathname.endsWith('/new') && editorMode === 'create') {
      setEditorMode(null);
    }
  }, [editorMode, location.pathname]);

  // Load categories once for filter dropdown & editor autocomplete
  useEffect(() => {
    let active = true;
    api
      .get<CategoriesResponse | CategoryItem[]>('/categories')
      .then((res) => {
        if (!active) return;
        const list = Array.isArray(res) ? res : res.categories ?? [];
        setCategories(list);
      })
      .catch(() => {
        if (active) {
          toast({ message: 'Categories could not be loaded. You can still enter a category name.', type: 'error' });
        }
      });
    return () => {
      active = false;
    };
  }, [toast]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '12');
      if (search.trim()) params.set('search', search.trim());
      if (categoryFilter.trim()) params.set('category', categoryFilter.trim());
      if (statusFilter) params.set('status', statusFilter);
      if (audienceFilter) params.set('audience', audienceFilter);

      const result = await api.get<ProductsListResponse>(`/admin/products?${params.toString()}`);
      setProducts(result.products ?? []);
      if (result.pagination) {
        setPagination(result.pagination);
      }
      setSelectedRows(new Set());
    } catch (err: unknown) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
          ? err.message
          : 'Unable to load products.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [page, search, categoryFilter, statusFilter, audienceFilter]);

  useEffect(() => {
    if (editorMode === null) {
      void fetchProducts();
    }
  }, [fetchProducts, editorMode]);

  // Apply client-side filters for status, audience, and SKU substring match
  const visibleProducts = useMemo(() => {
    return products.filter((item) => {
      if (statusFilter === 'active' && !item.isActive) return false;
      if (statusFilter === 'draft' && item.isActive) return false;
      if (audienceFilter && (item.audience ?? 'unisex') !== audienceFilter) return false;
      return true;
    });
  }, [products, statusFilter, audienceFilter]);

  const categoryOptions = useMemo(() => {
    const names = new Set<string>();
    categories.forEach((c) => names.add(c.name));
    products.forEach((p) => {
      if (p.category) names.add(p.category);
    });
    return Array.from(names)
      .sort((a, b) => a.localeCompare(b))
      .map((name) => ({ value: name, label: name }));
  }, [categories, products]);

  const filterConfigs: FilterConfig[] = useMemo(
    () => [
      {
        key: 'search',
        label: 'Products',
        type: 'search',
        placeholder: 'Search by product name or SKU...',
      },
      {
        key: 'category',
        label: 'Categories',
        type: 'select',
        placeholder: 'All Categories',
        options: categoryOptions,
      },
      {
        key: 'status',
        label: 'Statuses',
        type: 'select',
        placeholder: 'All Statuses',
        options: [
          { value: 'active', label: 'Active' },
          { value: 'draft', label: 'Draft' },
        ],
      },
      {
        key: 'audience',
        label: 'Audiences',
        type: 'select',
        placeholder: 'All Audiences',
        options: AUDIENCE_OPTIONS,
      },
    ],
    [categoryOptions],
  );

  const filterValues = useMemo(
    () => ({
      search,
      category: categoryFilter,
      status: statusFilter,
      audience: audienceFilter,
    }),
    [search, categoryFilter, statusFilter, audienceFilter],
  );

  const handleFilterChange = useCallback(
    (key: string, value: string) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (value.trim()) {
            next.set(key, value.trim());
          } else {
            next.delete(key);
          }
          next.set('page', '1');
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const handleFilterReset = useCallback(() => {
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  const handlePageChange = useCallback(
    (nextPage: number) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set('page', String(nextPage));
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  // ─── Selection & Bulk Actions ──────────────────────────────────────────────

  const handleSelectRow = useCallback((id: string, checked: boolean) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        setSelectedRows(new Set(visibleProducts.map((p) => p._id)));
      } else {
        setSelectedRows(new Set());
      }
    },
    [visibleProducts],
  );

  const handleBulkStatusUpdate = useCallback(
    async (ids: string[], isActive: boolean) => {
      if (ids.length === 0) return;
      const results = await Promise.allSettled(
        ids.map((id) => api.patch(`/admin/products/${id}`, { isActive })),
      );
      const succeeded = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.length - succeeded;

      if (succeeded > 0) {
        toast({
          message: `${succeeded} product${succeeded === 1 ? '' : 's'} ${
            isActive ? 'activated' : 'archived'
          }.`,
          type: 'success',
        });
      }
      if (failed > 0) {
        toast({
          message: `Failed to update ${failed} product${failed === 1 ? '' : 's'}.`,
          type: 'error',
        });
      }
      setSelectedRows(new Set());
      await fetchProducts();
    },
    [fetchProducts, toast],
  );

  const handleConfirmDelete = async () => {
    if (!deleteModal) return;
    if (deleteModal.type === 'single') {
      try {
        await api.delete(`/admin/products/${deleteModal.product._id}`);
        toast({
          message: `"${deleteModal.product.name}" deleted.`,
          type: 'success',
        });
        setDeleteModal(null);
        await fetchProducts();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to delete product.';
        toast({ message, type: 'error' });
      }
      return;
    }

    const results = await Promise.allSettled(
      deleteModal.ids.map((id) => api.delete(`/admin/products/${id}`)),
    );
    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.length - succeeded;

    if (succeeded > 0) {
      toast({
        message: `${succeeded} product${succeeded === 1 ? '' : 's'} deleted.`,
        type: 'success',
      });
    }
    if (failed > 0) {
      toast({
        message: `Failed to delete ${failed} product${failed === 1 ? '' : 's'}.`,
        type: 'error',
      });
    }
    setDeleteModal(null);
    setSelectedRows(new Set());
    await fetchProducts();
  };

  const bulkActions: BulkAction[] = useMemo(
    () => [
      {
        label: 'Activate',
        onClick: (ids) => {
          void handleBulkStatusUpdate(ids, true);
        },
      },
      {
        label: 'Archive',
        onClick: (ids) => {
          void handleBulkStatusUpdate(ids, false);
        },
      },
      {
        label: 'Delete',
        isDangerous: true,
        onClick: (ids) => {
          setDeleteModal({ type: 'bulk', ids });
        },
      },
    ],
    [handleBulkStatusUpdate],
  );

  // ─── Table Columns ─────────────────────────────────────────────────────────

  const columns: Column<Product>[] = useMemo(
    () => [
      {
        key: 'thumbnail',
        header: 'Image',
        width: '72px',
        render: (row) =>
          row.images[0]?.url ? (
            <img
              src={row.images[0].url}
              alt={row.images[0].alt || row.name}
              className="w-12 h-12 rounded-lg object-cover border border-[#E5E4DF] bg-[#FAF9F6]"
            />
          ) : (
            <div className="w-12 h-12 rounded-lg border border-[#E5E4DF] bg-[#FAF9F6] flex items-center justify-center text-[#6B6B65]">
              <ImageIcon className="w-5 h-5" />
            </div>
          ),
      },
      {
        key: 'name',
        header: 'Product',
        sortable: true,
        render: (row) => (
          <div className="min-w-[180px]">
            <p className="font-medium text-[#1A1A1A] leading-snug">{row.name}</p>
            <p className="text-xs text-[#6B6B65] font-mono mt-0.5 truncate max-w-[240px]">
              /{row.slug}
            </p>
          </div>
        ),
      },
      {
        key: 'category',
        header: 'Category',
        sortable: true,
        render: (row) => (
          <div>
            <p className="text-sm text-[#1A1A1A]">{row.category}</p>
            {row.audience && (
              <span className="inline-block mt-0.5 text-[11px] capitalize text-[#6B6B65]">
                {row.audience}
              </span>
            )}
          </div>
        ),
      },
      {
        key: 'variants',
        header: 'Variants',
        render: (row) => (
          <span className="text-xs font-medium text-[#1A1A1A] whitespace-nowrap">
            {row.variants.length} variant{row.variants.length === 1 ? '' : 's'}
          </span>
        ),
      },
      {
        key: 'price',
        header: 'Price',
        sortable: true,
        render: (row) => (
          <div className="whitespace-nowrap">
            <p className="font-medium text-[#1A1A1A]">{formatPaise(row.price)}</p>
            {row.compareAtPrice !== undefined && row.compareAtPrice > row.price && (
              <p className="text-xs text-[#6B6B65] line-through">
                {formatPaise(row.compareAtPrice)}
              </p>
            )}
          </div>
        ),
      },
      {
        key: 'stock',
        header: 'Stock',
        render: (row) => {
          const summary = getStockSummary(row.variants);
          return (
            <div className="space-y-1 whitespace-nowrap">
              <StatusBadge status={summary.status} variant="stock" />
              <p className="text-[11px] text-[#6B6B65]">{summary.total} units</p>
            </div>
          );
        },
      },
      {
        key: 'isActive',
        header: 'Status',
        render: (row) => <StatusBadge status={row.isActive ? 'active' : 'draft'} />,
      },
      {
        key: 'updatedAt',
        header: 'Updated',
        sortable: true,
        render: (row) => (
          <span className="text-xs text-[#6B6B65] whitespace-nowrap">
            {formatDate(row.updatedAt)}
          </span>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        width: '104px',
        render: (row) => (
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => setEditorMode({ id: row._id, product: row })}
              aria-label={`Edit ${row.name}`}
              title="Edit product"
              className="p-2 rounded-lg text-[#1A1A1A] hover:bg-[#E8EDE9] hover:text-[#1F3A2E] transition-colors"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setDeleteModal({ type: 'single', product: row })}
              aria-label={`Delete ${row.name}`}
              title="Delete product"
              className="p-2 rounded-lg text-[#6B6B65] hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ],
    [],
  );

  // ─── Render Editor View ────────────────────────────────────────────────────

  if (editorMode !== null) {
    return (
      <div className="min-h-full bg-[#F7F6F2] text-[#1A1A1A]">
        <ProductEditor
          mode={editorMode}
          categories={categories}
          onClose={() => {
            if (location.pathname.endsWith('/new')) navigate('/admin/products', { replace: true });
            else setEditorMode(null);
          }}
          onSaved={() => {
            setEditorMode(null);
            navigate('/admin/products', { replace: true });
          }}
        />
      </div>
    );
  }

  // ─── Render List View ──────────────────────────────────────────────────────

  return (
    <div className="space-y-6 bg-[#F7F6F2] text-[#1A1A1A]">
      <PageHeader
        eyebrow="Catalogue"
        title="Products"
        subtitle="Create, organize, and publish NEXTO apparel products and SKU variants."
        actions={
          <button
            type="button"
            onClick={() => navigate('/admin/products/new')}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[#1F3A2E] hover:bg-[#162a21] rounded-lg transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>New Product</span>
          </button>
        }
      />

      <FilterBar
        filters={filterConfigs}
        values={filterValues}
        onChange={handleFilterChange}
        onReset={handleFilterReset}
      />

      {error && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => void fetchProducts()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-800 bg-white border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      )}

      <DataTable<Product>
        columns={columns}
        data={visibleProducts}
        loading={loading}
        keyExtractor={(row) => row._id}
        selectedRows={selectedRows}
        onSelectRow={handleSelectRow}
        onSelectAll={handleSelectAll}
        bulkActions={bulkActions}
        pagination={{
          page: pagination.page,
          totalPages: Math.max(1, pagination.totalPages),
          onPageChange: handlePageChange,
        }}
        emptyState={
          <EmptyState
            icon={<Package className="w-7 h-7" />}
            title="No products found"
            description={
              search || categoryFilter || statusFilter || audienceFilter
                ? 'No products match your active filters. Try resetting them to view the full catalogue.'
                : 'Your catalogue is empty. Create your first NEXTO product to get started.'
            }
            action={
              search || categoryFilter || statusFilter || audienceFilter ? (
                <button
                  type="button"
                  onClick={handleFilterReset}
                  className="px-4 py-2 text-sm font-medium text-[#1A1A1A] bg-white border border-[#E5E4DF] rounded-lg hover:bg-[#F7F6F2] transition-colors"
                >
                  Reset Filters
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate('/admin/products/new')}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#1F3A2E] hover:bg-[#162a21] rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Product</span>
                </button>
              )
            }
          />
        }
      />

      <ConfirmModal
        open={deleteModal !== null}
        title={
          deleteModal?.type === 'bulk'
            ? `Delete ${deleteModal.ids.length} selected products?`
            : `Delete "${deleteModal?.product.name ?? 'product'}"?`
        }
        description={
          deleteModal?.type === 'bulk'
            ? 'These products will be deactivated and removed from active storefront listings. Existing order history will be preserved.'
            : 'This product will be deactivated and removed from storefront listings. Existing order history will be preserved.'
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isDangerous
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteModal(null)}
      />
    </div>
  );
};

export default ProductsPage;
