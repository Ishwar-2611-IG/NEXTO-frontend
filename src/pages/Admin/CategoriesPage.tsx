import React, { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowDown, ArrowUp } from 'lucide-react';
import {
  PageHeader,
  SlideOverDrawer,
  ConfirmModal,
  EmptyState,
  SkeletonTable,
  useToast,
} from '../../components/admin/index';
import { api, ApiError } from '../../services/api';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Category {
  _id: string;
  name: string;
  slug: string;
  isActive: boolean;
  parentId?: string | null;
  description?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  bannerUrl?: string;
  sortOrder?: number;
  productCount?: number;
}

interface CategoriesResponse {
  categories: Category[];
}

// ─── Zod schema ──────────────────────────────────────────────────────────────

const categorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(80, 'Name must be at most 80 characters'),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(100, 'Slug must be at most 100 characters')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must contain lowercase letters, numbers, and hyphens only'),
  parentId: z.string().optional(),
  description: z.string().max(500).optional(),
  imageUrl: z.string().url('Enter a valid image URL').or(z.literal('')).optional(),
  thumbnailUrl: z.string().url('Enter a valid thumbnail URL').or(z.literal('')).optional(),
  bannerUrl: z.string().url('Enter a valid banner URL').or(z.literal('')).optional(),
  isActive: z.boolean(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function nameToSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// ─── Category Form Drawer ─────────────────────────────────────────────────────

interface CategoryDrawerProps {
  open: boolean;
  onClose: () => void;
  editing: Category | null;
  roots: Category[];
  onSaved: () => void;
}

const CategoryDrawer: React.FC<CategoryDrawerProps> = ({ open, onClose, editing, roots, onSaved }) => {
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      slug: '',
      parentId: '',
      description: '',
      imageUrl: '',
      thumbnailUrl: '',
      bannerUrl: '',
      isActive: true,
    },
  });

  const nameValue = watch('name');

  // Auto-generate slug when name changes (only on create, not edit)
  useEffect(() => {
    if (!editing) {
      setValue('slug', nameToSlug(nameValue ?? ''), { shouldValidate: false });
    }
  }, [nameValue, editing, setValue]);

  // Reset form when drawer opens/closes
  useEffect(() => {
    if (open) {
      if (editing) {
        reset({
          name: editing.name,
          slug: editing.slug,
          parentId: editing.parentId ?? '',
          description: editing.description ?? '',
          imageUrl: editing.imageUrl ?? '',
          thumbnailUrl: editing.thumbnailUrl ?? '',
          bannerUrl: editing.bannerUrl ?? '',
          isActive: editing.isActive,
        });
      } else {
        reset({
          name: '',
          slug: '',
          parentId: '',
          description: '',
          imageUrl: '',
          thumbnailUrl: '',
          bannerUrl: '',
          isActive: true,
        });
      }
    }
  }, [open, editing, reset]);

  const onSubmit = async (values: CategoryFormValues) => {
    const payload = {
      name: values.name,
      slug: values.slug,
      isActive: values.isActive,
      description: values.description || '',
      imageUrl: values.imageUrl || '',
      thumbnailUrl: values.thumbnailUrl || '',
      bannerUrl: values.bannerUrl || '',
      ...(values.parentId ? { parentId: values.parentId } : {}),
    };

    try {
      if (editing) {
        await api.patch(`/categories/${editing._id}`, payload);
        toast({ message: 'Category updated successfully', type: 'success' });
      } else {
        await api.post('/categories', payload);
        toast({ message: 'Category created successfully', type: 'success' });
      }
      onSaved();
      onClose();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Something went wrong';
      toast({ message, type: 'error' });
    }
  };

  const availableParents = roots.filter((r) => !editing || r._id !== editing._id);

  return (
    <SlideOverDrawer
      open={open}
      onClose={onClose}
      title={editing ? 'Edit Category' : 'Add Category'}
      width="sm"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-[#1A1A1A] bg-white border border-[#E5E4DF] rounded-lg hover:bg-[#F7F6F2] transition-colors focus:outline-none"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="category-form"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#1F3A2E] rounded-lg hover:bg-[#162a21] transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting && (
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            )}
            {editing ? 'Save Changes' : 'Create Category'}
          </button>
        </>
      }
    >
      <form id="category-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            {...register('name')}
            type="text"
            className="w-full px-3 py-2 text-sm border border-[#E5E4DF] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1F3A2E] focus:border-transparent"
            placeholder="e.g. Men's Clothing"
          />
          {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-[#1A1A1A]">Image URL</label>
          <input
            {...register('imageUrl')}
            type="url"
            className="w-full rounded-lg border border-[#E5E4DF] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1F3A2E]"
            placeholder="https://..."
          />
          {errors.imageUrl && <p className="mt-1 text-xs text-red-600">{errors.imageUrl.message}</p>}
        </div>

        {/* Slug */}
        <div>
          <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
            Slug <span className="text-red-500">*</span>
          </label>
          <input
            {...register('slug')}
            type="text"
            className="w-full px-3 py-2 text-sm font-mono border border-[#E5E4DF] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1F3A2E] focus:border-transparent"
            placeholder="e.g. mens-clothing"
          />
          {errors.slug && <p className="mt-1 text-xs text-red-600">{errors.slug.message}</p>}
        </div>

        {/* Parent Category */}
        <div>
          <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">Parent Category</label>
          <select
            {...register('parentId')}
            className="w-full px-3 py-2 text-sm border border-[#E5E4DF] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1F3A2E] focus:border-transparent"
          >
            <option value="">— None (root category) —</option>
            {availableParents.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">Description</label>
          <textarea
            {...register('description')}
            rows={3}
            className="w-full px-3 py-2 text-sm border border-[#E5E4DF] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1F3A2E] focus:border-transparent resize-none"
            placeholder="Optional description..."
          />
          {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-[#1A1A1A]">Thumbnail URL</label>
          <input
            {...register('thumbnailUrl')}
            type="url"
            className="w-full rounded-lg border border-[#E5E4DF] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1F3A2E]"
            placeholder="https://..."
          />
          {errors.thumbnailUrl && <p className="mt-1 text-xs text-red-600">{errors.thumbnailUrl.message}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-[#1A1A1A]">Banner URL</label>
          <input
            {...register('bannerUrl')}
            type="url"
            className="w-full rounded-lg border border-[#E5E4DF] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1F3A2E]"
            placeholder="https://..."
          />
          {errors.bannerUrl && <p className="mt-1 text-xs text-red-600">{errors.bannerUrl.message}</p>}
        </div>

        {/* isActive toggle */}
        <div className="flex items-center justify-between p-3 bg-[#F7F6F2] rounded-lg border border-[#E5E4DF]">
          <div>
            <p className="text-sm font-medium text-[#1A1A1A]">Active</p>
            <p className="text-xs text-[#6B6B65]">Visible to customers on the storefront</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={watch('isActive')}
            onClick={() => setValue('isActive', !watch('isActive'), { shouldValidate: true })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#1F3A2E] focus:ring-offset-1 ${
              watch('isActive') ? 'bg-[#1F3A2E]' : 'bg-[#E5E4DF]'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                watch('isActive') ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </form>
    </SlideOverDrawer>
  );
};

// ─── Category Row ─────────────────────────────────────────────────────────────

interface CategoryRowProps {
  category: Category;
  children: Category[];
  siblings: Category[];
  onMove: (category: Category, direction: -1 | 1, siblings: Category[]) => void;
  onEdit: (cat: Category) => void;
  onDelete: (cat: Category) => void;
  onToggleActive: (cat: Category) => void;
  expanded: boolean;
  onToggleExpand: (id: string) => void;
  isChild?: boolean;
}

const CategoryRow: React.FC<CategoryRowProps> = ({
  category,
  children,
  siblings,
  onMove,
  onEdit,
  onDelete,
  onToggleActive,
  expanded,
  onToggleExpand,
  isChild = false,
}) => {
  const hasChildren = children.length > 0;

  return (
    <>
      <tr className="border-b border-[#E5E4DF] hover:bg-[#FAF9F6] transition-colors">
        <td className={`px-6 py-3.5 ${isChild ? 'pl-14' : ''}`}>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onMove(category, -1, siblings)}
              disabled={siblings.findIndex((item) => item._id === category._id) <= 0}
              className="rounded p-1 text-[#6B6B65] hover:bg-[#F7F6F2] disabled:opacity-30"
              aria-label={`Move ${category.name} up`}
            >
              <ArrowUp size={14} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => onMove(category, 1, siblings)}
              disabled={siblings.findIndex((item) => item._id === category._id) >= siblings.length - 1}
              className="rounded p-1 text-[#6B6B65] hover:bg-[#F7F6F2] disabled:opacity-30"
              aria-label={`Move ${category.name} down`}
            >
              <ArrowDown size={14} aria-hidden="true" />
            </button>
            {!isChild && hasChildren && (
              <button
                type="button"
                onClick={() => onToggleExpand(category._id)}
                className="flex-shrink-0 p-0.5 rounded text-[#6B6B65] hover:text-[#1A1A1A] transition-colors"
                aria-label={expanded ? 'Collapse' : 'Expand'}
              >
                <svg
                  className={`w-4 h-4 transition-transform ${expanded ? 'rotate-90' : ''}`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
            {!isChild && !hasChildren && <span className="w-5 flex-shrink-0" />}
            <span className="text-sm font-medium text-[#1A1A1A]">{category.name}</span>
          </div>
        </td>
        <td className="px-6 py-3.5">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-[#F7F6F2] border border-[#E5E4DF] text-[#6B6B65]">
            {category.slug}
          </span>
        </td>
        <td className="px-6 py-3.5">
          <button
            type="button"
            onClick={() => onToggleActive(category)}
            title={category.isActive ? 'Click to hide' : 'Click to activate'}
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border transition-opacity hover:opacity-80 ${
              category.isActive
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-[#FAF9F6] text-[#6B6B65] border-[#E5E4DF]'
            }`}
          >
            <span
              className={`inline-block w-1.5 h-1.5 rounded-full ${category.isActive ? 'bg-emerald-500' : 'bg-[#6B6B65]'}`}
            />
            {category.isActive ? 'Active' : 'Hidden'}
          </button>
        </td>
        <td className="px-6 py-3.5 text-sm text-[#6B6B65]">{category.productCount ?? 0}</td>
        <td className="px-6 py-3.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onEdit(category)}
              className="p-1.5 rounded-lg text-[#6B6B65] hover:text-[#1A1A1A] hover:bg-[#F7F6F2] transition-colors"
              aria-label="Edit category"
            >
              <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => onDelete(category)}
              className="p-1.5 rounded-lg text-[#6B6B65] hover:text-red-600 hover:bg-red-50 transition-colors"
              aria-label="Delete category"
            >
              <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </button>
          </div>
        </td>
      </tr>
      {/* Children */}
      {expanded &&
        children.map((child) => (
          <CategoryRow
            key={child._id}
            category={child}
            children={[]}
            siblings={children}
            onMove={onMove}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggleActive={onToggleActive}
            expanded={false}
            onToggleExpand={() => undefined}
            isChild
          />
        ))}
    </>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CategoriesPage() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<CategoriesResponse>('/categories/admin');
      setCategories(data.categories ?? []);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to load categories';
      toast({ message, type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const handleMoveCategory = async (
    category: Category,
    direction: -1 | 1,
    siblings: Category[],
  ) => {
    const from = siblings.findIndex((item) => item._id === category._id);
    const to = from + direction;
    if (from < 0 || to < 0 || to >= siblings.length) return;
    const reordered = [...siblings];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(to, 0, moved);
    try {
      await api.patch('/categories/reorder', {
        categoryIds: reordered.map((item) => item._id),
      });
      await fetchCategories();
    } catch (error) {
      toast({
        message: error instanceof ApiError ? error.message : 'Failed to reorder categories.',
        type: 'error',
      });
    }
  };

  useEffect(() => {
    void fetchCategories();
  }, [fetchCategories]);

  const handleToggleActive = async (cat: Category) => {
    const updated = { ...cat, isActive: !cat.isActive };
    setCategories((prev) => prev.map((c) => (c._id === cat._id ? updated : c)));
    try {
      await api.patch(`/categories/${cat._id}`, {
        name: cat.name,
        slug: cat.slug,
        isActive: !cat.isActive,
        description: cat.description ?? '',
        imageUrl: cat.imageUrl ?? '',
        ...(cat.parentId ? { parentId: cat.parentId } : {}),
        thumbnailUrl: cat.thumbnailUrl ?? '',
        bannerUrl: cat.bannerUrl ?? '',
        sortOrder: cat.sortOrder ?? 0,
      });
      toast({ message: `Category ${updated.isActive ? 'activated' : 'hidden'}`, type: 'success' });
    } catch (err) {
      setCategories((prev) => prev.map((c) => (c._id === cat._id ? cat : c)));
      const message = err instanceof ApiError ? err.message : 'Failed to update category';
      toast({ message, type: 'error' });
    }
  };

  const handleDelete = async () => {
    if (!deletingCategory) return;
    try {
      await api.delete(`/categories/${deletingCategory._id}`);
      toast({ message: 'Category deactivated', type: 'success' });
      setDeletingCategory(null);
      void fetchCategories();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to delete category';
      toast({ message, type: 'error' });
    }
  };

  const handleToggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Build tree
  const roots = categories.filter((c) => !c.parentId);
  const childrenMap = new Map<string, Category[]>();
  for (const cat of categories) {
    if (cat.parentId) {
      const existing = childrenMap.get(cat.parentId) ?? [];
      existing.push(cat);
      childrenMap.set(cat.parentId, existing);
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F6F2] p-6">
      <div className="max-w-6xl mx-auto">
        <PageHeader
          title="Categories"
          eyebrow="Catalogue"
          actions={
            <button
              type="button"
              onClick={() => { setEditingCategory(null); setDrawerOpen(true); }}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#1F3A2E] rounded-lg hover:bg-[#162a21] transition-colors focus:outline-none focus:ring-2 focus:ring-[#1F3A2E] focus:ring-offset-2"
            >
              <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add Category
            </button>
          }
        />

        {loading ? (
          <SkeletonTable rows={5} cols={5} />
        ) : categories.length === 0 ? (
          <EmptyState
            title="No categories yet"
            description="Create your first category to organise your catalogue."
            action={
              <button
                type="button"
                onClick={() => { setEditingCategory(null); setDrawerOpen(true); }}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#1F3A2E] rounded-lg hover:bg-[#162a21] transition-colors"
              >
                Add Category
              </button>
            }
          />
        ) : (
          <div className="bg-white border border-[#E5E4DF] rounded-xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-[#FAF9F6] border-b border-[#E5E4DF]">
                  <tr>
                    <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-[#6B6B65]">Name</th>
                    <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-[#6B6B65]">Slug</th>
                    <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-[#6B6B65]">Status</th>
                    <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-[#6B6B65]">Products</th>
                    <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-[#6B6B65]">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {roots.map((cat) => (
                    <CategoryRow
                      key={cat._id}
                      category={cat}
                      children={childrenMap.get(cat._id) ?? []}
                      siblings={roots}
                      onMove={handleMoveCategory}
                      onEdit={(c) => { setEditingCategory(c); setDrawerOpen(true); }}
                      onDelete={setDeletingCategory}
                      onToggleActive={handleToggleActive}
                      expanded={expandedIds.has(cat._id)}
                      onToggleExpand={handleToggleExpand}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <CategoryDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        editing={editingCategory}
        roots={roots}
        onSaved={fetchCategories}
      />

      <ConfirmModal
        open={deletingCategory !== null}
        title="Delete Category"
        description="This category will be deactivated. Products assigned to it will be uncategorized. Continue?"
        confirmLabel="Deactivate"
        isDangerous
        onConfirm={handleDelete}
        onCancel={() => setDeletingCategory(null)}
      />
    </div>
  );
}
