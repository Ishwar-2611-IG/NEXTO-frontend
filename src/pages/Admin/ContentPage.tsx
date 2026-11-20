import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ArrowDown,
  ArrowUp,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Layers,
  Megaphone,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Sparkles,
  Trash2,
  type LucideIcon,
} from 'lucide-react';
import {
  ConfirmModal,
  EmptyState,
  PageHeader,
  SlideOverDrawer,
  StatusBadge,
  useToast,
} from '../../components/admin/index';
import { api } from '../../services/api';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface HeroBanner {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  ctaText: string;
  ctaLink: string;
  isActive: boolean;
  order: number;
}

export interface AnnouncementBar {
  text: string;
  isActive: boolean;
  bgColor: string;
  textColor: string;
}

export interface FeaturedCollection {
  id: string;
  name: string;
  slug: string;
  imageUrl: string;
  isActive: boolean;
}

export interface PolicyPage {
  title: string;
  content: string;
  lastUpdated: string;
}

interface ContentStoragePayload {
  banners: HeroBanner[];
  announcement: AnnouncementBar;
  collections: FeaturedCollection[];
  policies: Record<string, PolicyPage>;
}

type SectionKey = 'banners' | 'announcement' | 'collections' | 'policies';

// ─── Constants & Defaults ────────────────────────────────────────────────────

const STORAGE_KEY = 'nexto_admin_content';

const SECTIONS: Array<{ key: SectionKey; label: string; icon: LucideIcon }> = [
  { key: 'banners', label: 'Hero Banners', icon: ImageIcon },
  { key: 'announcement', label: 'Announcement Bar', icon: Megaphone },
  { key: 'collections', label: 'Featured Collections', icon: Layers },
  { key: 'policies', label: 'Policy Pages', icon: FileText },
];

const POLICY_KEYS = ['privacy-policy', 'terms-of-service', 'refund-policy', 'shipping-policy'] as const;

const DEFAULT_ANNOUNCEMENT: AnnouncementBar = {
  text: 'Complimentary express shipping on orders above ₹2,999',
  isActive: false,
  bgColor: '#1F3A2E',
  textColor: '#FFFFFF',
};

const DEFAULT_POLICIES: Record<string, PolicyPage> = {
  'privacy-policy': {
    title: 'Privacy Policy',
    content: '# Privacy Policy\n\nDescribe how NEXTO collects, stores, and protects customer information.',
    lastUpdated: '',
  },
  'terms-of-service': {
    title: 'Terms of Service',
    content: '# Terms of Service\n\nOutline the terms governing purchases and usage of the NEXTO storefront.',
    lastUpdated: '',
  },
  'refund-policy': {
    title: 'Refund Policy',
    content: '# Refund Policy\n\nDetail return windows, eligibility criteria, and refund timelines for customers.',
    lastUpdated: '',
  },
  'shipping-policy': {
    title: 'Shipping Policy',
    content: '# Shipping Policy\n\nSpecify dispatch timelines, delivery partners, and shipping thresholds.',
    lastUpdated: '',
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `item_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function formatDateTime(iso: string): string {
  if (!iso) return 'Not yet published';
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return 'Not yet published';
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsed);
}

function normalizePolicies(raw: unknown): Record<string, PolicyPage> {
  const incoming =
    raw && typeof raw === 'object' ? (raw as Record<string, Partial<PolicyPage>>) : {};
  const merged: Record<string, PolicyPage> = {};

  for (const key of POLICY_KEYS) {
    const fallback = DEFAULT_POLICIES[key];
    const candidate = incoming[key];
    merged[key] = {
      title: fallback.title,
      content: typeof candidate?.content === 'string' ? candidate.content : fallback.content,
      lastUpdated:
        typeof candidate?.lastUpdated === 'string' ? candidate.lastUpdated : fallback.lastUpdated,
    };
  }
  return merged;
}

function readContentFromStorage(): ContentStoragePayload {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        banners: [],
        announcement: { ...DEFAULT_ANNOUNCEMENT },
        collections: [],
        policies: normalizePolicies(undefined),
      };
    }
    const parsed = JSON.parse(raw) as Partial<ContentStoragePayload>;
    const banners: HeroBanner[] = Array.isArray(parsed.banners)
      ? parsed.banners
          .filter((item): item is HeroBanner => Boolean(item && typeof item === 'object' && typeof item.id === 'string'))
          .sort((a, b) => a.order - b.order)
          .map((item, idx) => ({
            id: item.id,
            title: String(item.title ?? ''),
            subtitle: String(item.subtitle ?? ''),
            imageUrl: String(item.imageUrl ?? ''),
            ctaText: String(item.ctaText ?? ''),
            ctaLink: String(item.ctaLink ?? ''),
            isActive: Boolean(item.isActive),
            order: idx,
          }))
      : [];

    const rawAnnouncement = parsed.announcement;
    const announcement: AnnouncementBar = {
      text: typeof rawAnnouncement?.text === 'string' ? rawAnnouncement.text : DEFAULT_ANNOUNCEMENT.text,
      isActive:
        typeof rawAnnouncement?.isActive === 'boolean'
          ? rawAnnouncement.isActive
          : DEFAULT_ANNOUNCEMENT.isActive,
      bgColor:
        typeof rawAnnouncement?.bgColor === 'string' && rawAnnouncement.bgColor
          ? rawAnnouncement.bgColor
          : DEFAULT_ANNOUNCEMENT.bgColor,
      textColor:
        typeof rawAnnouncement?.textColor === 'string' && rawAnnouncement.textColor
          ? rawAnnouncement.textColor
          : DEFAULT_ANNOUNCEMENT.textColor,
    };

    const collections: FeaturedCollection[] = Array.isArray(parsed.collections)
      ? parsed.collections
          .filter(
            (item): item is FeaturedCollection =>
              Boolean(item && typeof item === 'object' && typeof item.id === 'string')
          )
          .map((item) => ({
            id: item.id,
            name: String(item.name ?? ''),
            slug: String(item.slug ?? ''),
            imageUrl: String(item.imageUrl ?? ''),
            isActive: Boolean(item.isActive),
          }))
      : [];

    return {
      banners,
      announcement,
      collections,
      policies: normalizePolicies(parsed.policies),
    };
  } catch {
    return {
      banners: [],
      announcement: { ...DEFAULT_ANNOUNCEMENT },
      collections: [],
      policies: normalizePolicies(undefined),
    };
  }
}

function writeContentToStorage(payload: ContentStoragePayload): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

// ─── Reusable Toggle Switch ──────────────────────────────────────────────────

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  ariaLabel: string;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ checked, onChange, ariaLabel }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={ariaLabel}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-[#1F3A2E] focus:ring-offset-1 ${
      checked ? 'bg-[#1F3A2E]' : 'bg-[#D5D3CC]'
    }`}
  >
    <span
      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition-transform ${
        checked ? 'translate-x-5' : 'translate-x-0.5'
      }`}
    />
  </button>
);

// ─── Thumbnail Preview ───────────────────────────────────────────────────────

const ThumbnailPreview: React.FC<{ src: string; alt: string; className?: string }> = ({
  src,
  alt,
  className = 'w-10 h-10',
}) => {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src.trim() || failed) {
    return (
      <div
        className={`${className} flex items-center justify-center rounded-lg border border-[#E5E4DF] bg-[#F7F6F2] text-[#6B6B65]`}
      >
        <ImageIcon size={16} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      className={`${className} rounded-lg border border-[#E5E4DF] object-cover bg-[#F7F6F2]`}
    />
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────

export function ContentPage(): React.ReactElement {
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();

  const [store, setStore] = useState<ContentStoragePayload>(() => readContentFromStorage());
  const [serverReady, setServerReady] = useState(false);
  const saveQueue = useRef<Promise<void>>(Promise.resolve());
  const saveVersion = useRef(0);
  const requestedSaveMessage = useRef<string | undefined>();

  useEffect(() => {
    let active = true;
    void api
      .get<{ content: ContentStoragePayload; initialized: boolean }>('/admin/content')
      .then(async (response) => {
        if (!active) return;
        const hasLegacyContent = Boolean(window.localStorage.getItem(STORAGE_KEY));
        if (!response.initialized && hasLegacyContent) {
          const legacyContent = readContentFromStorage();
          await api.patch('/admin/content', legacyContent);
          if (!active) return;
          setStore(legacyContent);
        } else {
          setStore(response.content);
        }
        setServerReady(true);
      })
      .catch((requestError: unknown) => {
        if (active) {
          toast({
            message: `Could not load or migrate saved storefront content: ${
              requestError instanceof Error ? requestError.message : 'Unknown error'
            }`,
            type: 'error',
            duration: 7000,
          });
        }
      });
    return () => {
      active = false;
    };
  }, [toast]);

  useEffect(() => {
    if (!serverReady) return;
    const version = ++saveVersion.current;
    const payload = store;
    const successMessage = requestedSaveMessage.current;
    requestedSaveMessage.current = undefined;

    saveQueue.current = saveQueue.current
      .catch(() => undefined)
      .then(async () => {
        await api.patch('/admin/content', payload);
        if (version === saveVersion.current && successMessage) {
          toast({ message: successMessage, type: 'success' });
        }
      })
      .catch((requestError: unknown) => {
        if (version === saveVersion.current) {
          toast({
            message: `Failed to save storefront content: ${
              requestError instanceof Error ? requestError.message : 'Unknown error'
            }`,
            type: 'error',
            duration: 7000,
          });
        }
      });
  }, [serverReady, store, toast]);

  const activeSection = useMemo<SectionKey>(() => {
    const param = searchParams.get('section');
    if (
      param === 'banners' ||
      param === 'announcement' ||
      param === 'collections' ||
      param === 'policies'
    ) {
      return param;
    }
    return 'banners';
  }, [searchParams]);

  const setSection = useCallback(
    (section: SectionKey) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set('section', section);
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const persistStore = useCallback(
    (updater: (prev: ContentStoragePayload) => ContentStoragePayload, successMessage?: string) => {
      requestedSaveMessage.current = successMessage;
      setStore((prev) => {
        const next = updater(prev);
        const saved = writeContentToStorage(next);
        if (!saved) {
          toast({ message: 'Failed to persist changes to localStorage.', type: 'error' });
        }
        return next;
      });
    },
    [toast]
  );

  // ── Tab 1: Hero Banners state ──────────────────────────────────────────────
  const [bannerDrawerOpen, setBannerDrawerOpen] = useState(false);
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);
  const [bannerForm, setBannerForm] = useState({
    title: '',
    subtitle: '',
    imageUrl: '',
    ctaText: '',
    ctaLink: '',
    isActive: true,
  });
  const [bannerError, setBannerError] = useState('');
  const [deletingBanner, setDeletingBanner] = useState<HeroBanner | null>(null);

  const sortedBanners = useMemo(
    () => [...store.banners].sort((a, b) => a.order - b.order),
    [store.banners]
  );

  const openAddBanner = () => {
    setEditingBannerId(null);
    setBannerForm({
      title: '',
      subtitle: '',
      imageUrl: '',
      ctaText: 'Shop Now',
      ctaLink: '/shop',
      isActive: true,
    });
    setBannerError('');
    setBannerDrawerOpen(true);
  };

  const openEditBanner = (banner: HeroBanner) => {
    setEditingBannerId(banner.id);
    setBannerForm({
      title: banner.title,
      subtitle: banner.subtitle,
      imageUrl: banner.imageUrl,
      ctaText: banner.ctaText,
      ctaLink: banner.ctaLink,
      isActive: banner.isActive,
    });
    setBannerError('');
    setBannerDrawerOpen(true);
  };

  const handleSaveBanner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerForm.title.trim()) {
      setBannerError('Banner title is required.');
      return;
    }

    if (editingBannerId) {
      persistStore(
        (prev) => ({
          ...prev,
          banners: prev.banners.map((b) =>
            b.id === editingBannerId
              ? {
                  ...b,
                  title: bannerForm.title.trim(),
                  subtitle: bannerForm.subtitle.trim(),
                  imageUrl: bannerForm.imageUrl.trim(),
                  ctaText: bannerForm.ctaText.trim(),
                  ctaLink: bannerForm.ctaLink.trim(),
                  isActive: bannerForm.isActive,
                }
              : b
          ),
        }),
        'Hero banner updated.'
      );
    } else {
      const nextBanner: HeroBanner = {
        id: createId(),
        title: bannerForm.title.trim(),
        subtitle: bannerForm.subtitle.trim(),
        imageUrl: bannerForm.imageUrl.trim(),
        ctaText: bannerForm.ctaText.trim(),
        ctaLink: bannerForm.ctaLink.trim(),
        isActive: bannerForm.isActive,
        order: store.banners.length,
      };
      persistStore(
        (prev) => ({
          ...prev,
          banners: [...prev.banners, nextBanner],
        }),
        'Hero banner added.'
      );
    }

    setBannerDrawerOpen(false);
  };

  const handleMoveBanner = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= sortedBanners.length) return;

    persistStore((prev) => {
      const ordered = [...prev.banners].sort((a, b) => a.order - b.order);
      const [moved] = ordered.splice(index, 1);
      ordered.splice(targetIndex, 0, moved);
      return {
        ...prev,
        banners: ordered.map((item, idx) => ({ ...item, order: idx })),
      };
    }, 'Banner order updated.');
  };

  const handleToggleBannerActive = (bannerId: string, isActive: boolean) => {
    persistStore(
      (prev) => ({
        ...prev,
        banners: prev.banners.map((b) => (b.id === bannerId ? { ...b, isActive } : b)),
      }),
      isActive ? 'Banner activated.' : 'Banner set to inactive.'
    );
  };

  const handleConfirmDeleteBanner = () => {
    if (!deletingBanner) return;
    const idToRemove = deletingBanner.id;
    persistStore((prev) => {
      const remaining = prev.banners
        .filter((b) => b.id !== idToRemove)
        .sort((a, b) => a.order - b.order)
        .map((b, idx) => ({ ...b, order: idx }));
      return { ...prev, banners: remaining };
    }, 'Hero banner deleted.');
    setDeletingBanner(null);
  };

  // ── Tab 2: Announcement Bar state ──────────────────────────────────────────
  const [announcementDraft, setAnnouncementDraft] = useState<AnnouncementBar>(store.announcement);

  useEffect(() => {
    setAnnouncementDraft(store.announcement);
  }, [store.announcement]);

  const announcementDirty =
    announcementDraft.text !== store.announcement.text ||
    announcementDraft.isActive !== store.announcement.isActive ||
    announcementDraft.bgColor !== store.announcement.bgColor ||
    announcementDraft.textColor !== store.announcement.textColor;

  const handleSaveAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    persistStore(
      (prev) => ({
        ...prev,
        announcement: {
          text: announcementDraft.text.trim(),
          isActive: announcementDraft.isActive,
          bgColor: announcementDraft.bgColor,
          textColor: announcementDraft.textColor,
        },
      }),
      'Announcement bar saved.'
    );
  };

  // ── Tab 3: Featured Collections state ──────────────────────────────────────
  const [collectionDrawerOpen, setCollectionDrawerOpen] = useState(false);
  const [editingCollectionId, setEditingCollectionId] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [collectionForm, setCollectionForm] = useState({
    name: '',
    slug: '',
    imageUrl: '',
    isActive: true,
  });
  const [collectionError, setCollectionError] = useState('');
  const [deletingCollection, setDeletingCollection] = useState<FeaturedCollection | null>(null);

  const openAddCollection = () => {
    setEditingCollectionId(null);
    setSlugTouched(false);
    setCollectionForm({
      name: '',
      slug: '',
      imageUrl: '',
      isActive: true,
    });
    setCollectionError('');
    setCollectionDrawerOpen(true);
  };

  const openEditCollection = (collection: FeaturedCollection) => {
    setEditingCollectionId(collection.id);
    setSlugTouched(true);
    setCollectionForm({
      name: collection.name,
      slug: collection.slug,
      imageUrl: collection.imageUrl,
      isActive: collection.isActive,
    });
    setCollectionError('');
    setCollectionDrawerOpen(true);
  };

  const handleCollectionNameChange = (name: string) => {
    setCollectionForm((prev) => ({
      ...prev,
      name,
      slug: slugTouched ? prev.slug : slugify(name),
    }));
  };

  const handleSaveCollection = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = collectionForm.name.trim();
    const normalizedSlug = slugify(collectionForm.slug || trimmedName);
    if (!trimmedName) {
      setCollectionError('Collection name is required.');
      return;
    }
    if (!normalizedSlug) {
      setCollectionError('A valid URL slug is required.');
      return;
    }

    if (editingCollectionId) {
      persistStore(
        (prev) => ({
          ...prev,
          collections: prev.collections.map((c) =>
            c.id === editingCollectionId
              ? {
                  ...c,
                  name: trimmedName,
                  slug: normalizedSlug,
                  imageUrl: collectionForm.imageUrl.trim(),
                  isActive: collectionForm.isActive,
                }
              : c
          ),
        }),
        'Collection updated.'
      );
    } else {
      const nextCollection: FeaturedCollection = {
        id: createId(),
        name: trimmedName,
        slug: normalizedSlug,
        imageUrl: collectionForm.imageUrl.trim(),
        isActive: collectionForm.isActive,
      };
      persistStore(
        (prev) => ({
          ...prev,
          collections: [...prev.collections, nextCollection],
        }),
        'Collection added.'
      );
    }
    setCollectionDrawerOpen(false);
  };

  const handleToggleCollectionActive = (collectionId: string, isActive: boolean) => {
    persistStore(
      (prev) => ({
        ...prev,
        collections: prev.collections.map((c) => (c.id === collectionId ? { ...c, isActive } : c)),
      }),
      isActive ? 'Collection activated.' : 'Collection hidden.'
    );
  };

  const handleConfirmDeleteCollection = () => {
    if (!deletingCollection) return;
    const idToRemove = deletingCollection.id;
    persistStore(
      (prev) => ({
        ...prev,
        collections: prev.collections.filter((c) => c.id !== idToRemove),
      }),
      'Collection deleted.'
    );
    setDeletingCollection(null);
  };

  // ── Tab 4: Policy Pages state ──────────────────────────────────────────────
  const [editingPolicyKey, setEditingPolicyKey] = useState<string | null>(null);
  const [policyDraftContent, setPolicyDraftContent] = useState('');

  const editingPolicy = editingPolicyKey ? store.policies[editingPolicyKey] : null;

  const openEditPolicy = (key: string) => {
    const policy = store.policies[key];
    if (!policy) return;
    setEditingPolicyKey(key);
    setPolicyDraftContent(policy.content);
  };

  const handleSavePolicy = () => {
    if (!editingPolicyKey || !editingPolicy) return;
    const timestamp = new Date().toISOString();
    persistStore(
      (prev) => ({
        ...prev,
        policies: {
          ...prev.policies,
          [editingPolicyKey]: {
            ...prev.policies[editingPolicyKey],
            content: policyDraftContent,
            lastUpdated: timestamp,
          },
        },
      }),
      `${editingPolicy.title} saved.`
    );
    setEditingPolicyKey(null);
  };

  // ── Header contextual action ───────────────────────────────────────────────
  const headerAction = useMemo(() => {
    if (activeSection === 'banners') {
      return (
        <button
          type="button"
          onClick={openAddBanner}
          className="inline-flex items-center gap-2 rounded-lg bg-[#1F3A2E] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#162a21] focus:outline-none focus:ring-2 focus:ring-[#1F3A2E]"
        >
          <Plus size={16} />
          Add Banner
        </button>
      );
    }
    if (activeSection === 'collections') {
      return (
        <button
          type="button"
          onClick={openAddCollection}
          className="inline-flex items-center gap-2 rounded-lg bg-[#1F3A2E] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#162a21] focus:outline-none focus:ring-2 focus:ring-[#1F3A2E]"
        >
          <Plus size={16} />
          Add Collection
        </button>
      );
    }
    return undefined;
  }, [activeSection]);

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Storefront"
        title="Content Management"
        subtitle="Manage hero banners, announcement bar, curated collections, and legal policy copy. Changes are shared across the storefront."
        actions={headerAction}
      />

      {/* Section Tabs */}
      <div className="border-b border-[#E5E4DF]">
        <nav className="-mb-px flex gap-2 overflow-x-auto" aria-label="Content sections">
          {SECTIONS.map(({ key, label, icon: Icon }) => {
            const isActive = activeSection === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSection(key)}
                className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'border-[#1F3A2E] bg-[#E8EDE9]/50 text-[#1F3A2E]'
                    : 'border-transparent text-[#6B6B65] hover:border-[#E5E4DF] hover:text-[#1A1A1A]'
                }`}
              >
                <Icon size={15} />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* ── TAB 1: HERO BANNERS ─────────────────────────────────────────────── */}
      {activeSection === 'banners' && (
        <div className="space-y-4">
          {sortedBanners.length === 0 ? (
            <EmptyState
              icon={<ImageIcon size={26} />}
              title="No hero banners yet"
              description="Create your first storefront hero banner to showcase seasonal drops and editorial campaigns."
              action={
                <button
                  type="button"
                  onClick={openAddBanner}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#1F3A2E] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#162a21]"
                >
                  <Plus size={16} />
                  Add Banner
                </button>
              }
            />
          ) : (
            <div className="overflow-hidden rounded-xl border border-[#E5E4DF] bg-white shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead className="border-b border-[#E5E4DF] bg-[#FAF9F6]">
                    <tr>
                      <th className="w-28 px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]">
                        Order
                      </th>
                      <th className="w-20 px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]">
                        Preview
                      </th>
                      <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]">
                        Title
                      </th>
                      <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]">
                        CTA
                      </th>
                      <th className="w-32 px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]">
                        Active
                      </th>
                      <th className="w-28 px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E4DF]">
                    {sortedBanners.map((banner, index) => (
                      <tr key={banner.id} className="transition-colors hover:bg-[#F7F6F2]/70">
                        <td className="px-5 py-4 align-middle">
                          <div className="flex items-center gap-1.5">
                            <span className="w-5 text-xs font-semibold text-[#6B6B65]">
                              {index + 1}
                            </span>
                            <button
                              type="button"
                              disabled={index === 0}
                              onClick={() => handleMoveBanner(index, -1)}
                              aria-label={`Move ${banner.title} up`}
                              className="rounded-md border border-[#E5E4DF] bg-white p-1 text-[#1A1A1A] transition-colors hover:bg-[#F7F6F2] disabled:cursor-not-allowed disabled:opacity-35"
                            >
                              <ArrowUp size={13} />
                            </button>
                            <button
                              type="button"
                              disabled={index === sortedBanners.length - 1}
                              onClick={() => handleMoveBanner(index, 1)}
                              aria-label={`Move ${banner.title} down`}
                              className="rounded-md border border-[#E5E4DF] bg-white p-1 text-[#1A1A1A] transition-colors hover:bg-[#F7F6F2] disabled:cursor-not-allowed disabled:opacity-35"
                            >
                              <ArrowDown size={13} />
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-4 align-middle">
                          <ThumbnailPreview
                            src={banner.imageUrl}
                            alt={banner.title}
                            className="h-10 w-10"
                          />
                        </td>
                        <td className="px-5 py-4 align-middle">
                          <p className="font-medium text-[#1A1A1A]">{banner.title}</p>
                          {banner.subtitle && (
                            <p className="mt-0.5 max-w-xs truncate text-xs text-[#6B6B65]">
                              {banner.subtitle}
                            </p>
                          )}
                        </td>
                        <td className="px-5 py-4 align-middle">
                          {banner.ctaText ? (
                            <div>
                              <span className="inline-flex items-center gap-1 rounded-md bg-[#E8EDE9] px-2 py-0.5 text-xs font-medium text-[#1F3A2E]">
                                {banner.ctaText}
                              </span>
                              {banner.ctaLink && (
                                <p className="mt-1 flex items-center gap-1 font-mono text-[11px] text-[#6B6B65]">
                                  <ExternalLink size={11} />
                                  <span className="max-w-[180px] truncate">{banner.ctaLink}</span>
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-[#6B6B65]">—</span>
                          )}
                        </td>
                        <td className="px-5 py-4 align-middle">
                          <div className="flex items-center gap-2.5">
                            <ToggleSwitch
                              checked={banner.isActive}
                              onChange={(next) => handleToggleBannerActive(banner.id, next)}
                              ariaLabel={`Toggle ${banner.title} active`}
                            />
                            <StatusBadge status={banner.isActive ? 'active' : 'inactive'} />
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right align-middle">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => openEditBanner(banner)}
                              aria-label={`Edit ${banner.title}`}
                              className="rounded-lg p-2 text-[#6B6B65] transition-colors hover:bg-[#F7F6F2] hover:text-[#1A1A1A]"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingBanner(banner)}
                              aria-label={`Delete ${banner.title}`}
                              className="rounded-lg p-2 text-[#6B6B65] transition-colors hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: ANNOUNCEMENT BAR ─────────────────────────────────────────── */}
      {activeSection === 'announcement' && (
        <div className="space-y-6">
          {/* Live Preview */}
          <div className="overflow-hidden rounded-xl border border-[#E5E4DF] bg-white shadow-xs">
            <div className="flex items-center justify-between border-b border-[#E5E4DF] bg-[#FAF9F6] px-5 py-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#6B6B65]">
                <Sparkles size={14} className="text-[#1F3A2E]" />
                Live Storefront Preview
              </div>
              <StatusBadge status={announcementDraft.isActive ? 'active' : 'inactive'} />
            </div>
            <div className="p-5">
              <div
                className={`rounded-lg px-4 py-3 text-center text-xs font-medium tracking-wide transition-opacity ${
                  announcementDraft.isActive ? 'opacity-100' : 'opacity-50'
                }`}
                style={{
                  backgroundColor: announcementDraft.bgColor,
                  color: announcementDraft.textColor,
                }}
              >
                {announcementDraft.text.trim() || 'Your storefront announcement message will appear here.'}
              </div>
              {!announcementDraft.isActive && (
                <p className="mt-2.5 text-center text-xs text-[#6B6B65]">
                  Announcement bar is currently disabled and hidden from shoppers.
                </p>
              )}
            </div>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSaveAnnouncement}
            className="space-y-5 rounded-xl border border-[#E5E4DF] bg-white p-6 shadow-xs"
          >
            <div className="flex items-center justify-between border-b border-[#E5E4DF] pb-4">
              <div>
                <h2 className="font-serif text-lg font-semibold text-[#1A1A1A]">
                  Announcement Settings
                </h2>
                <p className="mt-0.5 text-xs text-[#6B6B65]">
                  Displayed at the very top of every storefront page when active.
                </p>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-medium text-[#1A1A1A]">
                  {announcementDraft.isActive ? 'Visible' : 'Hidden'}
                </span>
                <ToggleSwitch
                  checked={announcementDraft.isActive}
                  onChange={(next) =>
                    setAnnouncementDraft((prev) => ({ ...prev, isActive: next }))
                  }
                  ariaLabel="Toggle announcement bar visibility"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="announcement-text"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]"
              >
                Announcement Copy
              </label>
              <input
                id="announcement-text"
                type="text"
                maxLength={180}
                value={announcementDraft.text}
                onChange={(e) =>
                  setAnnouncementDraft((prev) => ({ ...prev, text: e.target.value }))
                }
                placeholder="e.g. Complimentary express shipping on orders above ₹2,999"
                className="w-full rounded-lg border border-[#E5E4DF] bg-white px-3.5 py-2.5 text-sm text-[#1A1A1A] placeholder-[#6B6B65] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#1F3A2E]"
              />
              <p className="mt-1 text-right text-[11px] text-[#6B6B65]">
                {announcementDraft.text.length} / 180 characters
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="announcement-bg-color"
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]"
                >
                  Background Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    id="announcement-bg-color"
                    type="color"
                    value={announcementDraft.bgColor}
                    onChange={(e) =>
                      setAnnouncementDraft((prev) => ({ ...prev, bgColor: e.target.value }))
                    }
                    className="h-10 w-14 cursor-pointer rounded-lg border border-[#E5E4DF] bg-white p-1"
                  />
                  <input
                    type="text"
                    aria-label="Background color hex"
                    value={announcementDraft.bgColor}
                    onChange={(e) =>
                      setAnnouncementDraft((prev) => ({ ...prev, bgColor: e.target.value }))
                    }
                    className="w-full rounded-lg border border-[#E5E4DF] bg-white px-3 py-2 font-mono text-sm text-[#1A1A1A] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#1F3A2E]"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="announcement-text-color"
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]"
                >
                  Text Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    id="announcement-text-color"
                    type="color"
                    value={announcementDraft.textColor}
                    onChange={(e) =>
                      setAnnouncementDraft((prev) => ({ ...prev, textColor: e.target.value }))
                    }
                    className="h-10 w-14 cursor-pointer rounded-lg border border-[#E5E4DF] bg-white p-1"
                  />
                  <input
                    type="text"
                    aria-label="Text color hex"
                    value={announcementDraft.textColor}
                    onChange={(e) =>
                      setAnnouncementDraft((prev) => ({ ...prev, textColor: e.target.value }))
                    }
                    className="w-full rounded-lg border border-[#E5E4DF] bg-white px-3 py-2 font-mono text-sm text-[#1A1A1A] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#1F3A2E]"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-[#E5E4DF] pt-4">
              {announcementDirty && (
                <button
                  type="button"
                  onClick={() => setAnnouncementDraft(store.announcement)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E4DF] bg-white px-4 py-2 text-sm font-medium text-[#1A1A1A] transition-colors hover:bg-[#F7F6F2]"
                >
                  <RotateCcw size={14} />
                  Reset
                </button>
              )}
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-lg bg-[#1F3A2E] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#162a21] focus:outline-none focus:ring-2 focus:ring-[#1F3A2E]"
              >
                <Save size={15} />
                Save Announcement
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── TAB 3: FEATURED COLLECTIONS ─────────────────────────────────────── */}
      {activeSection === 'collections' && (
        <div className="space-y-4">
          {store.collections.length === 0 ? (
            <EmptyState
              icon={<Layers size={26} />}
              title="No featured collections"
              description="Highlight curated seasonal edits on the storefront homepage."
              action={
                <button
                  type="button"
                  onClick={openAddCollection}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#1F3A2E] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#162a21]"
                >
                  <Plus size={16} />
                  Add Collection
                </button>
              }
            />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {store.collections.map((collection) => (
                <article
                  key={collection.id}
                  className="flex flex-col overflow-hidden rounded-xl border border-[#E5E4DF] bg-white shadow-xs transition-shadow hover:shadow-sm"
                >
                  <div className="relative aspect-[16/10] w-full bg-[#F7F6F2]">
                    {collection.imageUrl ? (
                      <ThumbnailPreview
                        src={collection.imageUrl}
                        alt={collection.name}
                        className="h-full w-full rounded-none border-0"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[#6B6B65]">
                        <ImageIcon size={28} />
                      </div>
                    )}
                    <div className="absolute right-3 top-3">
                      <StatusBadge status={collection.isActive ? 'active' : 'inactive'} />
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col justify-between p-4">
                    <div>
                      <h3 className="font-serif text-lg font-semibold text-[#1A1A1A]">
                        {collection.name}
                      </h3>
                      <p className="mt-0.5 font-mono text-xs text-[#6B6B65]">
                        /collections/{collection.slug}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-[#E5E4DF] pt-3">
                      <div className="flex items-center gap-2">
                        <ToggleSwitch
                          checked={collection.isActive}
                          onChange={(next) => handleToggleCollectionActive(collection.id, next)}
                          ariaLabel={`Toggle ${collection.name} active`}
                        />
                        <span className="text-xs font-medium text-[#6B6B65]">
                          {collection.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditCollection(collection)}
                          aria-label={`Edit ${collection.name}`}
                          className="rounded-lg p-1.5 text-[#6B6B65] transition-colors hover:bg-[#F7F6F2] hover:text-[#1A1A1A]"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingCollection(collection)}
                          aria-label={`Delete ${collection.name}`}
                          className="rounded-lg p-1.5 text-[#6B6B65] transition-colors hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 4: POLICY PAGES ─────────────────────────────────────────────── */}
      {activeSection === 'policies' && (
        <div className="overflow-hidden rounded-xl border border-[#E5E4DF] bg-white shadow-xs">
          <div className="divide-y divide-[#E5E4DF]">
            {POLICY_KEYS.map((key) => {
              const policy = store.policies[key];
              const wordCount = policy.content.trim()
                ? policy.content.trim().split(/\s+/).length
                : 0;
              return (
                <div
                  key={key}
                  className="flex flex-col gap-4 p-5 transition-colors hover:bg-[#F7F6F2]/60 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#E8EDE9] text-[#1F3A2E]">
                      <FileText size={18} />
                    </div>
                    <div>
                      <h3 className="font-serif text-lg font-semibold text-[#1A1A1A]">
                        {policy.title}
                      </h3>
                      <p className="mt-0.5 text-xs text-[#6B6B65]">
                        Last updated: <span className="font-medium text-[#1A1A1A]">{formatDateTime(policy.lastUpdated)}</span>
                        <span className="mx-2 text-[#E5E4DF]">•</span>
                        <span>{wordCount} words</span>
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => openEditPolicy(key)}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#E5E4DF] bg-white px-4 py-2 text-sm font-medium text-[#1A1A1A] transition-colors hover:bg-[#F7F6F2] focus:outline-none focus:ring-2 focus:ring-[#1F3A2E]"
                  >
                    <Pencil size={14} />
                    Edit
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── DRAWER: ADD / EDIT BANNER ───────────────────────────────────────── */}
      <SlideOverDrawer
        open={bannerDrawerOpen}
        onClose={() => setBannerDrawerOpen(false)}
        title={editingBannerId ? 'Edit Hero Banner' : 'Add Hero Banner'}
        width="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setBannerDrawerOpen(false)}
              className="rounded-lg border border-[#E5E4DF] bg-white px-4 py-2 text-sm font-medium text-[#1A1A1A] transition-colors hover:bg-[#F7F6F2]"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="banner-form"
              className="rounded-lg bg-[#1F3A2E] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#162a21]"
            >
              {editingBannerId ? 'Save Changes' : 'Add Banner'}
            </button>
          </>
        }
      >
        <form id="banner-form" onSubmit={handleSaveBanner} className="space-y-5">
          {bannerError && (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700">
              {bannerError}
            </div>
          )}

          <div>
            <label
              htmlFor="banner-title"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]"
            >
              Title *
            </label>
            <input
              id="banner-title"
              type="text"
              required
              value={bannerForm.title}
              onChange={(e) => {
                setBannerForm((prev) => ({ ...prev, title: e.target.value }));
                if (bannerError) setBannerError('');
              }}
              placeholder="e.g. Autumn / Winter Linen Edit"
              className="w-full rounded-lg border border-[#E5E4DF] bg-white px-3.5 py-2.5 text-sm text-[#1A1A1A] placeholder-[#6B6B65] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#1F3A2E]"
            />
          </div>

          <div>
            <label
              htmlFor="banner-subtitle"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]"
            >
              Subtitle
            </label>
            <input
              id="banner-subtitle"
              type="text"
              value={bannerForm.subtitle}
              onChange={(e) => setBannerForm((prev) => ({ ...prev, subtitle: e.target.value }))}
              placeholder="Tailored silhouettes crafted from organic cotton and flax."
              className="w-full rounded-lg border border-[#E5E4DF] bg-white px-3.5 py-2.5 text-sm text-[#1A1A1A] placeholder-[#6B6B65] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#1F3A2E]"
            />
          </div>

          <div>
            <label
              htmlFor="banner-image-url"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]"
            >
              Image URL
            </label>
            <input
              id="banner-image-url"
              type="url"
              value={bannerForm.imageUrl}
              onChange={(e) => setBannerForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
              placeholder="https://cdn.example.com/banners/autumn-edit.jpg"
              className="w-full rounded-lg border border-[#E5E4DF] bg-white px-3.5 py-2.5 text-sm text-[#1A1A1A] placeholder-[#6B6B65] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#1F3A2E]"
            />
            {bannerForm.imageUrl.trim() && (
              <div className="mt-3">
                <ThumbnailPreview
                  src={bannerForm.imageUrl}
                  alt="Banner preview"
                  className="h-32 w-full"
                />
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="banner-cta-text"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]"
              >
                CTA Text
              </label>
              <input
                id="banner-cta-text"
                type="text"
                value={bannerForm.ctaText}
                onChange={(e) => setBannerForm((prev) => ({ ...prev, ctaText: e.target.value }))}
                placeholder="Shop Collection"
                className="w-full rounded-lg border border-[#E5E4DF] bg-white px-3.5 py-2.5 text-sm text-[#1A1A1A] placeholder-[#6B6B65] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#1F3A2E]"
              />
            </div>

            <div>
              <label
                htmlFor="banner-cta-link"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]"
              >
                CTA Link
              </label>
              <input
                id="banner-cta-link"
                type="text"
                value={bannerForm.ctaLink}
                onChange={(e) => setBannerForm((prev) => ({ ...prev, ctaLink: e.target.value }))}
                placeholder="/collections/autumn-edit"
                className="w-full rounded-lg border border-[#E5E4DF] bg-white px-3.5 py-2.5 text-sm text-[#1A1A1A] placeholder-[#6B6B65] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#1F3A2E]"
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-[#E5E4DF] bg-[#FAF9F6] px-4 py-3">
            <div>
              <p className="text-sm font-medium text-[#1A1A1A]">Active Status</p>
              <p className="text-xs text-[#6B6B65]">Show this banner in the storefront hero carousel.</p>
            </div>
            <ToggleSwitch
              checked={bannerForm.isActive}
              onChange={(next) => setBannerForm((prev) => ({ ...prev, isActive: next }))}
              ariaLabel="Banner active status"
            />
          </div>
        </form>
      </SlideOverDrawer>

      {/* ── DRAWER: ADD / EDIT COLLECTION ───────────────────────────────────── */}
      <SlideOverDrawer
        open={collectionDrawerOpen}
        onClose={() => setCollectionDrawerOpen(false)}
        title={editingCollectionId ? 'Edit Collection' : 'Add Collection'}
        width="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setCollectionDrawerOpen(false)}
              className="rounded-lg border border-[#E5E4DF] bg-white px-4 py-2 text-sm font-medium text-[#1A1A1A] transition-colors hover:bg-[#F7F6F2]"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="collection-form"
              className="rounded-lg bg-[#1F3A2E] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#162a21]"
            >
              {editingCollectionId ? 'Save Changes' : 'Add Collection'}
            </button>
          </>
        }
      >
        <form id="collection-form" onSubmit={handleSaveCollection} className="space-y-5">
          {collectionError && (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700">
              {collectionError}
            </div>
          )}

          <div>
            <label
              htmlFor="collection-name"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]"
            >
              Collection Name *
            </label>
            <input
              id="collection-name"
              type="text"
              required
              value={collectionForm.name}
              onChange={(e) => {
                handleCollectionNameChange(e.target.value);
                if (collectionError) setCollectionError('');
              }}
              placeholder="e.g. Resort Tailoring"
              className="w-full rounded-lg border border-[#E5E4DF] bg-white px-3.5 py-2.5 text-sm text-[#1A1A1A] placeholder-[#6B6B65] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#1F3A2E]"
            />
          </div>

          <div>
            <label
              htmlFor="collection-slug"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]"
            >
              URL Slug
            </label>
            <div className="flex items-center overflow-hidden rounded-lg border border-[#E5E4DF] bg-white focus-within:ring-2 focus-within:ring-[#1F3A2E]">
              <span className="border-r border-[#E5E4DF] bg-[#FAF9F6] px-3 py-2.5 font-mono text-xs text-[#6B6B65]">
                /collections/
              </span>
              <input
                id="collection-slug"
                type="text"
                value={collectionForm.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setCollectionForm((prev) => ({ ...prev, slug: e.target.value }));
                }}
                placeholder="resort-tailoring"
                className="w-full px-3 py-2.5 font-mono text-sm text-[#1A1A1A] placeholder-[#6B6B65] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="collection-image-url"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]"
            >
              Cover Image URL
            </label>
            <input
              id="collection-image-url"
              type="url"
              value={collectionForm.imageUrl}
              onChange={(e) =>
                setCollectionForm((prev) => ({ ...prev, imageUrl: e.target.value }))
              }
              placeholder="https://cdn.example.com/collections/resort.jpg"
              className="w-full rounded-lg border border-[#E5E4DF] bg-white px-3.5 py-2.5 text-sm text-[#1A1A1A] placeholder-[#6B6B65] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#1F3A2E]"
            />
            {collectionForm.imageUrl.trim() && (
              <div className="mt-3">
                <ThumbnailPreview
                  src={collectionForm.imageUrl}
                  alt="Collection cover preview"
                  className="h-36 w-full"
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-between rounded-lg border border-[#E5E4DF] bg-[#FAF9F6] px-4 py-3">
            <div>
              <p className="text-sm font-medium text-[#1A1A1A]">Active Status</p>
              <p className="text-xs text-[#6B6B65]">Feature this collection on the storefront.</p>
            </div>
            <ToggleSwitch
              checked={collectionForm.isActive}
              onChange={(next) => setCollectionForm((prev) => ({ ...prev, isActive: next }))}
              ariaLabel="Collection active status"
            />
          </div>
        </form>
      </SlideOverDrawer>

      {/* ── DRAWER: EDIT POLICY PAGE ────────────────────────────────────────── */}
      <SlideOverDrawer
        open={Boolean(editingPolicyKey && editingPolicy)}
        onClose={() => setEditingPolicyKey(null)}
        title={editingPolicy ? `Edit ${editingPolicy.title}` : 'Edit Policy'}
        width="lg"
        footer={
          <>
            <button
              type="button"
              onClick={() => setEditingPolicyKey(null)}
              className="rounded-lg border border-[#E5E4DF] bg-white px-4 py-2 text-sm font-medium text-[#1A1A1A] transition-colors hover:bg-[#F7F6F2]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSavePolicy}
              className="inline-flex items-center gap-2 rounded-lg bg-[#1F3A2E] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#162a21]"
            >
              <Save size={15} />
              Save
            </button>
          </>
        }
      >
        {editingPolicy && (
          <div className="space-y-5">
            <div>
              <label
                htmlFor="policy-title"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]"
              >
                Policy Title
              </label>
              <input
                id="policy-title"
                type="text"
                readOnly
                value={editingPolicy.title}
                className="w-full cursor-not-allowed rounded-lg border border-[#E5E4DF] bg-[#FAF9F6] px-3.5 py-2.5 text-sm font-medium text-[#6B6B65]"
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  htmlFor="policy-content"
                  className="text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]"
                >
                  Content (Markdown supported)
                </label>
                <span className="text-[11px] text-[#6B6B65]">
                  {policyDraftContent.length.toLocaleString()} chars
                </span>
              </div>
              <textarea
                id="policy-content"
                rows={18}
                value={policyDraftContent}
                onChange={(e) => setPolicyDraftContent(e.target.value)}
                placeholder="Write policy content in Markdown..."
                className="w-full resize-y rounded-lg border border-[#E5E4DF] bg-white p-3.5 font-mono text-sm leading-relaxed text-[#1A1A1A] placeholder-[#6B6B65] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#1F3A2E]"
              />
              <p className="mt-1.5 text-xs text-[#6B6B65]">
                Last updated: {formatDateTime(editingPolicy.lastUpdated)}
              </p>
            </div>
          </div>
        )}
      </SlideOverDrawer>

      {/* ── CONFIRM MODALS ──────────────────────────────────────────────────── */}
      <ConfirmModal
        open={Boolean(deletingBanner)}
        title="Delete Hero Banner"
        description={`Are you sure you want to delete "${deletingBanner?.title ?? ''}"? This action cannot be undone.`}
        confirmLabel="Delete Banner"
        isDangerous
        onConfirm={handleConfirmDeleteBanner}
        onCancel={() => setDeletingBanner(null)}
      />

      <ConfirmModal
        open={Boolean(deletingCollection)}
        title="Delete Collection"
        description={`Are you sure you want to remove "${deletingCollection?.name ?? ''}" from featured collections?`}
        confirmLabel="Delete Collection"
        isDangerous
        onConfirm={handleConfirmDeleteCollection}
        onCancel={() => setDeletingCollection(null)}
      />
    </div>
  );
}

export default ContentPage;
