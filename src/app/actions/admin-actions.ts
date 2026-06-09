// src/app/actions/admin-actions.ts
"use server";

import { supabaseAdmin } from "../../lib/supabase/admin";
import { supabase } from "../../services/db";

interface ServerResponse<T = any> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
}

/**
 * 1. Membuat akun user (staf baru) dari Admin Dashboard
 */
export async function createNewUser(
  formData: FormData,
): Promise<ServerResponse> {
  try {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const name = formData.get("name") as string;
    const role = (formData.get("role") as string) || "CASHIER";

    if (!email || !password || !name) {
      return {
        success: false,
        error: "Semua field wajib diisi (email, password, nama).",
      };
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        role,
      },
    });

    if (error) {
      console.error("[Admin API] Error creating user:", error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      message: "Akun staf berhasil dibuat.",
      data: data.user,
    };
  } catch (error: any) {
    console.error("Server action createNewUser error: ", error);
    return {
      success: false,
      error: error.message || "Terjadi kesalahan sistem",
    };
  }
}

/**
 * 2. Menambahkan hutang/piutang baru
 */
export async function addDebt(formData: FormData): Promise<ServerResponse> {
  try {
    const tipe_transaksi = formData.get("tipe_transaksi") as string;
    const jumlah = Number(formData.get("jumlah"));
    const keterangan = formData.get("keterangan") as string;
    const jatuh_tempo = formData.get("jatuh_tempo") as string;

    if (!tipe_transaksi || !jumlah || !jatuh_tempo) {
      return {
        success: false,
        error: "Tipe transaksi, jumlah, dan jatuh tempo wajib diisi.",
      };
    }

    const { data, error } = await supabase
      .from("debts")
      .insert([
        {
          tipe_transaksi,
          jumlah,
          keterangan,
          jatuh_tempo,
          status: "belum_lunas",
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("[Debt API] Error adding debt:", error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      message: "Data hutang/piutang berhasil ditambahkan",
      data,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Terjadi kesalahan sistem",
    };
  }
}

/**
 * 3. Mengubah status hutang/piutang
 */
export async function updateDebtStatus(
  id: string,
  status: string,
): Promise<ServerResponse> {
  try {
    if (!id || !status) {
      return { success: false, error: "ID dan status tidak valid." };
    }

    const { data, error } = await supabase
      .from("debts")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[Debt API] Error updating debt status:", error);
      return { success: false, error: error.message };
    }

    return { success: true, message: "Status berhasil diperbarui.", data };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Terjadi kesalahan sistem",
    };
  }
}
