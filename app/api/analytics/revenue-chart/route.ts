import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import Invoice from "@/models/invoice";

export async function GET() {
  try {
    await connectToDB();

    const today = new Date();
    
    // 1. Define the range for the whole current year
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    const endOfYear = new Date(today.getFullYear(), 11, 31, 23, 59, 59);

    const monthlyStats = await Invoice.aggregate([
      {
        // STEP 1: Fix the Date Format
        // We create a temporary field 'realDate' by converting your String to a Date
        $addFields: {
          realDate: { $toDate: "$paymentDate" }
        }
      },
      {
        // STEP 2: Filter using the FIXED date
        $match: {
          isPaid: true,
          realDate: { $gte: startOfYear, $lte: endOfYear },
        },
      },
      {
        // STEP 3: Group by Month
        $group: {
          _id: {
            month: { $month: "$realDate" },
            year: { $year: "$realDate" },
          },
          baseAmount: { $sum: "$amount" },
          gst: { $sum: { $add: ["$cgstAmount", "$sgstAmount"] } },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ]);

    // Helper to get month name
    const getMonthName = (monthIndex: number) => {
      const date = new Date();
      date.setMonth(monthIndex - 1);
      return date.toLocaleString("default", { month: "short" });
    };

    // Fill in empty months with 0 so the line doesn't break
    const allMonths = Array.from({ length: 12 }, (_, i) => {
        const monthNum = i + 1;
        const found = monthlyStats.find(m => m._id.month === monthNum);
        return {
            month: getMonthName(monthNum),
            baseAmount: found ? found.baseAmount : 0,
            gst: found ? found.gst : 0,
            revenue: found ? (found.baseAmount + found.gst) : 0
        };
    });

    return NextResponse.json(allMonths);
  } catch (error) {
    console.error("Revenue Chart API Error:", error);
    return NextResponse.json({ error: "Failed to fetch chart data" }, { status: 500 });
  }
}