"use server";

import { supabase } from "../../services/db";

/**
 * Representasi Output Balikan (Response) dari Server Action
 */
export interface ActionResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
}

/**
 * Server Action: signUpUser
 * Menjalankan proses pendaftaran pengguna di backend menggunakan @supabase/ssr.
 * Penting: Fungsi ini mengirimkan `options.data` yang berisi metadata (nama, role)
 * agar SQL Trigger dapat menangkapnya dan memasukkan ke dalam tabel public.profiles.
 */
export async function signUpUser(formData: FormData): Promise<ActionResponse> {
  try {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const name = formData.get("name") as string;

    if (!email || !password) {
      return { success: false, error: "Email dan password wajib diisi." };
    }

    // Jalankan Autentikasi dengan Supabase dengan menyisipkan Metadata
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || email.split("@")[0], // Mencegah payload kosong (Null-Safety)
          role: "CASHIER", // Atribut bawaan default
        },
      },
    });

    if (error) {
      console.error("[auth-action: signUp] Supabase Error:", error);
      return {
        success: false,
        error: `Gagal mendaftar: ${error.message}`,
      };
    }

    return {
      success: true,
      message:
        "Pendaftaran berhasil. Silakan cek email masuk untuk verifikasi (jika diaktifkan).",
      data: data.user,
    };
  } catch (err: any) {
    console.error("[auth-action: signUp] Internal Server Error:", err);
    return {
      success: false,
      error: err.message || "Terjadi kesalahan sistem internal di Server Edge.",
    };
  }
}
