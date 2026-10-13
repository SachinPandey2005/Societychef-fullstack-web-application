import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/axios';

export default function Campaigns() {
  const queryClient = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [formData, setFormData] = useState({
    name: '', type: 'PUSH', target_audience: 'ALL', content: '', start_date: new Date().toISOString()
  });

  const { data: campaigns } = useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => (await apiClient.get(`/campaigns`)).data.data
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiClient.post(`/campaigns`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      setShowNew(false);
    }
  });

  return (
    <div className="p-8 max-w-6xl mx-auto text-white">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Campaign Management</h1>
        <button onClick={() => setShowNew(true)} className="bg-blue-600 px-4 py-2 rounded font-medium hover:bg-blue-500">Create Campaign</button>
      </div>

      {showNew && (
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 mb-8">
          <h2 className="text-xl font-bold mb-4">New Campaign</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <input placeholder="Name" className="bg-gray-700 p-2 rounded" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            <select className="bg-gray-700 p-2 rounded" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})}>
              <option value="PUSH">Push Notification</option>
              <option value="BANNER">In-App Banner</option>
              <option value="COUPON">Discount Coupon</option>
            </select>
            <input placeholder="Content (Message/Payload)" className="bg-gray-700 p-2 rounded col-span-2" value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} />
          </div>
          <div className="flex justify-end space-x-2">
            <button onClick={() => setShowNew(false)} className="bg-gray-600 px-4 py-2 rounded">Cancel</button>
            <button onClick={() => createMutation.mutate(formData)} className="bg-blue-600 px-4 py-2 rounded">Create</button>
          </div>
        </div>
      )}

      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-900 text-gray-400">
            <tr>
              <th className="p-4">Name</th>
              <th className="p-4">Type</th>
              <th className="p-4">Audience</th>
              <th className="p-4">Status</th>
              <th className="p-4">Metrics (S/O/C)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {campaigns?.map((c: any) => (
              <tr key={c.id}>
                <td className="p-4 font-medium">{c.name}</td>
                <td className="p-4"><span className="bg-gray-700 px-2 py-1 rounded text-xs">{c.type}</span></td>
                <td className="p-4">{c.target_audience}</td>
                <td className="p-4">{c.is_active ? <span className="text-green-400">Active</span> : <span className="text-red-400">Inactive</span>}</td>
                <td className="p-4">{c.metrics_sent} / {c.metrics_opened} / {c.metrics_converted}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!campaigns || campaigns.length === 0) && <div className="p-8 text-center text-gray-400">No campaigns found.</div>}
      </div>
    </div>
  );
}
