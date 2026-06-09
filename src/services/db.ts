import { createClient } from '@supabase/supabase-js';
import { Product, Customer, Transaction, TransactionItem } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const handleDbError = (error: any, context: string) => {
  console.error(`[DB Error - ${context}]:`, error);
  throw new Error(`Gagal ${context}: ${error?.message || 'Terjadi kesalahan sistem'}`);
};

export const ProductService = {
  async getAll(): Promise<Product[]> {
    const { data, error } = await supabase.from('products').select('*').order('name');
    if (error) {
       console.warn('Gagal mengambil daftar produk (tabel mungkin belum dibuat):', error.message);
       return [];
    }
    return data as Product[];
  },
  
  async getById(id: string): Promise<Product> {
    const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
    if (error) return handleDbError(error, 'mengambil detail produk');
    return data as Product;
  },

  async create(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> {
    const { data, error } = await supabase.from('products').insert([product]).select().single();
    if (error) return handleDbError(error, 'menambahkan produk baru');
    return data as Product;
  },

  async update(id: string, updates: Partial<Product>): Promise<Product> {
    const { data, error } = await supabase.from('products').update(updates).eq('id', id).select().single();
    if (error) return handleDbError(error, 'memperbarui produk');
    return data as Product;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) return handleDbError(error, 'menghapus produk');
  }
};

/**
 * SERVICE PELANGGAN
 */
export const CustomerService = {
  async getAll(): Promise<Customer[]> {
    const { data, error } = await supabase.from('customers').select('*').order('name');
    if (error) return handleDbError(error, 'mengambil pelanggan');
    return data as Customer[];
  }
};

/**
 * SERVICE TRANSAKSI (POS Kasir)
 */
export const TransactionService = {
  async checkout(
    transaction: Omit<Transaction, 'id' | 'created_at'>,
    items: Omit<TransactionItem, 'id' | 'transaction_id'>[]
  ): Promise<Transaction> {
    // 1. Validasi keberadaan user_id di profil (untuk mencegah FK error)
    let sanitizedUserId: string | null = transaction.user_id || null;
    
    if (sanitizedUserId) {
      const { data: profileExists } = await supabase.from('profiles').select('id').eq('id', sanitizedUserId).single();
      if (!profileExists) {
        console.warn('Profile tidak ditemukan di tabel profiles, mengabaikan constraint user_id (diset null) pada transaksi.');
        sanitizedUserId = null;
      }
    }

    const payload = { ...transaction, user_id: sanitizedUserId };

    // 2. Buat Induk Transaksi
    const { data: trx, error: trxErr } = await supabase.from('transactions').insert([payload]).select().single();
    if (trxErr) return handleDbError(trxErr, 'membuat transaksi induk');

    // 2. Format Items untuk memiliki ID transaksi
    const itemsWithTrxId = items.map(item => ({
      ...item,
      transaction_id: trx.id
    }));

    // 3. Insert Items
    const { error: itemsErr } = await supabase.from('transaction_items').insert(itemsWithTrxId);
    if (itemsErr) {
      // Manual rollback jika gagal
      await supabase.from('transactions').delete().eq('id', trx.id);
      return handleDbError(itemsErr, 'menyimpan detail barang transaksi');
    }

    // 4. Kurangi Stok Produk (Idealnya menggunakan DB Trigger/Function, tapi kita update manual untuk client-only scenario ini)
    for (const item of items) {
       const { data: prod } = await supabase.from('products').select('stock').eq('id', item.product_id).single();
       if (prod) {
           await supabase.from('products').update({ stock: prod.stock - item.quantity }).eq('id', item.product_id);
       }
    }

    return trx as Transaction;
  }
};
