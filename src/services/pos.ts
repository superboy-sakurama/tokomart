// src/services/pos.ts
import { TransactionPayload, TransactionResponse } from '../types/transaction';
import { TransactionService } from './db';

export const POSService = {
  async processTransaction(payload: TransactionPayload): Promise<TransactionResponse> {
    return await this.fallbackTransaction(payload);
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
