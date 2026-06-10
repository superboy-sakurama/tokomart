import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Search, Loader2, ArrowLeft, Download, Printer } from 'lucide-react';
import { supabase } from '../services/db';
import { ReceiptInvoice } from '../components/pos/ReceiptInvoice';

export function TransactionHistory() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          customers(name),
          profiles(name)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTransaction = async (trx: any) => {
    try {
      // Fetch details
      const { data, error } = await supabase
        .from('transaction_items')
        .select(`
          quantity, price_at_time, subtotal,
          products(name)
        `)
        .eq('transaction_id', trx.id);

      if (error) throw error;

      setSelectedTransaction({
        ...trx,
        items: data?.map((item: any) => ({
          ...item,
          product_name: item.products?.name || (Array.isArray(item.products) ? item.products[0]?.name : undefined),
          price: item.price_at_time // for receipt invoice prop mapping
        })) || []
      });
    } catch (error) {
       console.error('Error fetching transaction items:', error);
    }
  };

  const filteredTransactions = transactions.filter(t => 
    (t.receipt_number && t.receipt_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (t.customers?.name && t.customers.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (t.profiles?.name && t.profiles.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (selectedTransaction) {
    return (
      <div className="max-w-3xl mx-auto pt-6 animate-in fade-in duration-300">
         <button 
           onClick={() => setSelectedTransaction(null)}
           className="mb-4 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
         >
           <ArrowLeft className="w-4 h-4" /> Kembali
         </button>
         <ReceiptInvoice 
           transaction={selectedTransaction} 
           onBack={() => setSelectedTransaction(null)} 
           showSuccessHeader={false}
         />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Riwayat Transaksi</h1>
        <p className="text-gray-500 mt-1 text-sm">Lihat aktivitas transaksi yang telah selesai.</p>
      </div>

      <div className="bg-white border text-sm border-gray-100 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <div className="relative max-w-sm w-full">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Cari no. struk atau pelanggan..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider font-semibold">
                <th className="p-4 pl-6 font-medium">Tanggal</th>
                <th className="p-4 font-medium">No. Struk</th>
                <th className="p-4 font-medium">Pelanggan</th>
                <th className="p-4 font-medium text-right">Total Nominal</th>
                <th className="p-4 font-medium text-center">Metode</th>
                <th className="p-4 pr-6 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400 gap-3">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                      <p>Memuat riwayat transaksi...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="h-64 text-center text-gray-500">
                    Tidak ada transaksi ditemukan.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((trx) => (
                  <tr key={trx.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="p-4 pl-6 text-gray-500 whitespace-nowrap">
                      {format(new Date(trx.created_at), 'dd MMM yyyy, HH:mm', { locale: id })}
                    </td>
                    <td className="p-4 font-semibold text-gray-900">
                      {trx.receipt_number}
                    </td>
                    <td className="p-4 text-gray-600">
                      {trx.customers?.name || '-'}
                    </td>
                    <td className="p-4 pr-6 text-right font-bold text-gray-900">
                      Rp {Number(trx.total_amount).toLocaleString('id-ID')}
                    </td>
                    <td className="p-4 text-center">
                      <span className="inline-flex px-2 py-1 bg-green-50 text-green-700 rounded-md text-xs font-bold leading-none border border-green-100">
                        {trx.payment_method}
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-right">
                       <button
                         onClick={() => handleSelectTransaction(trx)}
                         className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                       >
                         Lihat Struk
                       </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
