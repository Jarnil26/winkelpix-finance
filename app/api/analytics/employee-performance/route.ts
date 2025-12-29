import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import { models, model, Schema } from "mongoose";

// Define schemas loosely
const TaskSchema = new Schema({}, { strict: false });
const Task = models.Task || model("Task", TaskSchema, "tasks");

const EmployeeSchema = new Schema({}, { strict: false });
const Employee = models.Employee || model("Employee", EmployeeSchema, "employees");

export async function GET() {
  try {
    await connectToDB();

    const now = new Date();
    // Start of current month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    // End of current month
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const performanceData = await Employee.aggregate([
      // 1. Start with Employees
      {
        $match: {
          role: "Employee" 
        }
      },
      // 2. Join with Tasks for THIS MONTH only
      {
        $lookup: {
          from: "tasks",
          let: { empUsername: "$username" },
          pipeline: [
            {
              $addFields: {
                realDate: { $toDate: "$workGivenDate" },
                numericAmount: { 
                  $convert: { input: "$paymentAmount", to: "double", onError: 0, onNull: 0 } 
                }
              }
            },
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$employeeId", "$$empUsername"] }, // Match Employee
                    { $eq: ["$taskStatus", "Completed"] },     // Only Completed
                    { $gte: ["$realDate", startOfMonth] },     // From Start of Month
                    { $lte: ["$realDate", endOfMonth] }        // To End of Month
                  ]
                }
              }
            }
          ],
          as: "monthlyTasks"
        }
      },
      // 3. Project Totals AND Salary
      {
        $project: {
          _id: 0,
          username: "$username",
          role: "$role",
          // Get Salary (default to 0 if missing)
          salary: { $ifNull: ["$salary", 0] },
          tasksCompleted: { $size: "$monthlyTasks" },
          totalWorkValue: { $sum: "$monthlyTasks.numericAmount" }
        }
      },
      // 4. Calculate Difference (Generated - Salary)
      {
        $addFields: {
          difference: { $subtract: ["$totalWorkValue", "$salary"] }
        }
      },
      // 5. Sort by highest Profit (Difference) first
      {
        $sort: { difference: -1 }
      }
    ]);

    return NextResponse.json(performanceData);
  } catch (error) {
    console.error("Employee Performance API Error:", error);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}