import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import Invoice from "@/models/invoice";
import Expense from "@/models/expense";

export async function GET() {
  try {
    await connectToDB();

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // 1. Define Date Ranges
    // Start of THIS month (e.g., Dec 1st)
    const startOfThisMonth = new Date(currentYear, currentMonth, 1);
    // End of THIS month (e.g., Dec 31st) - captures future dated invoices for this month
    const endOfThisMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

    // Start of LAST month (e.g., Nov 1st)
    const startOfLastMonth = new Date(currentYear, currentMonth - 1, 1);
    // End of LAST month (e.g., Nov 30th)
    const endOfLastMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59);

    // 2. Helper Function to calculate totals for a specific date range
    const getTotalsForRange = async (startDate: Date, endDate: Date) => {
      
      // A. Invoice Totals (Revenue & GST)
      const invoiceStats = await Invoice.aggregate([
        {
          // FIX: Convert string date to real date
          $addFields: {
            realDate: { $toDate: "$paymentDate" }
          }
        },
        {
          $match: {
            isPaid: true,
            realDate: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: null,
            revenue: { $sum: "$totalAmount" }, 
            gst: { $sum: { $add: ["$cgstAmount", "$sgstAmount"] } },
          },
        },
      ]);

      // B. Expense Totals
      const expenseStats = await Expense.aggregate([
        {
          // FIX: Convert string date to real date
          $addFields: {
            realDate: { $toDate: "$date" }
          }
        },
        {
          $match: {
            realDate: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$amount" },
          },
        },
      ]);

      const revenue = invoiceStats[0]?.revenue || 0;
      const gst = invoiceStats[0]?.gst || 0;
      const expenses = expenseStats[0]?.total || 0;

      // Profit Formula
      const profit = revenue - gst - expenses;

      return { revenue, gst, expenses, profit };
    };

    // 3. Execute Parallel Queries
    const [current, last] = await Promise.all([
      getTotalsForRange(startOfThisMonth, endOfThisMonth),
      getTotalsForRange(startOfLastMonth, endOfLastMonth),
    ]);

    // 4. Calculate Percentage Changes
    const calculateChange = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return parseFloat((((curr - prev) / prev) * 100).toFixed(1));
    };

    const kpiData = {
      totalRevenue: current.revenue,
      totalGst: current.gst,
      totalExpenses: current.expenses,
      netProfit: current.profit,
      revenueChange: calculateChange(current.revenue, last.revenue),
      gstChange: calculateChange(current.gst, last.gst),
      expenseChange: calculateChange(current.expenses, last.expenses),
      profitChange: calculateChange(current.profit, last.profit),
    };

    return NextResponse.json(kpiData);
  } catch (error) {
    console.error("KPI API Error:", error);
    return NextResponse.json({ error: "Failed to fetch KPI data" }, { status: 500 });
  }
}