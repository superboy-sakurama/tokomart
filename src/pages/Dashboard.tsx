import { useState, useEffect } from "react";
import {
  Package,
  TrendingUp,
  Users,
  DollarSign,
  DatabaseZap,
  Loader2,
} from "lucide-react";
import { DashboardService, DashboardStats } from "../services/dashboard";

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      setLoading(true);
      try {
        const data = await DashboardService.getStats();
        setStats(data);
      } catch (error) {
        console.error("Failed to load dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Dashboard Keuangan & Laporan
        </h1>
        <p className="text-gray-500 mt-1">
          Ringkasan aktivitas transaksi hari ini dari Database.
        </p>
      </div>

      {/* Statistik Utama */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
          <p className="text-gray-500 font-medium">Memuat data hari ini...</p>
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Pendapatan Hari Ini"
            value={`Rp ${stats.todayRevenue.toLocaleString("id-ID")}`}
            icon={DollarSign}
            trend={stats.revenueTrend}
          />
          <StatCard
            title="Total Transaksi"
            value={stats.totalTransactions.toString()}
            icon={TrendingUp}
            trend={stats.transactionsTrend}
          />
          <StatCard
            title="Produk Terjual"
            value={stats.productsSold.toString()}
            icon={Package}
            trend={stats.productsTrend}
          />
          <StatCard
            title="Pelanggan Baru (Bulan Ini)"
            value={stats.newCustomers.toString()}
            icon={Users}
            trend={stats.customersTrend}
          />
        </div>
      ) : (
        <div className="p-6 bg-red-50 text-red-600 rounded-xl border border-red-100 text-center font-medium">
          Gagal mengambil data dashboard.
        </div>
      )}

      {/* Info Setup Berhasil */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center mt-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />

        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 mb-5 shadow-inner">
          <DatabaseZap className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Supabase Service Initialized
        </h2>
        <p className="text-gray-500 max-w-lg mx-auto mb-6 text-sm leading-relaxed">
          Koneksi ke backend Supabase telah disiapkan beserta tipe datanya.
          Sistem siap untuk mengimplementasikan interaksi database aktual (POS &
          Inventory).
        </p>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  trend: string;
  negative?: boolean;
}

function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  negative = false,
}: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-500 text-sm tracking-tight">
          {title}
        </h3>
        <div className="p-2.5 bg-gray-50 rounded-xl">
          <Icon className="w-5 h-5 text-gray-600" />
        </div>
      </div>
      <div className="flex items-baseline gap-3">
        <span className="text-2xl font-bold text-gray-900">{value}</span>
        <span
          className={`text-xs font-bold px-2 py-1 rounded-md ${
            negative
              ? "text-red-700 bg-red-50 border border-red-100"
              : "text-green-700 bg-green-50 border border-green-100"
          }`}
        >
          {trend}
        </span>
      </div>
    </div>
  );
}
