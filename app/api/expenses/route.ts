import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import Expense from "@/models/expense";

// GET: Fetch all expenses
export async function GET() {
  try {
    await connectToDB();
    // Sort by date descending (newest first)
    const expenses = await Expense.find({}).sort({ date: -1 });
    return NextResponse.json(expenses);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 });
  }
}

// POST: Add a new expense
export async function POST(req: Request) {
  try {
    await connectToDB();
    const data = await req.json();
    const newExpense = await Expense.create(data);
    return NextResponse.json(newExpense, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 });
  }
}

// PUT: Update an expense
export async function PUT(req: Request) {
  try {
    await connectToDB();
    const { id, ...updateData } = await req.json();
    
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const updatedExpense = await Expense.findByIdAndUpdate(id, updateData, { new: true });
    return NextResponse.json(updatedExpense);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update expense" }, { status: 500 });
  }
}

// DELETE: Remove an expense
export async function DELETE(req: Request) {
  try {
    await connectToDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await Expense.findByIdAndDelete(id);
    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete expense" }, { status: 500 });
  }
}