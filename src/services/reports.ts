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
        .select(
          `
          quantity,
          products ( cost_price )
        `,
        )
        .in("transaction_id", transactionIds);

      if (itemsData) {
        cogs = itemsData.reduce((sum, item: any) => {
          const cost = item.products?.cost_price || 0;
          return sum + item.quantity * cost;
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
    // 1. Kas dan Bank
    const { data: accounts } = await supabase
      .from("financial_accounts")
      .select("type, balance");

    let cash = 0;
    let bank = 0;

    if (accounts) {
      accounts.forEach((acc) => {
        if (acc.type === "CASH") cash += Number(acc.balance);
        if (acc.type === "BANK") bank += Number(acc.balance);
      });
    }

    // 2. Nilai Stok (inventoryValue = stock * cost_price)
    const { data: products } = await supabase
      .from("products")
      .select("stock, cost_price");

    let inventoryValue = 0;
    if (products) {
      inventoryValue = products.reduce(
        (sum, p) => sum + p.stock * (p.cost_price || 0),
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
      .select("*")
      .order("jatuh_tempo", { ascending: true });

    if (error) {
      console.error("Error fetching debts:", error);
      return [];
    }

    return data as IDebt[];
  },
};
