// src/services/pos.ts
import { TransactionPayload, TransactionResponse } from '../types/transaction';
import { TransactionService } from './db';

export const POSService = {
  async processTransaction(payload: TransactionPayload): Promise<TransactionResponse> {
    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      // Parse JSON
      let data: any;
      try {
        data = await response.json();
      } catch (parseErr) {
        // Fallback untuk environment Vite/Dev yang belum memiliki rute API Next.js terkonfigurasi.
        if (!response.ok && response.status === 404) {
           console.warn("Backend route not found. Executing fallback local transaction simulation.");
           return await this.fallbackTransaction(payload);
        }
        throw new Error('Gagal memproses respons dari server');
      }

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Terjadi kesalahan saat memproses transaksi.');
      }

      return data as TransactionResponse;
    } catch (error: any) {
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
         console.warn("Backend not reachable. Executing fallback local transaction simulation.");
         return await this.fallbackTransaction(payload);
      }
      return {
        success: false,
        message: 'Gagal memproses transaksi.',
        error: error.message || String(error),
      };
    }
  },

  // Fallback Service Support for Vite Preview Mode (since Next.js API won't run directly in Vite)
  async fallbackTransaction(payload: TransactionPayload): Promise<TransactionResponse> {
     try {
        const receiptNumber = `INV-${Date.now().toString().slice(-6)}`;
        const amountPaid = payload.payment_method === 'CASH' ? payload.amount_paid : payload.total_amount;
        const changeAmount = amountPaid - payload.total_amount;
  
        const transactionItems = payload.items.map(item => ({
          product_id: item.id,
          quantity: item.cartQuantity,
          price_at_time: item.price,
          subtotal: item.price * item.cartQuantity
        }));
  
        await TransactionService.checkout({
          receipt_number: receiptNumber,
          total_amount: payload.total_amount,
          payment_method: payload.payment_method,
          customer_id: null,
          user_id: payload.user_id,
          status: 'COMPLETED'
        }, transactionItems);

        return {
          success: true,
          message: 'Transaksi berhasil disimulasikan secara lokal.',
          data: {
             receipt_number: receiptNumber,
             total_amount: payload.total_amount,
             amount_paid: amountPaid,
             change_amount: changeAmount,
             payment_method: payload.payment_method,
             created_at: new Date().toISOString(),
             items: payload.items
          }
        };
     } catch (e: any) {
        return { success: false, message: 'Gagal fallback transaksi lokal', error: e.message };
     }
  }
};
