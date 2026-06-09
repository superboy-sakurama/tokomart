// src/lib/supabase/admin.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || "https://placeholder.supabase.co";
// Penting: Gunakan SERVICE_ROLE_KEY di server-side untuk membuat akun tanpa mengganggu sesi admin yang sedang aktif.
// Untuk Vite, variabel environment ini bernama VITE_SUPABASE_SERVICE_ROLE_KEY.
const supabaseServiceKey =
  import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || "placeholder-service-key";

if (
  !supabaseUrl ||
  !supabaseServiceKey ||
  supabaseUrl === "https://placeholder.supabase.co"
) {
  console.warn(
    "Variabel environment untuk Supabase Admin belum diatur dengan benar.",
  );
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
