import { useState, useMemo, useEffect } from 'react';
import { Search, ShoppingCart, Trash2, Plus, Minus, CreditCard, Receipt, Package } from 'lucide-react';
import { ProductService, TransactionService } from '../services/db';
import { Product, TransactionItem, PaymentMethod } from '../types';
import { useAuth } from '../context/AuthContext';
import { ReceiptInvoice } from '../components/pos/ReceiptInvoice';
import { PaymentModal } from '../components/features/pos/PaymentModal';

interface CartItem extends Product {
  cartQuantity: number;
}

export function POS() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<any>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await ProductService.getAll();
      setProducts(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.stock > 0 && 
    (p.name.toLowerCase().includes(search.toLowerCase()) || 
     p.sku.toLowerCase().includes(search.toLowerCase()))
  );

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.cartQuantity >= product.stock) return prev; // Cek stok
        return prev.map(item => 
          item.id === product.id ? { ...item, cartQuantity: item.cartQuantity + 1 } : item
        );
      }
      return [...prev, { ...product, cartQuantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.cartQuantity + delta;
        if (newQty > 0 && newQty <= item.stock) {
          return { ...item, cartQuantity: newQty };
        }
      }
      return item;
    }).filter(item => item.cartQuantity > 0));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const totalAmount = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.price * item.cartQuantity), 0);
  }, [cart]);

  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const handleCheckoutClick = () => {
    if (cart.length === 0 || !user) return;
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = (transactionData: any) => {
    setLastTransaction({ ...transactionData });
    setShowReceipt(true);
    setCart([]);
    loadProducts(); // Memperbarui stok sesudah checkout berhasil
  };

  if (showReceipt && lastTransaction) {
     return <ReceiptInvoice transaction={lastTransaction} onBack={() => setShowReceipt(false)} />;
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6 animate-in fade-in duration-500">
      {/* Product List Section */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              placeholder="Cari nama atau referensi produk..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm bg-white transition-all outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
             <div className="flex justify-center p-12">
               <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
             </div>
          ) : filteredProducts.length === 0 ? (
             <div className="text-center p-12 text-gray-400">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Tidak ada produk tersedia</p>
             </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map(product => (
                <div 
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="border border-gray-100 rounded-xl p-4 cursor-pointer hover:border-blue-500 hover:shadow-md transition-all group flex flex-col justify-between min-h-[8rem]"
                >
                  <div>
                    <h3 className="font-bold text-gray-900 line-clamp-2 leading-tight">{product.name}</h3>
                    <p className="text-xs text-gray-500 font-mono mt-1">{product.sku}</p>
                  </div>
                  <div className="mt-4 flex items-end justify-between">
                    <p className="text-sm font-bold text-blue-600">
                      Rp {product.price.toLocaleString('id-ID')}
                    </p>
                    <p className="text-xs font-semibold text-gray-400">Stok: {product.stock}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cart Section */}
      <div className="w-[380px] bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden shrink-0">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-blue-600 text-white">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Keranjang
          </h2>
          <span className="bg-white/20 text-white text-xs font-bold px-2 py-1 rounded-lg">
            {cart.length} Item
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-3">
              <ShoppingCart className="w-12 h-12 opacity-20" />
              <p className="text-sm">Keranjang masih kosong</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm flex gap-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm text-gray-900 leading-tight">{item.name}</h4>
                  <p className="text-blue-600 font-bold text-sm mt-1">Rp {(item.price * item.cartQuantity).toLocaleString('id-ID')}</p>
                </div>
                
                <div className="flex flex-col items-end justify-between">
                  <button onClick={() => removeFromCart(item.id)} className="text-gray-300 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg p-1">
                    <button onClick={() => updateQuantity(item.id, -1)} className="p-1 text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded-md">
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-bold w-4 text-center">{item.cartQuantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="p-1 text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded-md">
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-5 border-t border-gray-100 bg-white">
          <div className="space-y-3 mb-5">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Subtotal</span>
              <span className="font-medium text-gray-900">Rp {totalAmount.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>Pajak (0%)</span>
              <span className="font-medium text-gray-900">Rp 0</span>
            </div>
            
            <div className="pt-3 flex justify-between items-end border-t border-dashed border-gray-200">
              <span className="font-semibold text-gray-700">Total</span>
              <span className="font-bold text-2xl text-gray-900">Rp {totalAmount.toLocaleString('id-ID')}</span>
            </div>
          </div>

          <div className="space-y-3">
            <button 
              onClick={handleCheckoutClick}
              disabled={cart.length === 0}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold rounded-xl shadow-md transition-colors flex justify-center items-center gap-2"
            >
              Proses Pembayaran
            </button>
          </div>
        </div>
      </div>
      
      {/* Modal Pembayaran */}
      {user && (
        <PaymentModal
           isOpen={showPaymentModal}
           onClose={() => setShowPaymentModal(false)}
           onSuccess={handlePaymentSuccess}
           cartItems={cart.map(item => ({...item, cartQuantity: item.cartQuantity}))}
           totalAmount={totalAmount}
           userId={user.id}
        />
      )}
    </div>
  );
}
