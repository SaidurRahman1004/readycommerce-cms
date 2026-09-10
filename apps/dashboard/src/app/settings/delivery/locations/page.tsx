'use client';

import { useEffect, useState } from 'react';
import { adminDeliveryZoneService, AdminDeliveryZone } from '@/services/api-service';
import { Plus, Edit2, Trash2, MapPin, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';

export default function DeliveryLocationsPage() {
  const [zones, setZones] = useState<AdminDeliveryZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<AdminDeliveryZone | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    deliveryCharge: 0,
    postalCodes: '',
    isActive: true,
    codAvailable: true
  });
  const [submitting, setSubmitting] = useState(false);

  async function fetchZones() {
    try {
      const res = await adminDeliveryZoneService.list();
      setZones(res.data);
    } catch (error) {
      toast.error('Failed to load delivery zones');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchZones();
  }, []);

  const openAddModal = () => {
    setEditingZone(null);
    setFormData({ name: '', deliveryCharge: 0, postalCodes: '', isActive: true, codAvailable: true });
    setIsModalOpen(true);
  };

  const openEditModal = (zone: AdminDeliveryZone) => {
    setEditingZone(zone);
    setFormData({
      name: zone.name,
      deliveryCharge: zone.deliveryCharge,
      postalCodes: zone.postalCodes.join(', '),
      isActive: zone.isActive,
      codAvailable: zone.codAvailable
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    const payload = {
      name: formData.name,
      deliveryCharge: Number(formData.deliveryCharge),
      postalCodes: formData.postalCodes.split(',').map(s => s.trim()).filter(Boolean),
      isActive: formData.isActive,
      codAvailable: formData.codAvailable
    };

    try {
      if (editingZone) {
        await adminDeliveryZoneService.update(editingZone._id, payload);
        toast.success('Delivery zone updated');
      } else {
        await adminDeliveryZoneService.create(payload);
        toast.success('Delivery zone created');
      }
      setIsModalOpen(false);
      fetchZones();
    } catch (error: any) {
      toast.error(error.message || 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this delivery zone?')) return;
    try {
      await adminDeliveryZoneService.delete(id);
      toast.success('Delivery zone deleted');
      fetchZones();
    } catch (error) {
      toast.error('Failed to delete delivery zone');
    }
  };

  const filteredZones = zones.filter(z => z.name.toLowerCase().includes(search.toLowerCase()) || z.postalCodes.some(p => p.includes(search)));

  return (
    <div className="p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Delivery Locations & Zones</h1>
          <p className="mt-1 text-sm text-slate-500">Manage delivery charges and COD eligibility for different areas.</p>
        </div>
        <Button onClick={openAddModal} className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add Zone
        </Button>
      </div>

      <div className="mb-6 flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by zone name or postal code..."
            className="w-full rounded-lg border-slate-300 pl-10 focus:border-slate-500 focus:ring-slate-500 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <DataTable<AdminDeliveryZone>
        keyExtractor={(zone) => zone._id}
        columns={[
          { key: 'name', label: 'Zone Name' },
          { 
            key: 'postalCodes', 
            label: 'Postal Codes',
            render: (z) => z.postalCodes.length ? <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">{z.postalCodes.length} Codes</span> : <span className="text-xs text-slate-400">All</span>
          },
          { 
            key: 'deliveryCharge', 
            label: 'Delivery Fee',
            render: (z) => <span className="font-semibold">৳{z.deliveryCharge}</span>
          },
          {
            key: 'codAvailable',
            label: 'COD',
            render: (z) => z.codAvailable ? <span className="text-emerald-600 font-medium text-sm">Available</span> : <span className="text-rose-600 font-medium text-sm">Disabled</span>
          },
          {
            key: 'isActive',
            label: 'Status',
            render: (z) => z.isActive ? <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">Active</span> : <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">Inactive</span>
          },
          {
            key: 'actions',
            label: 'Actions',
            render: (z) => (
              <div className="flex items-center gap-2">
                <button onClick={() => openEditModal(z)} className="text-slate-400 hover:text-slate-600">
                  <Edit2 className="h-4 w-4" />
                </button>
                <button onClick={() => handleDelete(z._id)} className="text-slate-400 hover:text-rose-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )
          }
        ]}
        data={filteredZones}
        isLoading={loading}
        emptyState={
          <div className="py-16 text-center">
            <MapPin className="mx-auto h-10 w-10 text-slate-300" />
            <h3 className="mt-3 font-bold">No delivery zones found</h3>
            <p className="mt-1 text-sm text-slate-500">Create delivery zones to manage shipping costs and COD availability by area.</p>
          </div>
        }
      />

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold mb-4">{editingZone ? 'Edit Delivery Zone' : 'Add Delivery Zone'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Zone Name</label>
                <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full rounded-lg border-slate-300 text-sm focus:ring-slate-500 focus:border-slate-500" placeholder="e.g. Inside Dhaka" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Delivery Charge (৳)</label>
                <input required type="number" min="0" value={formData.deliveryCharge} onChange={(e) => setFormData({...formData, deliveryCharge: Number(e.target.value)})} className="w-full rounded-lg border-slate-300 text-sm focus:ring-slate-500 focus:border-slate-500" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Postal Codes (Optional)</label>
                <input type="text" value={formData.postalCodes} onChange={(e) => setFormData({...formData, postalCodes: e.target.value})} className="w-full rounded-lg border-slate-300 text-sm focus:ring-slate-500 focus:border-slate-500" placeholder="Comma separated, e.g. 1205, 1209, 1215" />
                <p className="mt-1 text-xs text-slate-500">Leave empty to match by zone name directly (e.g. city match).</p>
              </div>
              
              <div className="flex gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.codAvailable} onChange={(e) => setFormData({...formData, codAvailable: e.target.checked})} className="rounded text-slate-900 focus:ring-slate-900" />
                  <span className="text-sm font-medium">Enable Cash on Delivery</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({...formData, isActive: e.target.checked})} className="rounded text-emerald-600 focus:ring-emerald-600" />
                  <span className="text-sm font-medium">Zone is Active</span>
                </label>
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Save Zone'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
