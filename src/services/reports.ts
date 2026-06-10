import { supabase } from "./db";
import { IDebt } from "../types/finance";

export interface ProfitLossData {
  revenue: number;
  cogs: number;
  grossProfit: number;
  operationalExpenses: number;
  netProfit: number;
}

export interface LiquidityData {
  cash: number;
  bank: number;
  inventoryValue: number;
  totalCurrentAssets: number;
}

export const ReportsService = {
  async getProfitLoss(): Promise<ProfitLossData> {
    const startOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1,
    ).toISOString();

    // 1. Total Pendapatan (dari transaksi selesai bulan ini)
    const { data: incomeData } = await supabase
      .from("transactions")
      .select("total_amount, id")
      .eq("status", "COMPLETED")
      .gte("created_at", startOfMonth);

    const revenue =
      incomeData?.reduce(
        (sum, item) => sum + (Number(item.total_amount) || 0),
        0,
      ) || 0;

    // 2. HPP (Cost of Goods Sold)
    // Untuk ini kita butuh transaction_items yang terkait dengan transaksi di bulan ini
    // Agar lebih mudah, kita bisa ambil total quantity * products.cost_price untuk tiap item
    // Tapi karena Supabase tidak bisa join aggregate dengan mudah, kita fetch item:
    let cogs = 0;
    if (incomeData && incomeData.length > 0) {
      const transactionIds = incomeData.map((t) => t.id);
      const { data: itemsData } = await supabase
        .from("transaction_items")
        .select(`
          quantity,
          products ( price )
        `)
        .in("transaction_id", transactionIds);

      if (itemsData) {
        cogs = itemsData.reduce((sum, item: any) => {
          const price = item.products?.price || 0;
          return sum + item.quantity * (price * 0.7);
        }, 0);
      }
    }

    // 3. Pengeluaran Operasional
    const { data: expenseData } = await supabase
      .from("operational_expenses")
      .select("amount")
      .gte("date", startOfMonth.split("T")[0]); // YYYY-MM-DD

    const operationalExpenses =
      expenseData?.reduce((sum, item) => sum + (Number(item.amount) || 0), 0) ||
      0;

    const grossProfit = revenue - cogs;
    const netProfit = grossProfit - operationalExpenses;

    return {
      revenue,
      cogs,
      grossProfit,
      operationalExpenses,
      netProfit,
    };
  },

  async getLiquidity(): Promise<LiquidityData> {
    // 1. Hitung langsung dari transaksi nyata (tidak menggunakan mock financial_accounts)
    let cash = 0;
    let bank = 0;

    // Fetch transactions
    const { data: transData } = await supabase
      .from("transactions")
      .select("total_amount, payment_method")
      .eq("status", "COMPLETED");

    if (transData) {
      transData.forEach((t) => {
        const amount = Number(t.total_amount) || 0;
        if (t.payment_method === "CASH") {
          cash += amount;
        } else {
          bank += amount; // DEBIT, QRIS, TRANSFER
        }
      });
    }

    // Try to fetch operational expenses safely (table may not exist)
    const { data: expenseData, error: expenseError } = await supabase
      .from("operational_expenses")
      .select("amount");

    const operationalExpenses = !expenseError && expenseData
      ? expenseData.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
      : 0;

    // Asumsi pengeluaran dibayar dari Kas Tunai
    cash -= operationalExpenses;

    // 2. Nilai Stok (inventoryValue = stock * price)
    // There is no cost_price in the schema, using selling price
    const { data: products } = await supabase
      .from("products")
      .select("stock, price");

    let inventoryValue = 0;
    if (products) {
      inventoryValue = products.reduce(
        (sum, p) => sum + (Number(p.stock) || 0) * (Number(p.price) || 0),
        0,
      );
    }

    return {
      cash,
      bank,
      inventoryValue,
      totalCurrentAssets: cash + bank + inventoryValue,
    };
  },

  async getDebts(): Promise<IDebt[]> {
    const { data, error } = await supabase
      .from("debts")
      .select("*");

    if (error) {
      console.error("Error fetching debts:", error);
      return [];
    }

    if (!data) return [];

    // Map and normalize records to match IDebt interface
    const normalizedDebts: IDebt[] = data.map((d: any) => ({
      id: d.id,
      tipe_transaksi: d.tipe_transaksi || (d.type === "PAYABLE" ? "hutang" : "piutang"),
      jumlah: d.jumlah || d.amount,
      keterangan: d.keterangan || d.entity,
      jatuh_tempo: d.jatuh_tempo || d.due_date,
      status: d.status === "UNPAID" ? "belum_lunas" : d.status === "PAID" ? "lunas" : d.status,
      created_at: d.created_at,
      updated_at: d.updated_at
    }));

    // Sort manually to avoid postgREST column sorting issues
    return normalizedDebts.sort((a, b) => new Date(a.jatuh_tempo).getTime() - new Date(b.jatuh_tempo).getTime());
  },
};
