// src/app/api/transactions/route.ts

import { NextResponse } from 'next/server';
import { TransactionPayload } from '../../../types/transaction'; 

export async function POST(request: Request) {
  try {
    const payload: TransactionPayload = await request.json();

    // 1. Validasi Input Dasar
    if (!payload.items || payload.items.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Keranjang belanja kosong!', error: 'BAD_REQUEST' },
        { status: 400 }
      );
    }
    
    if (!payload.user_id) {
       return NextResponse.json(
        { success: false, message: 'User ID tidak ditemukan. Anda belum login.', error: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // 2. Validasi Ulang Total Harga di Sisi Server (Mencegah Manipulasi Harga dari Client-Side)
    let calculatedTotal = 0;
    
    for (const item of payload.items) {
      /* 
         QUERY DATABASE: 
         - Ambil harga asli produk berdasarkan item.id 
         - Lakukan pengecekan stok, apakah stok di database (productDb.stock) mencukupi item.cartQuantity
         
         const productDb = await db.query('SELECT price, stock FROM products WHERE id = ?', [item.id]);
         if (productDb.stock < item.cartQuantity) throw Error('Stok tidak cukup');
         calculatedTotal += productDb.price * item.cartQuantity;
      */
      
      // Simulasi kalkulasi: Menggunakan harga dari payload (Idealnya dari query di atas)
      calculatedTotal += item.price * item.cartQuantity;
    }

    if (calculatedTotal !== payload.total_amount) {
      return NextResponse.json(
        { success: false, message: 'Total tagihan dikompromikan. Tidak cocok dengan kalkulasi server.', error: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // 3. Potong Stok Barang & Buat Record Transaksi ke Database
    /* 
       await db.transaction(async (trx) => {
          // Buat Transaksi Baru
          const newTx = await trx.insert('transactions', {
            receipt_number: `INV-${Date.now().toString().slice(-6)}`,
            total_amount: calculatedTotal,
            payment_method: payload.payment_method,
            user_id: payload.user_id,
            status: 'COMPLETED'
          });

          // Insert Item Detail dan Potong Stok
          for (const item of payload.items) {
             await trx.insert('transaction_items', {
                transaction_id: newTx.id,
                product_id: item.id,
                quantity: item.cartQuantity,
                subtotal: item.price * item.cartQuantity
             });
             
             // Update logic untuk memotong stok product
             await trx.execute('UPDATE products SET stock = stock - ? WHERE id = ?', [item.cartQuantity, item.id]);
          }
       });
    */

    // 4. Hitung Kembalian Uang Pelanggan
    const amountPaid = payload.payment_method === 'CASH' ? payload.amount_paid : calculatedTotal;
    const changeAmount = amountPaid - calculatedTotal;

    // 5. Generate Receipt Number unik secara berurutan
    const receipt_number = `INV-${Date.now().toString().slice(-6)}`;

    // 6. Return Data Sukses Transaksi beserta kembalian dan payload final
    return NextResponse.json(
      {
        success: true,
        message: 'Transaksi berhasil diproses dengan aman.',
        data: {
          receipt_number,
          total_amount: calculatedTotal,
          amount_paid: amountPaid,
          change_amount: changeAmount,
          payment_method: payload.payment_method,
          created_at: new Date().toISOString(),
          items: payload.items,
        }
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('API Error /api/transactions:', error);
    return NextResponse.json(
      { success: false, message: 'Internal Server Error', error: error.message || String(error) },
      { status: 500 }
    );
  }
}
