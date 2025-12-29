import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import Expense from "@/models/expense";

export async function GET() {
  try {
    await connectToDB();

    // Aggregation Pipeline: Group by Category and Sum Amounts
    const breakdown = await Expense.aggregate([
      {
        $group: {
          _id: "$category", // Group by the category field
          value: { $sum: "$amount" }, // Sum up the amounts
        },
      },
      {
        $project: {
          _id: 0, // Exclude the Mongo ID
          name: "$_id", // Rename _id to name
          value: 1, // Keep value
        },
      },
      {
        $sort: { value: -1 }, // Sort by highest expense first
      },
    ]);

    return NextResponse.json(breakdown);
  } catch (error) {
    console.error("Expense Breakdown API Error:", error);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}