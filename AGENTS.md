# Project Conventions & Architecture

## Tech Stack
- Frontend: React (Vite environment)
- Styling: Tailwind CSS
- Database: Supabase / Local Storage (Demo Mode)

## Directory Structure Guidelines
Berdasarkan panduan *Clean Architecture*, seluruh implementasi baru harus mengikuti pola struktur berikut:

- `src/types/`: Deklarasi TypeScript (Interfaces seperti `product.ts`, `user.ts`, `transaction.ts`).
- `src/components/ui/`: Komponen UI modular dan *reusable* (Button, Input, Table, Modal).
- `src/components/layout/`: Komponen struktural (Sidebar, Header, AppLayout).
- `src/components/features/`: Komponen spesifik yang memiliki *business logic* fitur tertentu (Cart, InvoiceForm).
- `src/lib/`: Utilitas dasar dan inisialisasi eksternal (`utils.ts`, konfigurasi awal DB).
- `src/services/`: Logika pengambilan data / *Fetchers* spesifik domain (`inventory.ts`, `pos.ts`, `reports.ts`, `auth.ts`).
- `src/hooks/`: Kumpulan *Custom React Hooks* (`useCart.ts`, `useAuth.ts`).

## Tipe & Standar Penulisan
- Gunakan strict typing TypeScript, hindari `any` sedapat mungkin.
- Tulis kode yang *clean*, tidak terpotong, dan fungsional.
