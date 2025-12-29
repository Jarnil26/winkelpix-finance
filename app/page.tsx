"use client"

import { useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { ExpenseProvider } from "@/contexts/expense-context"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { KpiCards } from "@/components/dashboard/kpi-cards"
import { RevenueGstChart } from "@/components/dashboard/revenue-gst-chart"
import { DailyIncomeWidget } from "@/components/dashboard/daily-income-widget"
import { EmployeePerformanceTable } from "@/components/dashboard/employee-performance-table"
import { ExpenseBreakdownChart } from "@/components/dashboard/expense-breakdown-chart"
import { ExpenseManagement } from "@/components/dashboard/expense-management"
import { MonthlyExpenseReport } from "@/components/dashboard/monthly-expense-report"

function DashboardContent() {
  const [showAddExpenseDialog, setShowAddExpenseDialog] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader onAddExpense={() => setShowAddExpenseDialog(true)} />
      <main className="container mx-auto px-6 py-6 space-y-6">
        {/* Row 1: KPI Cards */}
        <KpiCards />

        {/* Row 2: Charts & Widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            <RevenueGstChart />
          </div>
          <div className="space-y-5">
            <DailyIncomeWidget />
            <ExpenseBreakdownChart />
          </div>
        </div>

        {/* Row 3: Expense Management & Monthly Report */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <ExpenseManagement showAddDialog={showAddExpenseDialog} setShowAddDialog={setShowAddExpenseDialog} />
          <MonthlyExpenseReport />
        </div>

        {/* Row 4: Employee Performance */}
        <EmployeePerformanceTable />
      </main>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <ExpenseProvider>
        <DashboardContent />
      </ExpenseProvider>
    </ProtectedRoute>
  )
}
