// src/components/features/pos/PaymentModal.tsx
import { useState, useEffect } from 'react';
import { CreditCard, Receipt, X, CheckCircle, AlertCircle } from 'lucide-react';
import { CartItem, TransactionPayload } from '../../../types/transaction';
import { POSService } from '../../../services/pos';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (transactionData: any) => void;
  cartItems: CartItem[];
  totalAmount: number;
  userId: string;
}

export function PaymentModal({ isOpen, onClose, onSuccess, cartItems, totalAmount, userId }: PaymentModalProps) {
  const [amountPaidStr, setAmountPaidStr] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'DEBIT'>('CASH');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Reset state ketika modal dibuka
  useEffect(() => {
    if (isOpen) {
      setAmountPaidStr('');
      setPaymentMethod('CASH');
      setErrorMsg('');
      setIsLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const numAmountPaid = parseInt(amountPaidStr.replace(/\D/g, '') || '0', 10);
  const changeAmount = numAmountPaid - totalAmount;
  const isSufficientAmount = paymentMethod !== 'CASH' || numAmountPaid >= totalAmount;

  const handleProcessPayment = async () => {
    if (!isSufficientAmount) {
      setErrorMsg('Jumlah uang bayar tidak mencukupi jumlah tagihan.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    const payload: TransactionPayload = {
      items: cartItems,
      total_amount: totalAmount,
      amount_paid: paymentMethod === 'CASH' ? numAmountPaid : totalAmount,
      payment_method: paymentMethod,
      user_id: userId,
    };

    const response = await POSService.processTransaction(payload);
    setIsLoading(false);

    if (response.success && response.data) {
      onSuccess(response.data);
      onClose();
    } else {
      setErrorMsg(response.error || response.message || 'Terjadi kesalahan sistem dari sisi server.');
    }
  };

  const handleQuickAmount = (amount: number) => {
    setAmountPaidStr(amount.toString());
  };

  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header Modal */}
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-xl font-bold text-gray-900">Pembayaran Kasir</h2>
          <button onClick={onClose} disabled={isLoading} className="text-gray-400 hover:text-gray-900 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Konten Modal */}
        <div className="p-6 space-y-6">
          {/* Ringkasan Total */}
          <div className="text-center p-4 bg-blue-50 border border-blue-100 rounded-xl">
            <p className="text-sm font-semibold text-blue-600 mb-1">Total Tagihan Belanja</p>
            <p className="text-3xl font-bold text-gray-900">Rp {totalAmount.toLocaleString('id-ID')}</p>
          </div>

          <div className="space-y-3">
             <label className="block text-sm font-semibold text-gray-700">Metode Pembayaran Pelanggan</label>
             <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setPaymentMethod('CASH')}
                  className={`py-3 text-sm font-bold rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${paymentMethod === 'CASH' ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300'}`}
                >
                  <Receipt className="w-6 h-6" /> Uang Tunai
                </button>
                <button 
                  onClick={() => setPaymentMethod('DEBIT')}
                  className={`py-3 text-sm font-bold rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${paymentMethod === 'DEBIT' ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300'}`}
                >
                  <CreditCard className="w-6 h-6" /> Kartu Debit / Kredit
                </button>
             </div>
          </div>

          {/* Form Input Uang Muka Jika Cash */}
          {paymentMethod === 'CASH' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-gray-700">Jumlah Uang Diterima dari Pelanggan</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">Rp</span>
                  <input
                    type="text"
                    value={numAmountPaid > 0 ? numAmountPaid.toLocaleString('id-ID') : ''}
                    onChange={(e) => {
                       const digits = e.target.value.replace(/\D/g, '');
                       setAmountPaidStr(digits);
                    }}
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-bold text-lg text-gray-900"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Quick Amount Suggestion Buttons */}
              <div className="grid grid-cols-3 gap-2">
                 <button onClick={() => handleQuickAmount(totalAmount)} className="py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-sm font-bold text-gray-700 transition-colors">Uang Pas</button>
                 <button onClick={() => handleQuickAmount(50000)} className="py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-sm font-bold text-gray-700 transition-colors">50.000</button>
                 <button onClick={() => handleQuickAmount(100000)} className="py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-sm font-bold text-gray-700 transition-colors">100.000</button>
              </div>

              {/* Tampilan Kalkulasi Kembalian */}
              {numAmountPaid > 0 && (
                <div className={`p-4 rounded-xl border ${changeAmount >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <div className="flex justify-between items-center">
                    <span className={`font-semibold ${changeAmount >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      {changeAmount >= 0 ? 'Kembalian Pelanggan :' : 'Kurang Nominal :'}
                    </span>
                    <span className={`text-xl font-bold ${changeAmount >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      Rp {Math.abs(changeAmount).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error Message Handler */}
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 text-sm font-medium">
              <AlertCircle className="w-5 h-5 shrink-0" /> {errorMsg}
            </div>
          )}
        </div>

        {/* Footer / Tombol Aksi */}
        <div className="p-6 border-t border-gray-100 bg-white">
          <button
            onClick={handleProcessPayment}
            disabled={isLoading || !isSufficientAmount}
            className="w-full relative py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-md transition-colors flex justify-center items-center gap-2 overflow-hidden"
          >
            {isLoading ? (
               <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
               <>
                 <CheckCircle className="w-5 h-5" /> 
                 Konfirmasi & Selesaikan Transaksi
               </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
