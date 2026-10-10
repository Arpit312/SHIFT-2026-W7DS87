from rest_framework import permissions

class IsSuperAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and hasattr(request.user, 'role') and request.user.role == 'super_admin')

class IsRWAAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and hasattr(request.user, 'role') and request.user.role == 'rwa_admin')

class IsElectrician(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and hasattr(request.user, 'role') and request.user.role == 'electrician')

class IsEVOwner(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and hasattr(request.user, 'role') and request.user.role == 'ev_owner')
