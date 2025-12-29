import mongoose, { Schema, model, models } from "mongoose";

const InvoiceSchema = new Schema(
  {
    invoiceNumber: { type: String, required: true },
    amount: { type: Number, required: true },
    cgstAmount: { type: Number },
    sgstAmount: { type: Number },
    totalAmount: { type: Number },
    isPaid: { type: Boolean, default: false },
    paymentDate: { type: Date },
  },
  { timestamps: true }
);

const Invoice = models.Invoice || model("Invoice", InvoiceSchema, "invoices");

export default Invoice;