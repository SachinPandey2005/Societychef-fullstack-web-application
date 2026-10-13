import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import T from '../tokens';
import Badge from '../components/Badge';
import { useChefProfile, useSavePartyMenu } from '../hooks/useCrmData';

export default function KitchenPartyProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: chefData, isLoading, isError, refetch } = useChefProfile(id);
  const savePartyMenu = useSavePartyMenu();

  const [isEnabled, setIsEnabled] = useState(true);
  const [minGuests, setMinGuests] = useState(8);
  const [advanceNotice, setAdvanceNotice] = useState(48);
  const [packages, setPackages] = useState<any[]>([]);
  const [dishes, setDishes] = useState<any[]>([]);

  const [notification, setNotification] = useState<string | null>(null);
  const [editingPackage, setEditingPackage] = useState<any | null>(null);

  // Form states for adding/editing package
  const [packName, setPackName] = useState('');
  const [packDesc, setPackDesc] = useState('');
  const [packPrice, setPackPrice] = useState(250);
  const [packMin, setPackMin] = useState(8);
  const [packMax, setPackMax] = useState(50);

  function notify(msg: string) {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  }

  useEffect(() => {
    if (chefData?.partyMenu) {
      setIsEnabled(chefData.partyMenu.isEnabled ?? chefData.partyMenu.is_enabled ?? true);
      setMinGuests(chefData.partyMenu.minGuests ?? chefData.partyMenu.min_guests ?? 8);
      setAdvanceNotice(chefData.partyMenu.advanceNoticeHours ?? chefData.partyMenu.advance_notice_hours ?? 48);
      setPackages(chefData.partyMenu.packages || []);
      setDishes(chefData.partyMenu.dishes || []);
    }
  }, [chefData]);

  if (isLoading) {
    return <div className="p-8 text-slate-500 animate-pulse">Loading party settings profile...</div>;
  }

  if (isError || !chefData) {
    return (
      <div className="p-8 text-center text-red-600 bg-red-50 rounded-xl border border-red-200">
        Error loading kitchen party settings.
      </div>
    );
  }

  const { kitchen } = chefData;

  const handleSaveSettings = () => {
    savePartyMenu.mutate(
      {
        kitchenId: kitchen.id,
        menu: {
          is_enabled: isEnabled,
          min_guests: minGuests,
          advance_notice_hours: advanceNotice,
          packages,
          dishes,
        }
      },
      {
        onSuccess: () => {
          notify('Party configuration saved successfully');
          refetch();
        }
      }
    );
  };

  const handleAddPackage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!packName.trim()) return;

    const newPack = {
      id: editingPackage?.id || `pack-${Date.now()}`,
      name: packName,
      description: packDesc,
      pricePerHead: Number(packPrice),
      minGuests: Number(packMin),
      maxGuests: Number(packMax),
      status: 'ACTIVE'
    };

    if (editingPackage) {
      setPackages(prev => prev.map(p => p.id === editingPackage.id ? newPack : p));
    } else {
      setPackages(prev => [...prev, newPack]);
    }

    setEditingPackage(null);
    setPackName('');
    setPackDesc('');
    setPackPrice(250);
  };

  const handleRemovePackage = (packId: string) => {
    if (confirm('Delete this package config?')) {
      setPackages(prev => prev.filter(p => p.id !== packId));
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Toast Alert */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-xl text-sm transition-all duration-300">
          {notification}
        </div>
      )}

      {/* Title */}
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">🎉 Party Profile: {kitchen.name}</h1>
          <p className="text-xs text-slate-500">Configure booking thresholds, custom combo menus, and head-count rules.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/crm/chefs/${kitchen.id}`)}
            className="px-4 py-2 border rounded-lg text-xs font-semibold"
          >
            Back to Chef Profile
          </button>
          <button
            onClick={handleSaveSettings}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition"
          >
            Save All Changes 💾
          </button>
        </div>
      </div>

      {/* SETTINGS CARD */}
      <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-6">
        <h2 className="text-sm font-bold text-slate-800 border-b pb-2">1. Booking General Thresholds</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-500">Enable Party Mode</label>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={e => setIsEnabled(e.target.checked)}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
              />
              <span className="text-sm text-slate-700">Active on apps</span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-500">Minimum Guests</label>
            <input
              type="number"
              value={minGuests}
              onChange={e => setMinGuests(Number(e.target.value))}
              className="w-full border p-2 rounded-lg text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-500">Advance Notice (Hours)</label>
            <input
              type="number"
              value={advanceNotice}
              onChange={e => setAdvanceNotice(Number(e.target.value))}
              className="w-full border p-2 rounded-lg text-sm"
            />
          </div>
        </div>
      </div>

      {/* PACKAGES CARD */}
      <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-6">
        <h2 className="text-sm font-bold text-slate-800 border-b pb-2">2. Package Tier Management</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Add / Edit Package Form */}
          <form onSubmit={handleAddPackage} className="border p-4 rounded-xl space-y-3 bg-slate-50">
            <h3 className="text-xs font-bold text-slate-700">{editingPackage ? 'Edit Package' : 'Create New Tier'}</h3>
            <div className="space-y-2">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500">Tier Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DAWAAT, JALSA"
                  value={packName}
                  onChange={e => setPackName(e.target.value)}
                  className="w-full border p-1.5 rounded-lg text-xs bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500">Description</label>
                <textarea
                  placeholder="Inclusions list..."
                  value={packDesc}
                  onChange={e => setPackDesc(e.target.value)}
                  className="w-full border p-1.5 rounded-lg text-xs bg-white h-16"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500">Price/Head</label>
                  <input
                    type="number"
                    value={packPrice}
                    onChange={e => setPackPrice(Number(e.target.value))}
                    className="w-full border p-1.5 rounded-lg text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500">Min</label>
                  <input
                    type="number"
                    value={packMin}
                    onChange={e => setPackMin(Number(e.target.value))}
                    className="w-full border p-1.5 rounded-lg text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500">Max</label>
                  <input
                    type="number"
                    value={packMax}
                    onChange={e => setPackMax(Number(e.target.value))}
                    className="w-full border p-1.5 rounded-lg text-xs bg-white"
                  />
                </div>
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition"
            >
              {editingPackage ? 'Update Package' : 'Add Package'}
            </button>
          </form>

          {/* Packages List */}
          <div className="md:col-span-2 space-y-3">
            {packages.length > 0 ? (
              packages.map((pack: any) => (
                <div key={pack.id} className="p-4 border rounded-xl flex justify-between items-center shadow-sm">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-800">{pack.name}</span>
                      <Badge label="ACTIVE" tone="green" />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{pack.description}</p>
                    <div className="text-[10px] text-slate-400 mt-1">
                      ₹{pack.pricePerHead}/head | Guests: {pack.minGuests}-{pack.maxGuests}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingPackage(pack);
                        setPackName(pack.name);
                        setPackDesc(pack.description || '');
                        setPackPrice(pack.pricePerHead);
                        setPackMin(pack.minGuests);
                        setPackMax(pack.maxGuests);
                      }}
                      className="px-2 py-1 border hover:bg-slate-50 text-[10px] font-bold text-slate-600 rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleRemovePackage(pack.id)}
                      className="px-2 py-1 border hover:bg-red-50 text-[10px] font-bold text-red-600 rounded"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-8 text-center border rounded-xl border-dashed">
                No custom package tiers created. Add packages above!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
