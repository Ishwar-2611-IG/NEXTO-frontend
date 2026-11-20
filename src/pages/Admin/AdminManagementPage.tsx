import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Check,
  Info,
  MailPlus,
  Shield,
  UserCheck,
  UserX,
  X,
} from 'lucide-react';
import {
  ConfirmModal,
  DataTable,
  EmptyState,
  PageHeader,
  StatusBadge,
  useToast,
} from '../../components/admin';
import type { Column } from '../../components/admin';
import { api } from '../../services/api';

type StaffRole = 'support' | 'inventory_manager' | 'admin';

interface StaffMember {
  _id: string;
  name: string;
  email: string;
  role: StaffRole;
  isActive: boolean;
  createdAt?: string;
}

interface StaffListResponse {
  items: StaffMember[];
}

const inviteSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Enter a valid email address'),
  role: z.enum(['support', 'inventory_manager']),
});

type InviteFormValues = z.infer<typeof inviteSchema>;

const STAFF_ROLE_OPTIONS: Array<{ value: StaffRole; label: string }> = [
  { value: 'support', label: 'Support' },
  { value: 'inventory_manager', label: 'Inventory Manager' },
  { value: 'admin', label: 'Admin' },
];

const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
  support: 'Support',
  inventory_manager: 'Inventory Manager',
  admin: 'Admin',
};

interface PermissionRow {
  permission: string;
  support: boolean;
  inventoryManager: boolean;
  admin: boolean;
}

const PERMISSION_MATRIX: PermissionRow[] = [
  { permission: 'View orders', support: true, inventoryManager: false, admin: true },
  { permission: 'Update order status', support: true, inventoryManager: false, admin: true },
  { permission: 'Manage products', support: false, inventoryManager: true, admin: true },
  { permission: 'Adjust inventory', support: false, inventoryManager: true, admin: true },
  { permission: 'Manage categories', support: false, inventoryManager: true, admin: true },
  { permission: 'Moderate reviews', support: true, inventoryManager: false, admin: true },
  { permission: 'View payment issues', support: true, inventoryManager: false, admin: true },
  { permission: 'Manage support conversations', support: true, inventoryManager: false, admin: true },
  { permission: 'Manage customers', support: false, inventoryManager: false, admin: true },
  { permission: 'View audit logs', support: true, inventoryManager: false, admin: true },
  { permission: 'Manage settings', support: false, inventoryManager: false, admin: true },
];

function formatDate(iso?: string): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function isStaffRole(value: string): value is StaffRole {
  return value === 'support' || value === 'inventory_manager' || value === 'admin';
}

function PermissionCell({ allowed }: { allowed: boolean }): React.ReactElement {
  return allowed ? (
    <span
      className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"
      aria-label="Allowed"
      title="Allowed"
    >
      <Check className="w-3.5 h-3.5" aria-hidden="true" />
    </span>
  ) : (
    <span
      className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#F7F6F2] text-[#6B6B65]/60"
      aria-label="Not allowed"
      title="Not allowed"
    >
      <X className="w-3.5 h-3.5" aria-hidden="true" />
    </span>
  );
}

export function AdminManagementPage(): React.ReactElement {
  const { toast } = useToast();

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<StaffMember | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: '',
      role: 'support',
    },
  });

  const loadStaff = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await api.get<StaffListResponse>('/admin/staff?page=1&limit=100');
      setStaff(result.items);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Could not load team members.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStaff();
  }, [loadStaff]);

  const onInviteSubmit = async (values: InviteFormValues) => {
    try {
      await api.post('/admin/staff-invitations', {
        email: values.email.trim(),
        role: values.role,
      });
      toast({
        message: `Invitation sent to ${values.email.trim()}`,
        type: 'success',
      });
      reset({ email: '', role: values.role });
      void loadStaff();
    } catch (cause: unknown) {
      toast({
        message: cause instanceof Error ? cause.message : 'Could not send invitation.',
        type: 'error',
      });
    }
  };

  const handleRoleChange = useCallback(
    async (member: StaffMember, nextRoleValue: string) => {
      if (member.role === 'admin' || !isStaffRole(nextRoleValue) || nextRoleValue === member.role) {
        return;
      }
      setBusyId(member._id);
      try {
        await api.patch(`/admin/customers/${member._id}/role`, { role: nextRoleValue });
        setStaff((prev) =>
          prev.map((item) =>
            item._id === member._id ? { ...item, role: nextRoleValue } : item
          )
        );
        toast({
          message: `Updated ${member.name}'s role to ${STAFF_ROLE_LABELS[nextRoleValue]}.`,
          type: 'success',
        });
      } catch (cause: unknown) {
        toast({
          message: cause instanceof Error ? cause.message : 'Could not update role.',
          type: 'error',
        });
      } finally {
        setBusyId(null);
      }
    },
    [toast]
  );

  const handleStatusChange = useCallback(
    async (member: StaffMember, isActive: boolean) => {
      if (member.role === 'admin') return;
      setBusyId(member._id);
      try {
        await api.patch(`/admin/customers/${member._id}/status`, { isActive });
        setStaff((prev) =>
          prev.map((item) => (item._id === member._id ? { ...item, isActive } : item))
        );
        toast({
          message: isActive
            ? `${member.name} has been reactivated.`
            : `${member.name} has been deactivated.`,
          type: 'success',
        });
      } catch (cause: unknown) {
        toast({
          message: cause instanceof Error ? cause.message : 'Could not update team member status.',
          type: 'error',
        });
      } finally {
        setBusyId(null);
      }
    },
    [toast]
  );

  const handleConfirmDeactivate = useCallback(async () => {
    if (!deactivateTarget) return;
    await handleStatusChange(deactivateTarget, false);
    setDeactivateTarget(null);
  }, [deactivateTarget, handleStatusChange]);

  const columns = useMemo<Column<StaffMember>[]>(
    () => [
      {
        key: 'name',
        header: 'Team Member',
        sortable: true,
        render: (row) => (
          <div className="min-w-0">
            <p className="font-medium text-[#1A1A1A] truncate">{row.name}</p>
            <p className="text-xs text-[#6B6B65] truncate">{row.email}</p>
          </div>
        ),
      },
      {
        key: 'role',
        header: 'Role',
        render: (row) => (
          <select
            aria-label={`Role for ${row.name}`}
            value={row.role}
            disabled={row.role === 'admin' || busyId === row._id}
            onChange={(e) => void handleRoleChange(row, e.target.value)}
            className="rounded-lg border border-[#E5E4DF] bg-white px-2.5 py-1.5 text-xs font-medium text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#1F3A2E] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {STAFF_ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ),
      },
      {
        key: 'isActive',
        header: 'Status',
        render: (row) => (
          <StatusBadge status={row.isActive ? 'active' : 'deactivated'} variant="generic" />
        ),
      },
      {
        key: 'createdAt',
        header: 'Last Active',
        sortable: true,
        render: (row) => (
          <span className="text-xs text-[#6B6B65] whitespace-nowrap">
            {formatDate(row.createdAt)}
          </span>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        render: (row) => {
          const isAdmin = row.role === 'admin';
          const isBusy = busyId === row._id;
          return (
            <button
              type="button"
              disabled={isAdmin || isBusy}
              onClick={() => {
                if (row.isActive) {
                  setDeactivateTarget(row);
                } else {
                  void handleStatusChange(row, true);
                }
              }}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                row.isActive
                  ? 'border-red-200 bg-white text-red-700 hover:bg-red-50'
                  : 'border-[#E5E4DF] bg-white text-[#1F3A2E] hover:bg-[#E8EDE9]'
              }`}
            >
              {row.isActive ? (
                <>
                  <UserX className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Deactivate</span>
                </>
              ) : (
                <>
                  <UserCheck className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Reactivate</span>
                </>
              )}
            </button>
          );
        },
      },
    ],
    [busyId, handleRoleChange, handleStatusChange]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Access Control"
        title="Admin Management"
        subtitle="Manage team members with scoped permissions"
      />

      {/* Invite Section */}
      <section className="rounded-xl border border-[#E5E4DF] bg-white p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E8EDE9] text-[#1F3A2E]">
            <MailPlus className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-serif text-lg font-semibold text-[#1A1A1A]">
              Invite Team Member
            </h2>
            <p className="text-xs text-[#6B6B65] mt-0.5">
              Send a scoped staff invitation link valid for 72 hours.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit(onInviteSubmit)}
          noValidate
          className="grid gap-4 sm:grid-cols-[1fr_220px_auto] sm:items-start"
        >
          <div>
            <label
              htmlFor="staff-invite-email"
              className="block text-xs font-semibold text-[#1A1A1A] mb-1.5"
            >
              Email Address
            </label>
            <input
              id="staff-invite-email"
              type="email"
              placeholder="teammate@nexto.store"
              {...register('email')}
              className="w-full rounded-lg border border-[#E5E4DF] bg-white px-3.5 py-2.5 text-sm text-[#1A1A1A] placeholder-[#6B6B65] focus:outline-none focus:ring-2 focus:ring-[#1F3A2E]"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="staff-invite-role"
              className="block text-xs font-semibold text-[#1A1A1A] mb-1.5"
            >
              Role
            </label>
            <select
              id="staff-invite-role"
              {...register('role')}
              className="w-full rounded-lg border border-[#E5E4DF] bg-white px-3.5 py-2.5 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#1F3A2E]"
            >
              <option value="support">Support</option>
              <option value="inventory_manager">Inventory Manager</option>
            </select>
            {errors.role && (
              <p className="mt-1 text-xs text-red-600">{errors.role.message}</p>
            )}
          </div>

          <div className="sm:pt-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-[#1F3A2E] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#162a21] transition-colors disabled:opacity-50"
            >
              <MailPlus className="w-4 h-4" aria-hidden="true" />
              <span>{isSubmitting ? 'Sending...' : 'Send Invitation'}</span>
            </button>
          </div>
        </form>

        <p className="flex items-center gap-1.5 text-xs text-[#6B6B65]">
          <Info className="w-3.5 h-3.5 shrink-0 text-[#6B6B65]" aria-hidden="true" />
          <span>Invitations require RESEND_API_KEY in backend environment.</span>
        </p>
      </section>

      {/* Team Table */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-lg font-semibold text-[#1A1A1A]">Team Members</h2>
          {!loading && (
            <span className="text-xs text-[#6B6B65]">
              {staff.length} {staff.length === 1 ? 'member' : 'members'}
            </span>
          )}
        </div>

        {error && (
          <div
            role="alert"
            className="flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            <span>{error}</span>
            <button
              type="button"
              onClick={() => void loadStaff()}
              className="shrink-0 rounded-lg border border-red-300 bg-white px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-50"
            >
              Retry
            </button>
          </div>
        )}

        <DataTable<StaffMember>
          columns={columns}
          data={staff}
          loading={loading}
          keyExtractor={(row) => row._id}
          emptyState={
            <EmptyState
              icon={<Shield className="w-6 h-6" />}
              title="No team members yet"
              description="Invite Support or Inventory Manager staff above to grant scoped admin access."
            />
          }
        />
      </section>

      {/* Permission Matrix */}
      <section className="rounded-xl border border-[#E5E4DF] bg-white overflow-hidden">
        <div className="border-b border-[#E5E4DF] px-6 py-4">
          <h2 className="font-serif text-lg font-semibold text-[#1A1A1A]">
            Permission Matrix
          </h2>
          <p className="mt-0.5 text-xs text-[#6B6B65]">
            Read-only reference of capabilities granted to each administrative role.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="border-b border-[#E5E4DF] bg-[#FAF9F6]">
              <tr>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]">
                  Permission
                </th>
                <th className="px-6 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]">
                  Support
                </th>
                <th className="px-6 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]">
                  Inventory Mgr
                </th>
                <th className="px-6 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]">
                  Admin
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E4DF]">
              {PERMISSION_MATRIX.map((row) => (
                <tr key={row.permission} className="hover:bg-[#F7F6F2] transition-colors">
                  <td className="px-6 py-3.5 font-medium text-[#1A1A1A]">
                    {row.permission}
                  </td>
                  <td className="px-6 py-3.5 text-center">
                    <PermissionCell allowed={row.support} />
                  </td>
                  <td className="px-6 py-3.5 text-center">
                    <PermissionCell allowed={row.inventoryManager} />
                  </td>
                  <td className="px-6 py-3.5 text-center">
                    <PermissionCell allowed={row.admin} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <ConfirmModal
        open={Boolean(deactivateTarget)}
        title="Deactivate Team Member"
        description={
          deactivateTarget
            ? `Deactivate ${deactivateTarget.name}? They will lose admin access immediately.`
            : ''
        }
        confirmLabel="Deactivate"
        isDangerous
        onConfirm={handleConfirmDeactivate}
        onCancel={() => setDeactivateTarget(null)}
      />
    </div>
  );
}

export default AdminManagementPage;
