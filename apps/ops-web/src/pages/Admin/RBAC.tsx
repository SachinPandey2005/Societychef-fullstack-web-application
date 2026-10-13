import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/axios';

export default function RBAC() {
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const { data: roles } = useQuery({
    queryKey: ['rbac-roles'],
    queryFn: async () => (await apiClient.get(`/rbac/roles`)).data.data
  });

  const { data: permissions } = useQuery({
    queryKey: ['rbac-permissions'],
    queryFn: async () => (await apiClient.get(`/rbac/permissions`)).data.data
  });

  const { data: rolePermissions } = useQuery({
    queryKey: ['rbac-role-permissions', selectedRole],
    queryFn: async () => (await apiClient.get(`/rbac/roles/${selectedRole}/permissions`)).data.data,
    enabled: !!selectedRole
  });

  const updatePermissions = useMutation({
    mutationFn: async (perms: string[]) => {
      await apiClient.put(`/rbac/roles/${selectedRole}/permissions`, { permission_ids: perms });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rbac-role-permissions', selectedRole] })
  });

  const togglePermission = (permId: string) => {
    if (!rolePermissions) return;
    const newPerms = rolePermissions.includes(permId) 
      ? rolePermissions.filter((id: string) => id !== permId) 
      : [...rolePermissions, permId];
    updatePermissions.mutate(newPerms);
  };

  return (
    <div className="p-8 text-white max-w-6xl mx-auto flex gap-8">
      {/* Roles List */}
      <div className="w-1/3 bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h2 className="text-2xl font-bold mb-6">Roles</h2>
        <div className="space-y-3">
          {roles?.map((role: any) => (
            <button
              key={role.id}
              onClick={() => setSelectedRole(role.id)}
              className={`w-full text-left p-4 rounded-lg transition-colors border ${selectedRole === role.id ? 'bg-blue-600 border-blue-500' : 'bg-gray-700 border-gray-600 hover:bg-gray-600'}`}
            >
              <div className="font-semibold">{role.name}</div>
              <div className="text-sm text-gray-300">{role.description}</div>
            </button>
          ))}
          {(!roles || roles.length === 0) && <div className="text-gray-400">No custom roles found.</div>}
        </div>
      </div>

      {/* Permissions Matrix */}
      <div className="w-2/3 bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h2 className="text-2xl font-bold mb-6">Permissions Matrix</h2>
        {!selectedRole ? (
          <div className="text-gray-400">Select a role to manage its permissions.</div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {permissions?.map((perm: any) => {
              const isGranted = rolePermissions?.includes(perm.id);
              return (
                <div key={perm.id} className="flex items-center space-x-3 bg-gray-700 p-3 rounded">
                  <input 
                    type="checkbox" 
                    checked={isGranted || false} 
                    onChange={() => togglePermission(perm.id)}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 bg-gray-800 border-gray-600"
                  />
                  <div>
                    <div className="font-medium">{perm.module}: {perm.action}</div>
                    <div className="text-xs text-gray-400">{perm.description}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
