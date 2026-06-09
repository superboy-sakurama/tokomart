import { supabase } from "./db";

export interface DashboardStats {
  todayRevenue: number;
  totalTransactions: number;
  productsSold: number;
  newCustomers: number;
  revenueTrend: string;
  transactionsTrend: string;
  productsTrend: string;
  customersTrend: string;
}

export const DashboardService = {
  async getStats(): Promise<DashboardStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString();

    const startOfMonth = new Date(
      today.getFullYear(),
      today.getMonth(),
      1,
    ).toISOString();

    // 1. Today Revenue
    const { data: incomeData } = await supabase
      .from("transactions")
      .select("total_amount")
      .eq("status", "COMPLETED")
      .gte("created_at", todayStr);

    const todayRevenue =
      incomeData?.reduce(
        (sum, item) => sum + (Number(item.total_amount) || 0),
        0,
      ) || 0;

    // 2. Total Transactions Today
    const totalTransactions = incomeData?.length || 0;

    // 3. Products Sold Today
    // To get products sold today, we need transaction items for today's transactions
    let productsSold = 0;
    const { data: todayTransactions } = await supabase
      .from("transactions")
      .select("id")
      .eq("status", "COMPLETED")
      .gte("created_at", todayStr);

    if (todayTransactions && todayTransactions.length > 0) {
      const transactionIds = todayTransactions.map((t: any) => t.id);
      const { data: itemsData } = await supabase
        .from("transaction_items")
        .select("quantity")
        .in("transaction_id", transactionIds);

      productsSold =
        itemsData?.reduce(
          (sum, item) => sum + (Number(item.quantity) || 0),
          0,
        ) || 0;
    }

    // 4. New Customers This Month
    const { count: newCustomers } = await supabase
      .from("customers")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startOfMonth);

    return {
      todayRevenue,
      totalTransactions,
      productsSold,
      newCustomers: newCustomers || 0,
      revenueTrend: "+0%",
      transactionsTrend: "+0%",
      productsTrend: "+0%",
      customersTrend: "+0%",
    };
  },
};
