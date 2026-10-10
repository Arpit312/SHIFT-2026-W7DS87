import { RoleGuard } from '@/components/layout/role-guard';
import { ROLES } from '@/lib/constants';

export const instant = false;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={[ROLES.SUPER_ADMIN]}>
      {children}
    </RoleGuard>
  );
}
