import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, PlusCircle, Trash2, ChevronRight } from 'lucide-react';
import { PageHeader, ConfirmModal, SlideOverDrawer, useToast } from '../../components/admin/index';
import { api } from '../../services/api';

// ─── Types ───────────────────────────────────────────────────────────────────

type TabKey = 'general' | 'shipping' | 'taxes' | 'payments' | 'notifications';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'general', label: 'General' },
  { key: 'shipping', label: 'Shipping & Delivery' },
  { key: 'taxes', label: 'Taxes' },
  { key: 'payments', label: 'Payments' },
  { key: 'notifications', label: 'Notifications' },
];

// ─── Zod Schemas ────────────────────────────────────────────────────────────

const generalSchema = z.object({
  storeName: z.string().min(1, 'Store name is required'),
  contactEmail: z.string().email('Enter a valid email'),
  supportPhone: z.string().min(1, 'Phone is required'),
  currency: z.enum(['INR', 'USD', 'EUR', 'GBP']),
  timezone: z.enum(['Asia/Kolkata', 'UTC', 'America-New_York', 'Europe-London']),
  storeAddress: z.string().min(1, 'Address is required'),
});
type GeneralFormData = z.infer<typeof generalSchema>;

const shippingZoneSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Zone name is required'),
  countries: z.string().min(1, 'Countries required'),
  flatRate: z.number().min(0),
  freeShippingThreshold: z.boolean(),
  freeShippingAmount: z.number().min(0),
});
const shippingSchema = z.object({ zones: z.array(shippingZoneSchema) });
type ShippingFormData = z.infer<typeof shippingSchema>;

const taxRuleSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Rule name is required'),
  rate: z.number().min(0).max(100),
  region: z.string().min(1, 'Region required'),
  inclusive: z.boolean(),
});
const taxesSchema = z.object({
  taxExempt: z.boolean(),
  rules: z.array(taxRuleSchema),
});
type TaxesFormData = z.infer<typeof taxesSchema>;

const paymentsSchema = z.object({
  razorpay: z.object({
    enabled: z.boolean(),
    keyId: z.string(),
    keySecret: z.string(),
  }),
  cod: z.object({ enabled: z.boolean() }),
  stripe: z.object({
    enabled: z.boolean(),
    publishableKey: z.string(),
    secretKey: z.string(),
  }),
});
type PaymentsFormData = z.infer<typeof paymentsSchema>;

const notificationsSchema = z.object({
  orderConfirmation: z.boolean(),
  shippingUpdate: z.boolean(),
  lowStockAlert: z.boolean(),
});
type NotificationsFormData = z.infer<typeof notificationsSchema>;

// ─── Utility ────────────────────────────────────────────────────────────────

const inputCls =
  'w-full rounded-xl border border-[#E5E4DF] bg-white px-3 py-2.5 text-sm text-[#1A1A1A] outline-none focus:border-[#1F3A2E] transition-colors';

const labelCls = 'block text-xs font-semibold text-[#1A1A1A] mb-1.5';

function FormField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1F3A2E] ${
        checked ? 'bg-[#1F3A2E]' : 'bg-[#E5E4DF]'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

function MaskedInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [revealed, setRevealed] = useState(false);
  return (
    <div className="relative">
      <input
        type={revealed ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${inputCls} pr-10`}
        autoComplete="new-password"
      />
      <button
        type="button"
        onClick={() => setRevealed((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6B65] hover:text-[#1A1A1A]"
        aria-label={revealed ? 'Hide' : 'Show'}
      >
        {revealed ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#E5E4DF] bg-white p-6 space-y-5">{children}</div>
  );
}

// ─── Tab Forms ───────────────────────────────────────────────────────────────

function GeneralTab({
  onDirty,
}: {
  onDirty: (dirty: boolean) => void;
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<GeneralFormData>({
    resolver: zodResolver(generalSchema),
    defaultValues: {
      storeName: '',
      contactEmail: '',
      supportPhone: '',
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      storeAddress: '',
    },
  });

  const dirtyRef = useRef(isDirty);
  dirtyRef.current = isDirty;

  useEffect(() => {
    onDirty(isDirty);
  }, [isDirty, onDirty]);

  useEffect(() => {
    setLoading(true);
    api
      .get<GeneralFormData>('/admin/settings/general')
      .then((data) => {
        reset(data);
      })
      .catch((err: unknown) => {
        toast({ message: err instanceof Error ? err.message : 'Failed to load settings', type: 'error' });
      })
      .finally(() => setLoading(false));
  }, [reset, toast]);

  const onSubmit = async (data: GeneralFormData) => {
    try {
      await api.patch('/admin/settings/general', data);
      reset(data);
      toast({ message: 'General settings saved', type: 'success' });
    } catch (err: unknown) {
      toast({ message: err instanceof Error ? err.message : 'Failed to save', type: 'error' });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-12 rounded-xl bg-[#E5E4DF]" />
        ))}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <SectionCard>
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="Store name" error={errors.storeName?.message}>
            <input {...register('storeName')} className={inputCls} />
          </FormField>
          <FormField label="Contact email" error={errors.contactEmail?.message}>
            <input {...register('contactEmail')} type="email" className={inputCls} />
          </FormField>
          <FormField label="Support phone" error={errors.supportPhone?.message}>
            <input {...register('supportPhone')} type="tel" className={inputCls} />
          </FormField>
          <FormField label="Currency" error={errors.currency?.message}>
            <select {...register('currency')} className={inputCls}>
              <option value="INR">INR — Indian Rupee</option>
              <option value="USD">USD — US Dollar</option>
              <option value="EUR">EUR — Euro</option>
              <option value="GBP">GBP — British Pound</option>
            </select>
          </FormField>
          <FormField label="Timezone" error={errors.timezone?.message}>
            <select {...register('timezone')} className={inputCls}>
              <option value="Asia/Kolkata">Asia / Kolkata (IST)</option>
              <option value="UTC">UTC</option>
              <option value="America-New_York">America / New York (EST)</option>
              <option value="Europe-London">Europe / London (GMT)</option>
            </select>
          </FormField>
        </div>
        <FormField label="Store address" error={errors.storeAddress?.message}>
          <textarea {...register('storeAddress')} rows={3} className={`${inputCls} resize-none`} />
        </FormField>
      </SectionCard>
      <div className="flex justify-end">
        <button
          type="submit"
          className="rounded-full bg-[#1F3A2E] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#2a4d3e] transition-colors"
        >
          Save changes
        </button>
      </div>
    </form>
  );
}

function ShippingTab({ onDirty }: { onDirty: (dirty: boolean) => void }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm<ShippingFormData>({
    resolver: zodResolver(shippingSchema),
    defaultValues: { zones: [] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'zones' });

  useEffect(() => {
    onDirty(isDirty);
  }, [isDirty, onDirty]);

  useEffect(() => {
    setLoading(true);
    api
      .get<ShippingFormData>('/admin/settings/shipping')
      .then((data) => reset(data))
      .catch((err: unknown) => {
        toast({ message: err instanceof Error ? err.message : 'Failed to load', type: 'error' });
      })
      .finally(() => setLoading(false));
  }, [reset, toast]);

  const onSubmit = async (data: ShippingFormData) => {
    try {
      await api.patch('/admin/settings/shipping', data);
      reset(data);
      toast({ message: 'Shipping settings saved', type: 'success' });
    } catch (err: unknown) {
      toast({ message: err instanceof Error ? err.message : 'Failed to save', type: 'error' });
    }
  };

  const zonesWatched = watch('zones');

  if (loading) {
    return <div className="h-24 animate-pulse rounded-xl bg-[#E5E4DF]" />;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-4">
        {fields.map((field, index) => {
          const freeThreshold = zonesWatched[index]?.freeShippingThreshold ?? false;
          return (
            <SectionCard key={field.id}>
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold text-[#1A1A1A]">
                  Zone {index + 1}
                </h3>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="text-red-500 hover:text-red-700"
                  aria-label="Remove zone"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  label="Zone name"
                  error={errors.zones?.[index]?.name?.message}
                >
                  <input {...register(`zones.${index}.name`)} className={inputCls} />
                </FormField>
                <FormField
                  label="Countries (comma-separated)"
                  error={errors.zones?.[index]?.countries?.message}
                >
                  <input {...register(`zones.${index}.countries`)} className={inputCls} />
                </FormField>
                <FormField
                  label="Flat rate (₹)"
                  error={errors.zones?.[index]?.flatRate?.message}
                >
                  <input
                    {...register(`zones.${index}.flatRate`, { valueAsNumber: true })}
                    type="number"
                    min="0"
                    step="1"
                    className={inputCls}
                    placeholder="Amount in paise"
                  />
                </FormField>
                <div className="flex flex-col gap-2">
                  <label className={labelCls}>Free shipping threshold</label>
                  <div className="flex items-center gap-3 mt-1">
                    <Toggle
                      checked={freeThreshold}
                      onChange={(v) => {
                        const el = document.getElementById(`freeShippingThreshold-${index}`) as HTMLInputElement | null;
                        if (el) el.checked = v;
                      }}
                      label="Enable free shipping threshold"
                    />
                    <input
                      type="checkbox"
                      id={`freeShippingThreshold-${index}`}
                      {...register(`zones.${index}.freeShippingThreshold`)}
                      className="sr-only"
                    />
                    <span className="text-sm text-[#6B6B65]">
                      {freeThreshold ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
                {freeThreshold && (
                  <FormField
                    label="Free shipping above (₹)"
                    error={errors.zones?.[index]?.freeShippingAmount?.message}
                  >
                    <input
                      {...register(`zones.${index}.freeShippingAmount`, {
                        valueAsNumber: true,
                      })}
                      type="number"
                      min="0"
                      step="1"
                      className={inputCls}
                      placeholder="Amount in paise"
                    />
                  </FormField>
                )}
              </div>
            </SectionCard>
          );
        })}
      </div>
      <button
        type="button"
        onClick={() =>
          append({
            id: `zone-${Date.now()}`,
            name: '',
            countries: '',
            flatRate: 0,
            freeShippingThreshold: false,
            freeShippingAmount: 0,
          })
        }
        className="flex items-center gap-2 text-sm font-semibold text-[#1F3A2E] hover:underline"
      >
        <PlusCircle size={16} />
        Add shipping zone
      </button>
      <div className="flex justify-end">
        <button
          type="submit"
          className="rounded-full bg-[#1F3A2E] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#2a4d3e] transition-colors"
        >
          Save changes
        </button>
      </div>
    </form>
  );
}

function TaxesTab({ onDirty }: { onDirty: (dirty: boolean) => void }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isDirty },
  } = useForm<TaxesFormData>({
    resolver: zodResolver(taxesSchema),
    defaultValues: { taxExempt: false, rules: [] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'rules' });

  useEffect(() => {
    onDirty(isDirty);
  }, [isDirty, onDirty]);

  useEffect(() => {
    setLoading(true);
    api
      .get<TaxesFormData>('/admin/settings/taxes')
      .then((data) => reset(data))
      .catch((err: unknown) => {
        toast({ message: err instanceof Error ? err.message : 'Failed to load', type: 'error' });
      })
      .finally(() => setLoading(false));
  }, [reset, toast]);

  const onSubmit = async (data: TaxesFormData) => {
    try {
      await api.patch('/admin/settings/taxes', data);
      reset(data);
      toast({ message: 'Tax settings saved', type: 'success' });
    } catch (err: unknown) {
      toast({ message: err instanceof Error ? err.message : 'Failed to save', type: 'error' });
    }
  };

  const taxExempt = watch('taxExempt');
  const rulesWatched = watch('rules');

  if (loading) return <div className="h-24 animate-pulse rounded-xl bg-[#E5E4DF]" />;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <SectionCard>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-[#1A1A1A]">Tax-exempt store</p>
            <p className="text-xs text-[#6B6B65] mt-0.5">
              Disable all tax calculations globally
            </p>
          </div>
          <Toggle
            checked={taxExempt}
            onChange={(v) => setValue('taxExempt', v, { shouldDirty: true })}
            label="Tax exempt"
          />
        </div>
      </SectionCard>
      <div className="space-y-4">
        {fields.map((field, index) => {
          const isInclusive = rulesWatched[index]?.inclusive ?? false;
          return (
            <SectionCard key={field.id}>
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold text-[#1A1A1A]">Rule {index + 1}</h3>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="text-red-500 hover:text-red-700"
                  aria-label="Remove rule"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  label="Rule name"
                  error={errors.rules?.[index]?.name?.message}
                >
                  <input {...register(`rules.${index}.name`)} className={inputCls} />
                </FormField>
                <FormField
                  label="Rate (%)"
                  error={errors.rules?.[index]?.rate?.message}
                >
                  <input
                    {...register(`rules.${index}.rate`, { valueAsNumber: true })}
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    className={inputCls}
                  />
                </FormField>
                <FormField
                  label="Region"
                  error={errors.rules?.[index]?.region?.message}
                >
                  <input {...register(`rules.${index}.region`)} className={inputCls} />
                </FormField>
                <div className="flex flex-col gap-2">
                  <label className={labelCls}>Inclusive</label>
                  <div className="flex items-center gap-3 mt-1">
                    <Toggle
                      checked={isInclusive}
                      onChange={(v) =>
                        setValue(`rules.${index}.inclusive`, v, { shouldDirty: true })
                      }
                      label="Inclusive tax"
                    />
                    <span className="text-sm text-[#6B6B65]">
                      {isInclusive ? 'Price includes tax' : 'Tax added on top'}
                    </span>
                  </div>
                </div>
              </div>
            </SectionCard>
          );
        })}
      </div>
      <button
        type="button"
        onClick={() =>
          append({
            id: `rule-${Date.now()}`,
            name: '',
            rate: 18,
            region: '',
            inclusive: true,
          })
        }
        className="flex items-center gap-2 text-sm font-semibold text-[#1F3A2E] hover:underline"
      >
        <PlusCircle size={16} />
        Add tax rule
      </button>
      <div className="flex justify-end">
        <button
          type="submit"
          className="rounded-full bg-[#1F3A2E] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#2a4d3e] transition-colors"
        >
          Save changes
        </button>
      </div>
    </form>
  );
}

function PaymentsTab({ onDirty }: { onDirty: (dirty: boolean) => void }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm<PaymentsFormData>({
    resolver: zodResolver(paymentsSchema),
    defaultValues: {
      razorpay: { enabled: false, keyId: '', keySecret: '' },
      cod: { enabled: true },
      stripe: { enabled: false, publishableKey: '', secretKey: '' },
    },
  });

  useEffect(() => {
    onDirty(isDirty);
  }, [isDirty, onDirty]);

  useEffect(() => {
    setLoading(true);
    api
      .get<PaymentsFormData>('/admin/settings/payments')
      .then((data) => reset(data))
      .catch((err: unknown) => {
        toast({ message: err instanceof Error ? err.message : 'Failed to load', type: 'error' });
      })
      .finally(() => setLoading(false));
  }, [reset, toast]);

  const onSubmit = async (data: PaymentsFormData) => {
    try {
      await api.patch('/admin/settings/payments', data);
      reset(data);
      toast({ message: 'Payment settings saved', type: 'success' });
    } catch (err: unknown) {
      toast({ message: err instanceof Error ? err.message : 'Failed to save', type: 'error' });
    }
  };

  const rzEnabled = watch('razorpay.enabled');
  const codEnabled = watch('cod.enabled');
  const stripeEnabled = watch('stripe.enabled');
  const rzSecret = watch('razorpay.keySecret');
  const stripeSecret = watch('stripe.secretKey');

  if (loading) return <div className="h-24 animate-pulse rounded-xl bg-[#E5E4DF]" />;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Razorpay */}
      <SectionCard>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-bold text-[#1A1A1A]">Razorpay</p>
            <p className="text-xs text-[#6B6B65]">Accept UPI, cards, netbanking (India)</p>
          </div>
          <Toggle
            checked={rzEnabled}
            onChange={(v) => setValue('razorpay.enabled', v, { shouldDirty: true })}
            label="Enable Razorpay"
          />
        </div>
        {rzEnabled && (
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Key ID" error={errors.razorpay?.keyId?.message}>
              <input {...register('razorpay.keyId')} className={inputCls} placeholder="rzp_live_..." />
            </FormField>
            <FormField label="Key Secret" error={errors.razorpay?.keySecret?.message}>
              <MaskedInput
                value={rzSecret}
                onChange={(v) => setValue('razorpay.keySecret', v, { shouldDirty: true })}
                placeholder="••••••••"
              />
            </FormField>
          </div>
        )}
      </SectionCard>

      {/* COD */}
      <SectionCard>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-[#1A1A1A]">Cash on Delivery</p>
            <p className="text-xs text-[#6B6B65]">Allow customers to pay at delivery</p>
          </div>
          <Toggle
            checked={codEnabled}
            onChange={(v) => setValue('cod.enabled', v, { shouldDirty: true })}
            label="Enable COD"
          />
        </div>
      </SectionCard>

      {/* Stripe */}
      <SectionCard>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-bold text-[#1A1A1A]">Stripe</p>
            <p className="text-xs text-[#6B6B65]">Global card payments</p>
          </div>
          <Toggle
            checked={stripeEnabled}
            onChange={(v) => setValue('stripe.enabled', v, { shouldDirty: true })}
            label="Enable Stripe"
          />
        </div>
        {stripeEnabled && (
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Publishable Key" error={errors.stripe?.publishableKey?.message}>
              <input {...register('stripe.publishableKey')} className={inputCls} placeholder="pk_live_..." />
            </FormField>
            <FormField label="Secret Key" error={errors.stripe?.secretKey?.message}>
              <MaskedInput
                value={stripeSecret}
                onChange={(v) => setValue('stripe.secretKey', v, { shouldDirty: true })}
                placeholder="••••••••"
              />
            </FormField>
          </div>
        )}
      </SectionCard>

      <div className="flex justify-end">
        <button
          type="submit"
          className="rounded-full bg-[#1F3A2E] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#2a4d3e] transition-colors"
        >
          Save changes
        </button>
      </div>
    </form>
  );
}

type NotifKey = 'orderConfirmation' | 'shippingUpdate' | 'lowStockAlert';

const NOTIFICATION_ITEMS: { key: NotifKey; label: string; desc: string; template: string }[] = [
  {
    key: 'orderConfirmation',
    label: 'Order confirmation email',
    desc: 'Sent to customer when their order is placed',
    template: `Subject: Your NEXTO order #{ORDER_ID} has been confirmed!

Hi {CUSTOMER_NAME},

Thank you for your order! We've received it and will begin processing it shortly.

Order #{ORDER_ID}
Items: {ITEMS_LIST}
Total: {ORDER_TOTAL}

You'll receive another email once your order ships.

— The NEXTO Team`,
  },
  {
    key: 'shippingUpdate',
    label: 'Shipping update email',
    desc: 'Sent when order status changes to shipped',
    template: `Subject: Your NEXTO order #{ORDER_ID} is on its way!

Hi {CUSTOMER_NAME},

Great news — your order is out for delivery!

Tracking Number: {TRACKING_NUMBER}
Carrier: {CARRIER_NAME}
Estimated delivery: {ETA_DATE}

— The NEXTO Team`,
  },
  {
    key: 'lowStockAlert',
    label: 'Low-stock alert email',
    desc: 'Sent to admin when a variant drops to 5 or fewer units',
    template: `Subject: [NEXTO Admin] Low stock alert: {PRODUCT_NAME}

Hi Admin,

A product variant is running low on stock:

Product: {PRODUCT_NAME}
SKU: {SKU}
Remaining: {STOCK_COUNT} units

Please restock soon to avoid stockouts.

— NEXTO System`,
  },
];

function NotificationsTab({ onDirty }: { onDirty: (dirty: boolean) => void }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [previewKey, setPreviewKey] = useState<NotifKey | null>(null);

  const {
    watch,
    setValue,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm<NotificationsFormData>({
    resolver: zodResolver(notificationsSchema),
    defaultValues: {
      orderConfirmation: true,
      shippingUpdate: true,
      lowStockAlert: true,
    },
  });

  useEffect(() => {
    onDirty(isDirty);
  }, [isDirty, onDirty]);

  useEffect(() => {
    setLoading(true);
    api
      .get<NotificationsFormData>('/admin/settings/notifications')
      .then((data) => reset(data))
      .catch((err: unknown) => {
        toast({ message: err instanceof Error ? err.message : 'Failed to load', type: 'error' });
      })
      .finally(() => setLoading(false));
  }, [reset, toast]);

  const onSubmit = async (data: NotificationsFormData) => {
    try {
      await api.patch('/admin/settings/notifications', data);
      reset(data);
      toast({ message: 'Notification settings saved', type: 'success' });
    } catch (err: unknown) {
      toast({ message: err instanceof Error ? err.message : 'Failed to save', type: 'error' });
    }
  };

  const values = watch();
  const previewItem = NOTIFICATION_ITEMS.find((item) => item.key === previewKey);

  if (loading) return <div className="h-24 animate-pulse rounded-xl bg-[#E5E4DF]" />;

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <SectionCard>
          <div className="space-y-4">
            {NOTIFICATION_ITEMS.map((item) => (
              <div key={item.key} className="flex items-start justify-between gap-4 py-3 border-b border-[#E5E4DF] last:border-0">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#1A1A1A]">{item.label}</p>
                  <p className="text-xs text-[#6B6B65] mt-0.5">{item.desc}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setPreviewKey(item.key)}
                    className="text-xs font-semibold text-[#1F3A2E] hover:underline whitespace-nowrap"
                  >
                    Preview template
                  </button>
                  <Toggle
                    checked={values[item.key]}
                    onChange={(v) => setValue(item.key, v, { shouldDirty: true })}
                    label={item.label}
                  />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
        <div className="flex justify-end">
          <button
            type="submit"
            className="rounded-full bg-[#1F3A2E] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#2a4d3e] transition-colors"
          >
            Save changes
          </button>
        </div>
      </form>

      <SlideOverDrawer
        open={previewKey !== null}
        onClose={() => setPreviewKey(null)}
        title={previewItem?.label ?? 'Template preview'}
        width="sm"
      >
        {previewItem && (
          <div className="p-5">
            <p className="text-xs font-semibold text-[#6B6B65] uppercase tracking-wider mb-3">
              Email template
            </p>
            <pre className="whitespace-pre-wrap text-sm text-[#1A1A1A] font-mono bg-[#F7F6F2] rounded-xl p-4 leading-relaxed">
              {previewItem.template}
            </pre>
            <p className="mt-4 text-xs text-[#6B6B65]">
              Placeholders in curly braces are replaced with real values at send time.
            </p>
          </div>
        )}
      </SlideOverDrawer>
    </>
  );
}

// ─── Main SettingsPage ───────────────────────────────────────────────────────

export function SettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab') as TabKey | null;
  const activeTab: TabKey = TABS.some((t) => t.key === rawTab) ? (rawTab as TabKey) : 'general';

  const [pendingTab, setPendingTab] = useState<TabKey | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleTabClick = useCallback(
    (tab: TabKey) => {
      if (tab === activeTab) return;
      if (isDirty) {
        setPendingTab(tab);
        setShowConfirm(true);
      } else {
        setSearchParams({ tab });
      }
    },
    [activeTab, isDirty, setSearchParams],
  );

  const handleConfirmTabSwitch = useCallback(() => {
    if (pendingTab) {
      setSearchParams({ tab: pendingTab });
      setIsDirty(false);
    }
    setShowConfirm(false);
    setPendingTab(null);
  }, [pendingTab, setSearchParams]);

  const handleCancelTabSwitch = useCallback(() => {
    setShowConfirm(false);
    setPendingTab(null);
  }, []);

  const handleDirty = useCallback((dirty: boolean) => {
    setIsDirty(dirty);
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Store"
        title="Settings"
        subtitle="Configure your NEXTO store settings"
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Settings' }]}
      />

      {/* Tab nav */}
      <div className="flex gap-1 overflow-x-auto border-b border-[#E5E4DF]">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => handleTabClick(tab.key)}
            className={`flex items-center gap-1.5 shrink-0 px-4 py-2.5 text-xs font-semibold transition-colors border-b-2 ${
              activeTab === tab.key
                ? 'border-[#1F3A2E] text-[#1F3A2E]'
                : 'border-transparent text-[#6B6B65] hover:text-[#1A1A1A]'
            }`}
          >
            {tab.label}
            {activeTab === tab.key && isDirty && (
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" title="Unsaved changes" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'general' && <GeneralTab onDirty={handleDirty} />}
        {activeTab === 'shipping' && <ShippingTab onDirty={handleDirty} />}
        {activeTab === 'taxes' && <TaxesTab onDirty={handleDirty} />}
        {activeTab === 'payments' && <PaymentsTab onDirty={handleDirty} />}
        {activeTab === 'notifications' && <NotificationsTab onDirty={handleDirty} />}
      </div>

      {/* Unsaved changes confirm */}
      <ConfirmModal
        open={showConfirm}
        title="Unsaved changes"
        description="You have unsaved changes in this tab. If you switch tabs, your changes will be lost."
        confirmLabel="Switch anyway"
        cancelLabel="Stay here"
        isDangerous={false}
        onConfirm={handleConfirmTabSwitch}
        onCancel={handleCancelTabSwitch}
      />

      {/* Breadcrumb indicator for next tab */}
      {pendingTab && !showConfirm && (
        <div className="flex items-center gap-1 text-xs text-[#6B6B65]">
          <ChevronRight size={12} />
          Navigating to {TABS.find((t) => t.key === pendingTab)?.label}…
        </div>
      )}
    </div>
  );
}
