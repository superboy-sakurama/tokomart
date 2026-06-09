// src/types/transaction.ts

import { PaymentMethod } from '../types';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  stock: number;
  cartQuantity: number;
}

export interface TransactionPayload {
  items: CartItem[];
  total_amount: number;
  amount_paid: number;
  payment_method: PaymentMethod;
  user_id: string;
}

export interface TransactionResponse {
  success: boolean;
  message: string;
  data?: {
    receipt_number: string;
    total_amount: number;
    amount_paid: number;
    change_amount: number;
    payment_method: string;
    created_at: string;
    items: CartItem[];
  };
  error?: string;
}
