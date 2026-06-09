import { supabase } from './db';
import { Customer } from '../types';

/**
 * SERVICE PELANGGAN
 * Bertanggung jawab mengambil dan mengelola entitas pelanggan
 */
export const CustomerService = {
  async getAll(): Promise<Customer[]> {
    const { data, error } = await supabase.from('customers').select('*').order('name');
    if (error) {
       console.warn('Gagal mengambil daftar pelanggan (tabel mungkin belum dibuat):', error.message);
       // Menghindari crash UI jika tabel belum dibuat di Supabase
       return [];
    }
    return data as Customer[];
  },

  async create(customer: Omit<Customer, 'id' | 'created_at'>): Promise<Customer> {
    const { data, error } = await supabase.from('customers').insert([customer]).select().single();
    if (error) throw new Error(`Gagal menambah data pelanggan: ${error.message}`);
    return data as Customer;
  },

  async update(id: string, updates: Partial<Omit<Customer, 'id' | 'created_at'>>): Promise<Customer> {
    const { data, error } = await supabase.from('customers').update(updates).eq('id', id).select().single();
    if (error) throw new Error(`Gagal mengubah data pelanggan: ${error.message}`);
    return data as Customer;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (error) throw new Error(`Gagal menghapus data pelanggan: ${error.message}`);
  }
};
