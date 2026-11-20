import { useCallback, useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { ImagePlus, Pencil, Plus, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  ConfirmModal,
  EmptyState,
  ImageUploadZone,
  PageHeader,
  SkeletonTable,
  StatusBadge,
  useToast,
} from '../../components/admin';
import type { ImageUploadItem } from '../../components/admin';
import { api, ApiError } from '../../services/api';

interface Banner {
  _id: string;
  title: string;
  eyebrow: string;
  description: string;
  image: ImageUploadItem;
  mobileImage?: ImageUploadItem;
  href: string;
  ctaLabel: string;
  isActive: boolean;
  sortOrder: number;
  startsAt?: string;
  endsAt?: string;
}

interface BannerListResponse {
  banners: Banner[];
}

const bannerFormSchema = z.object({
  title: z.string().trim().min(2, 'Title must be at least 2 characters').max(120),
  eyebrow: z.string().trim().max(100),
  description: z.string().trim().max(500),
  href: z.string().trim().min(1, 'Destination is required').max(500)
    .refine((value) => value.startsWith('/') && !value.startsWith('//') || /^https:\/\//i.test(value), 'Use a site path or HTTPS URL'),
  ctaLabel: z.string().trim().max(80),
  isActive: z.boolean(),
  sortOrder: z.number().int().min(0).max(10000),
  startsAt: z.string(),
  endsAt: z.string(),
}).refine(
  (value) => !value.startsAt || !value.endsAt || new Date(value.endsAt) > new Date(value.startsAt),
  { message: 'End date must be after the start date', path: ['endsAt'] },
);

type BannerFormValues = z.infer<typeof bannerFormSchema>;

const emptyValues: BannerFormValues = {
  title: '',
  eyebrow: '',
  description: '',
  href: '/collections',
  ctaLabel: 'Shop now',
  isActive: true,
  sortOrder: 0,
  startsAt: '',
  endsAt: '',
};

function toLocalDateTime(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export default function BannersPage() {
  const { toast } = useToast();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [image, setImage] = useState<ImageUploadItem | null>(null);
  const [mobileImage, setMobileImage] = useState<ImageUploadItem | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [mobileUrlInput, setMobileUrlInput] = useState('');
  const [importing, setImporting] = useState<'desktop' | 'mobile' | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Banner | null>(null);

  const form = useForm<BannerFormValues>({
    resolver: zodResolver(bannerFormSchema),
    defaultValues: emptyValues,
  });

  const fetchBanners = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const result = await api.get<BannerListResponse>('/admin/banners');
      setBanners(result.banners);
    } catch (error: unknown) {
      const message = error instanceof ApiError ? error.message : 'Unable to load banners.';
      setLoadError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchBanners();
  }, [fetchBanners]);

  const resetEditor = () => {
    setEditing(null);
    setEditorOpen(false);
    setImage(null);
    setMobileImage(null);
    setUrlInput('');
    setMobileUrlInput('');
    form.reset(emptyValues);
  };

  const startCreate = () => {
    resetEditor();
    setEditorOpen(true);
  };

  const startEdit = (banner: Banner) => {
    setEditorOpen(true);
    setEditing(banner);
    setImage(banner.image);
    setMobileImage(banner.mobileImage ?? null);
    setUrlInput('');
    setMobileUrlInput('');
    form.reset({
      title: banner.title,
      eyebrow: banner.eyebrow ?? '',
      description: banner.description ?? '',
      href: banner.href ?? '/collections',
      ctaLabel: banner.ctaLabel ?? '',
      isActive: banner.isActive,
      sortOrder: banner.sortOrder,
      startsAt: toLocalDateTime(banner.startsAt),
      endsAt: toLocalDateTime(banner.endsAt),
    });
  };

  const importImageUrl = async (target: 'desktop' | 'mobile') => {
    const url = target === 'desktop' ? urlInput.trim() : mobileUrlInput.trim();
    if (!url) return;
    setImporting(target);
    try {
      const uploaded = await api.post<ImageUploadItem>('/admin/upload', { folder: 'banners', url });
      if (target === 'desktop') {
        setImage(uploaded);
        setUrlInput('');
      } else {
        setMobileImage(uploaded);
        setMobileUrlInput('');
      }
      toast({ message: 'Banner image imported to Cloudinary', type: 'success' });
    } catch (error: unknown) {
      toast({ message: error instanceof Error ? error.message : 'Unable to import image.', type: 'error' });
    } finally {
      setImporting(null);
    }
  };

  const onSubmit = form.handleSubmit(async (values) => {
    if (!image?.publicId || !image.url) {
      toast({ message: 'Upload a desktop banner image before saving.', type: 'error' });
      return;
    }
    setSaving(true);
    const payload = {
      ...values,
      image,
      ...(mobileImage?.publicId
        ? { mobileImage }
        : editing?.mobileImage ? { mobileImage: null } : {}),
      startsAt: values.startsAt ? new Date(values.startsAt).toISOString() : editing ? null : undefined,
      endsAt: values.endsAt ? new Date(values.endsAt).toISOString() : editing ? null : undefined,
    };
    try {
      if (editing) {
        await api.put(`/admin/banners/${editing._id}`, payload);
        toast({ message: 'Banner updated successfully', type: 'success' });
      } else {
        await api.post('/admin/banners', payload);
        toast({ message: 'Banner created successfully', type: 'success' });
      }
      resetEditor();
      await fetchBanners();
    } catch (error: unknown) {
      toast({ message: error instanceof Error ? error.message : 'Unable to save banner.', type: 'error' });
    } finally {
      setSaving(false);
    }
  });

  const toggleActive = async (banner: Banner) => {
    setBanners((current) => current.map((item) => item._id === banner._id ? { ...item, isActive: !banner.isActive } : item));
    try {
      await api.put(`/admin/banners/${banner._id}`, { isActive: !banner.isActive });
      toast({ message: `Banner ${banner.isActive ? 'hidden' : 'published'}`, type: 'success' });
    } catch (error: unknown) {
      setBanners((current) => current.map((item) => item._id === banner._id ? { ...item, isActive: banner.isActive } : item));
      toast({ message: error instanceof Error ? error.message : 'Unable to update banner.', type: 'error' });
    }
  };

  const deleteBanner = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/admin/banners/${deleteTarget._id}`);
      setBanners((current) => current.filter((item) => item._id !== deleteTarget._id));
      toast({ message: 'Banner and its Cloudinary image were deleted', type: 'success' });
      setDeleteTarget(null);
      if (editing?._id === deleteTarget._id) resetEditor();
    } catch (error: unknown) {
      toast({ message: error instanceof Error ? error.message : 'Unable to delete banner.', type: 'error' });
    }
  };

  const imageField = (target: 'desktop' | 'mobile') => {
    const current = target === 'desktop' ? image : mobileImage;
    const urlValue = target === 'desktop' ? urlInput : mobileUrlInput;
    const busy = importing === target;
    const setUrl = target === 'desktop' ? setUrlInput : setMobileUrlInput;
    const setCurrent = target === 'desktop' ? setImage : setMobileImage;
    return (
      <div className="space-y-3">
        {current?.url && (
          <div className="relative overflow-hidden rounded-lg border border-[#E5E4DF]">
            <img src={current.url} alt={current.alt ?? ''} className="h-40 w-full object-cover" />
            <button type="button" onClick={() => setCurrent(null)} className="absolute right-2 top-2 rounded-md bg-white px-2 py-1 text-xs text-[#1A1A1A] shadow">
              Remove
            </button>
          </div>
        )}
        {!current?.url && (
          <ImageUploadZone
            folder="banners"
            maxFiles={1}
            onUpload={(items) => setCurrent(items[0] ?? null)}
            onError={(message) => toast({ message, type: 'error' })}
          />
        )}
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={urlValue}
            onChange={(event) => setUrl(event.target.value)}
            type="url"
            placeholder="Or paste a public HTTPS image URL"
            className="min-w-0 flex-1 rounded-lg border border-[#E5E4DF] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1F3A2E]"
          />
          <button type="button" disabled={busy || !urlValue.trim()} onClick={() => void importImageUrl(target)} className="rounded-lg border border-[#E5E4DF] px-3 py-2 text-sm font-medium disabled:opacity-50">
            {busy ? 'Importing…' : 'Import URL'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Homepage banners"
        subtitle="Manage scheduled hero slides and their Cloudinary images."
        actions={<button type="button" onClick={startCreate} className="inline-flex items-center gap-2 rounded-lg bg-[#1F3A2E] px-4 py-2.5 text-sm font-semibold text-white"><Plus size={16} /> New banner</button>}
      />

      {editorOpen ? (
        <section className="rounded-xl border border-[#E5E4DF] bg-white p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-serif text-xl font-semibold">{editing ? 'Edit banner' : 'Create banner'}</h2>
            <button type="button" onClick={resetEditor} className="text-sm font-medium text-[#6B6B65] hover:text-[#1A1A1A]">Close</button>
          </div>
          <form onSubmit={onSubmit} className="grid gap-5 lg:grid-cols-2">
            <div className="space-y-4">
              <label className="block text-sm font-medium">Title
                <input {...form.register('title')} maxLength={120} className="mt-1 w-full rounded-lg border border-[#E5E4DF] px-3 py-2" />
                {form.formState.errors.title && <span className="mt-1 block text-xs text-red-600">{form.formState.errors.title.message}</span>}
              </label>
              <label className="block text-sm font-medium">Eyebrow
                <input {...form.register('eyebrow')} maxLength={100} className="mt-1 w-full rounded-lg border border-[#E5E4DF] px-3 py-2" />
                {form.formState.errors.eyebrow && <span className="mt-1 block text-xs text-red-600">{form.formState.errors.eyebrow.message}</span>}
              </label>
              <label className="block text-sm font-medium">Description
                <textarea {...form.register('description')} maxLength={500} rows={3} className="mt-1 w-full rounded-lg border border-[#E5E4DF] px-3 py-2" />
                {form.formState.errors.description && <span className="mt-1 block text-xs text-red-600">{form.formState.errors.description.message}</span>}
              </label>
              <label className="block text-sm font-medium">Destination URL
                <input {...form.register('href')} maxLength={500} className="mt-1 w-full rounded-lg border border-[#E5E4DF] px-3 py-2" />
                {form.formState.errors.href && <span className="mt-1 block text-xs text-red-600">{form.formState.errors.href.message}</span>}
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium">Button label
                  <input {...form.register('ctaLabel')} maxLength={80} className="mt-1 w-full rounded-lg border border-[#E5E4DF] px-3 py-2" />
                  {form.formState.errors.ctaLabel && <span className="mt-1 block text-xs text-red-600">{form.formState.errors.ctaLabel.message}</span>}
                </label>
                <label className="block text-sm font-medium">Display order
                  <input {...form.register('sortOrder', { valueAsNumber: true })} type="number" min={0} max={10000} className="mt-1 w-full rounded-lg border border-[#E5E4DF] px-3 py-2" />
                  {form.formState.errors.sortOrder && <span className="mt-1 block text-xs text-red-600">{form.formState.errors.sortOrder.message}</span>}
                </label>
              </div>
              <label className="flex items-center gap-3 rounded-lg border border-[#E5E4DF] bg-[#F7F6F2] p-3 text-sm font-medium">
                <input type="checkbox" {...form.register('isActive')} className="accent-[#1F3A2E]" /> Published on homepage
              </label>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="mb-2 text-sm font-semibold">Desktop image <span className="text-red-600">*</span></h3>
                {imageField('desktop')}
              </div>
              <div>
                <h3 className="mb-2 text-sm font-semibold">Mobile image <span className="font-normal text-[#6B6B65]">(optional)</span></h3>
                {imageField('mobile')}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium">Starts at
                  <input {...form.register('startsAt')} type="datetime-local" className="mt-1 w-full rounded-lg border border-[#E5E4DF] px-3 py-2" />
                  {form.formState.errors.startsAt && <span className="mt-1 block text-xs text-red-600">{form.formState.errors.startsAt.message}</span>}
                </label>
                <label className="block text-sm font-medium">Ends at
                  <input {...form.register('endsAt')} type="datetime-local" className="mt-1 w-full rounded-lg border border-[#E5E4DF] px-3 py-2" />
                  {form.formState.errors.endsAt && <span className="mt-1 block text-xs text-red-600">{form.formState.errors.endsAt.message}</span>}
                </label>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={resetEditor} className="rounded-lg border border-[#E5E4DF] px-4 py-2 text-sm font-medium">Cancel</button>
                <button type="submit" disabled={saving} className="rounded-lg bg-[#1F3A2E] px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Saving…' : editing ? 'Save changes' : 'Create banner'}</button>
              </div>
            </div>
          </form>
        </section>
      ) : null}

      <section>
        <h2 className="mb-3 font-serif text-xl font-semibold">All banners</h2>
        {loading ? <SkeletonTable rows={4} cols={5} /> : loadError ? (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">{loadError}<button type="button" onClick={() => void fetchBanners()} className="ml-3 font-semibold underline">Retry</button></div>
        ) : banners.length === 0 ? (
          <EmptyState icon={<ImagePlus size={24} />} title="No banners yet" description="Create a banner to add a hero slide to the storefront." />
        ) : (
          <div className="overflow-hidden rounded-xl border border-[#E5E4DF] bg-white">
            <div className="divide-y divide-[#E5E4DF]">
              {banners.map((banner) => (
                <article key={banner._id} className="grid gap-4 p-4 sm:grid-cols-[160px_1fr_auto] sm:items-center">
                  <img src={banner.image.url} alt={banner.image.alt || banner.title} className="h-28 w-full rounded-lg object-cover sm:h-24 sm:w-40" />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate font-semibold text-[#1A1A1A]">{banner.title}</h3>
                      <StatusBadge status={banner.isActive ? 'active' : 'draft'} />
                    </div>
                    <p className="mt-1 truncate text-sm text-[#6B6B65]">{banner.description || banner.eyebrow || 'No description'}</p>
                    <p className="mt-1 text-xs text-[#6B6B65]">Order {banner.sortOrder} · {banner.href}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 sm:justify-end">
                    <button type="button" onClick={() => void toggleActive(banner)} className="rounded-lg border border-[#E5E4DF] px-3 py-2 text-xs font-semibold">{banner.isActive ? 'Hide' : 'Publish'}</button>
                    <button type="button" onClick={() => startEdit(banner)} aria-label={`Edit ${banner.title}`} className="rounded-lg border border-[#E5E4DF] p-2"><Pencil size={15} /></button>
                    <button type="button" onClick={() => setDeleteTarget(banner)} aria-label={`Delete ${banner.title}`} className="rounded-lg border border-red-200 p-2 text-red-700"><Trash2 size={15} /></button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete this banner?"
        description="This removes the banner and permanently deletes its Cloudinary images unless another banner is using them."
        confirmLabel="Delete banner"
        isDangerous
        onConfirm={deleteBanner}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
