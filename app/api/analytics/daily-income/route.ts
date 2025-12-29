import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import Invoice from "@/models/invoice";

export async function GET() {
  try {
    await connectToDB();

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDay = now.getDate();

    // 1. Define Date Ranges (UTC Safe)
    const startOfThisMonth = new Date(Date.UTC(currentYear, currentMonth, 1));
    const endOfThisMonth = new Date(Date.UTC(currentYear, currentMonth + 1, 0, 23, 59, 59));
    
    const startOfLastMonth = new Date(Date.UTC(currentYear, currentMonth - 1, 1));
    const endOfLastMonth = new Date(Date.UTC(currentYear, currentMonth, 0, 23, 59, 59));

    // 2. Aggregate Current Month Revenue
    const currentMonthStats = await Invoice.aggregate([
      {
        $addFields: {
          // Robust conversion: Handles string dates, real dates, and missing dates
          realDate: { 
            $convert: { 
              input: "$paymentDate", 
              to: "date", 
              onError: null, 
              onNull: null 
            } 
          }
        }
      },
      {
        $match: {
          isPaid: true,
          realDate: { $gte: startOfThisMonth, $lte: endOfThisMonth }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" } 
        }
      }
    ]);

    // 3. Aggregate Last Month Revenue
    const lastMonthStats = await Invoice.aggregate([
      {
        $addFields: {
          realDate: { 
            $convert: { 
              input: "$paymentDate", 
              to: "date", 
              onError: null, 
              onNull: null 
            } 
          }
        }
      },
      {
        $match: {
          isPaid: true,
          realDate: { $gte: startOfLastMonth, $lte: endOfLastMonth }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" }
        }
      }
    ]);

    // 4. Calculate Logic
    const currentTotal = currentMonthStats[0]?.totalRevenue || 0;
    const lastTotal = lastMonthStats[0]?.totalRevenue || 0;
    
    // Average Daily = Total / Days Elapsed
    const daysElapsed = currentDay === 0 ? 1 : currentDay;
    const averageDaily = currentTotal / daysElapsed;

    // Percentage Change Calculation
    let percentageChange = 0;
    if (lastTotal > 0) {
      percentageChange = ((currentTotal - lastTotal) / lastTotal) * 100;
    } else if (currentTotal > 0) {
      percentageChange = 100;
    }

    return NextResponse.json({
      averageDaily: Math.round(averageDaily),
      currentMonth: now.toLocaleString('default', { month: 'long' }),
      daysElapsed: daysElapsed,
      totalThisMonth: currentTotal,
      changeFromLastMonth: parseFloat(percentageChange.toFixed(1))
    });

  } catch (error) {
    console.error("Daily Income API Error:", error);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}