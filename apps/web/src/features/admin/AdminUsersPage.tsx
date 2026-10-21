import { useState, useEffect, useCallback } from 'react';
import { Search, CheckCircle2 } from 'lucide-react';
import { Button } from '../../components/ui/Button.js';
import { Card } from '../../components/ui/Card.js';
import { Badge } from '../../components/ui/Badge.js';
import { ConfirmationDialog } from '../../components/ui/ConfirmationDialog.js';
import { Pagination } from '../../components/ui/Pagination.js';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton.js';
import { EmptyState } from '../../components/ui/EmptyState.js';
import { ErrorState } from '../../components/ui/ErrorState.js';
import { adminApi, AdminUserItem } from '../../lib/api/admin.js';
import { UserRole } from '@tourist/shared';

export function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [search, setSearch] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Role Update State
  const [targetUser, setTargetUser] = useState<AdminUserItem | null>(null);
  const [targetNewRole, setTargetNewRole] = useState<UserRole>('ADMIN');
  const [isUpdatingRole, setIsUpdatingRole] = useState<boolean>(false);

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const res = await adminApi.getAdminUsers({
        page,
        pageSize,
        search: search.trim() || undefined,
        role: roleFilter || undefined,
      });
      setUsers(res.items || []);
      setTotalPages(res.pagination?.totalPages || 1);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to retrieve users.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, search, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleConfirmRoleChange = async () => {
    if (!targetUser) return;
    try {
      setIsUpdatingRole(true);
      await adminApi.updateUserRole(targetUser.id, targetNewRole);
      setTargetUser(null);
      await fetchUsers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update user role.';
      alert(`Role update error: ${msg}`);
    } finally {
      setIsUpdatingRole(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <Badge variant="warning" className="mb-2">
          IDENTITY & ACCESS
        </Badge>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100">User Directory</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Inspect customer accounts, review booking engagement, and delegate administrative roles.
        </p>
      </div>

      {/* Search & Role Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              placeholder="Search user by name or email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value as UserRole | '');
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
            >
              <option value="">All Roles</option>
              <option value="TOURIST">Tourist</option>
              <option value="ADMIN">Administrator</option>
              <option value="GUIDE">Guide</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Table Content */}
      {isLoading ? (
        <div className="space-y-3">
          <LoadingSkeleton className="h-16 w-full rounded-xl" />
          <LoadingSkeleton className="h-16 w-full rounded-xl" />
          <LoadingSkeleton className="h-16 w-full rounded-xl" />
        </div>
      ) : errorMessage ? (
        <ErrorState
          title="Could not load user records"
          message={errorMessage}
          onRetry={fetchUsers}
        />
      ) : users.length === 0 ? (
        <EmptyState
          title="No users match your criteria"
          description="Try modifying your search or clearing the role filter."
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-900/60 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Bookings</th>
                  <th className="py-3 px-4">Reviews</th>
                  <th className="py-3 px-4">Email Status</th>
                  <th className="py-3 px-4">Joined</th>
                  <th className="py-3 px-4 text-right">Role Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-100">{u.name}</p>
                      <p className="text-[11px] text-slate-500">{u.email}</p>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={u.role === 'ADMIN' ? 'warning' : 'neutral'}>
                        {u.role}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-400">{u.phoneNumber || '—'}</td>
                    <td className="py-3 px-4 text-slate-300 font-semibold">{u.bookingCount}</td>
                    <td className="py-3 px-4 text-slate-300">{u.reviewCount}</td>
                    <td className="py-3 px-4">
                      <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Verified</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(u.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {u.role === 'ADMIN' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setTargetUser(u);
                              setTargetNewRole('TOURIST');
                            }}
                          >
                            Demote to Tourist
                          </Button>
                        ) : (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => {
                              setTargetUser(u);
                              setTargetNewRole('ADMIN');
                            }}
                          >
                            Grant Admin
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-800 flex justify-center">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={(p) => setPage(p)}
              />
            </div>
          )}
        </Card>
      )}

      {/* Role Mutation Confirmation Dialog */}
      {targetUser && (
        <ConfirmationDialog
          isOpen={Boolean(targetUser)}
          onClose={() => setTargetUser(null)}
          onConfirm={handleConfirmRoleChange}
          title="Confirm User Role Change"
          description={`Are you sure you want to change the role of ${targetUser.name} (${targetUser.email}) from ${targetUser.role} to ${targetNewRole}? This will immediately update their access permissions across the system.`}
          confirmText={`Set Role to ${targetNewRole}`}
          isConfirming={isUpdatingRole}
          variant={targetNewRole === 'ADMIN' ? 'primary' : 'danger'}
        />
      )}
    </div>
  );
}
