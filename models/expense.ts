import mongoose, { Schema, model, models } from "mongoose";

const ExpenseSchema = new Schema(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    description: { type: String },
    recurring: { type: Boolean, default: false },
    recurringInterval: { type: String }, // "monthly", "quarterly", "yearly"
    reminderEnabled: { type: Boolean, default: false },
    reminderDaysBefore: { type: Number },
  },
  { timestamps: true }
);

const Expense = models.Expense || model("Expense", ExpenseSchema, "expenses");

export default Expense;