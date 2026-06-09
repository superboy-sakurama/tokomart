import { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Users, MapPin, Mail, Phone, Package, ShieldAlert } from 'lucide-react';
import { Customer } from '../types';
import { CustomerService } from '../services/customers';

export function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'CREATE' | 'EDIT'>('CREATE');
  const [currentCustomer, setCurrentCustomer] = useState<Partial<Customer>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const data = await CustomerService.getAll();
      setCustomers(data);
    } catch (error: any) {
      setErrorMsg(error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    (c.phone && c.phone.includes(search)) ||
    (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
  );

  const openCreateModal = () => {
    setModalMode('CREATE');
    setCurrentCustomer({ name: '', phone: '', email: '', address: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (customer: Customer) => {
    setModalMode('EDIT');
    setCurrentCustomer({ ...customer, email: customer.email || '', address: customer.address || '' });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Hapus pelanggan ${name}? Data tidak dapat dikembalikan.`)) {
      try {
        await CustomerService.remove(id);
        setCustomers(customers.filter(c => c.id !== id));
      } catch (error: any) {
        alert(error.message);
      }
    }
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (modalMode === 'CREATE') {
        const payload = {
          name: currentCustomer.name || '',
          phone: currentCustomer.phone || '',
          email: currentCustomer.email || null,
          address: currentCustomer.address || null,
        };
        const newCustomer = await CustomerService.create(payload);
        setCustomers([...customers, newCustomer]);
      } else if (modalMode === 'EDIT' && currentCustomer.id) {
        const payload = {
          name: currentCustomer.name,
          phone: currentCustomer.phone,
          email: currentCustomer.email || null,
          address: currentCustomer.address || null,
        };
        const updated = await CustomerService.update(currentCustomer.id, payload);
        setCustomers(customers.map(c => c.id === updated.id ? updated : c));
      }
      setIsModalOpen(false);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Database Pelanggan</h1>
          <p className="text-gray-500 mt-1 text-sm">Kelola kontak, alamat, dan informasi member Anda.</p>
        </div>
        <button 
          onClick={openCreateModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-sm whitespace-nowrap"
        >
          <Plus className="w-4 h-4" /> Tambah Pelanggan
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              placeholder="Cari nama, no hp, atau email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm bg-white transition-all outline-none"
            />
          </div>
        </div>

        {errorMsg ? (
           <div className="p-12 text-center text-red-500 flex flex-col items-center">
               <ShieldAlert className="w-12 h-12 mb-3 opacity-50" />
               <p className="font-semibold">{errorMsg}</p>
           </div>
        ) : loading ? (
           <div className="flex justify-center items-center p-20">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
           </div>
        ) : filteredCustomers.length === 0 ? (
           <div className="flex flex-col justify-center items-center p-20 text-gray-400">
              <Users className="w-16 h-16 mb-4 opacity-30 gap-2" />
              <p className="text-lg font-medium text-gray-500">Tidak ada pelanggan ditemukan</p>
              <p className="text-sm">Mulai tambahkan relasi pelanggan ke dalam sistem.</p>
           </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500">
                  <th className="p-4 font-bold">Nama Pelanggan</th>
                  <th className="p-4 font-bold">Kontak Info</th>
                  <th className="p-4 font-bold hidden md:table-cell">Alamat</th>
                  <th className="p-4 font-bold text-center w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                 {filteredCustomers.map(customer => (
                    <tr key={customer.id} className="hover:bg-gray-50/50 transition-colors group">
                       <td className="p-4">
                          <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">
                                {customer.name.charAt(0).toUpperCase()}
                             </div>
                             <div>
                                <h3 className="font-bold text-gray-900">{customer.name}</h3>
                                <p className="text-xs text-gray-400 font-mono mt-0.5">ID: {customer.id.substring(0,8)}</p>
                             </div>
                          </div>
                       </td>
                       <td className="p-4">
                          <div className="space-y-1.5 object-cover">
                             <p className="text-sm text-gray-600 flex items-center gap-2">
                                <Phone className="w-3.5 h-3.5 text-gray-400" />
                                {customer.phone || '-'}
                             </p>
                             <p className="text-sm text-gray-600 flex items-center gap-2">
                                <Mail className="w-3.5 h-3.5 text-gray-400" />
                                {customer.email || '-'}
                             </p>
                          </div>
                       </td>
                       <td className="p-4 hidden md:table-cell">
                          <p className="text-sm text-gray-600 flex items-start gap-2 line-clamp-2 max-w-xs">
                             <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                             {customer.address || '-'}
                          </p>
                       </td>
                       <td className="p-4">
                          <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button 
                               onClick={() => openEditModal(customer)}
                               className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                               title="Edit"
                             >
                               <Edit2 className="w-4 h-4" />
                             </button>
                             <button 
                               onClick={() => handleDelete(customer.id, customer.name)}
                               className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                               title="Hapus"
                             >
                               <Trash2 className="w-4 h-4" />
                             </button>
                          </div>
                       </td>
                    </tr>
                 ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal / Dialog Base Implementation */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">
                {modalMode === 'CREATE' ? 'Pendaftaran Pelanggan Baru' : 'Edit Data Pelanggan'}
              </h2>
            </div>
            
            <form onSubmit={handleSaveCustomer}>
              <div className="px-6 py-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-gray-700">Nama Lengkap *</label>
                  <input
                    type="text"
                    required
                    value={currentCustomer.name || ''}
                    onChange={(e) => setCurrentCustomer({...currentCustomer, name: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    placeholder="Contoh: Budi Santoso"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-gray-700">Nomor Telepon *</label>
                    <input
                      type="text"
                      required
                      value={currentCustomer.phone || ''}
                      onChange={(e) => setCurrentCustomer({...currentCustomer, phone: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                      placeholder="08123xxx"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-gray-700">Email (Opsional)</label>
                    <input
                      type="email"
                      value={currentCustomer.email || ''}
                      onChange={(e) => setCurrentCustomer({...currentCustomer, email: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                      placeholder="email@example.com"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-gray-700">Alamat (Opsional)</label>
                  <textarea
                    rows={3}
                    value={currentCustomer.address || ''}
                    onChange={(e) => setCurrentCustomer({...currentCustomer, address: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none"
                    placeholder="Alamat lengkap jalan, kelurahan..."
                  />
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold rounded-xl transition-colors shadow-sm"
                >
                  {isSaving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  {modalMode === 'CREATE' ? 'Simpan Data' : 'Perbarui'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
