import { RoleGuard } from '@/components/layout/role-guard';
import { ROLES } from '@/lib/constants';

export const instant = false;

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={[ROLES.EV_OWNER]}>
      {children}
    </RoleGuard>
  );
}
