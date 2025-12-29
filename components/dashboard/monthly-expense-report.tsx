"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useExpenses, type ExpenseCategory } from "@/contexts/expense-context"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts"
import { TrendingUp, TrendingDown, Calendar } from "lucide-react"

const categoryColors: Record<ExpenseCategory, string> = {
  Subscription: "#8b5cf6",
  Courier: "#f59e0b",
  Utilities: "#3b82f6",
  "Office Supplies": "#10b981",
  Marketing: "#ec4899",
  Travel: "#06b6d4",
  Maintenance: "#f97316",
  Other: "#64748b",
}

export function MonthlyExpenseReport() {
  const { getMonthlyReport, categories } = useExpenses()
  const currentDate = new Date()
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth())
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear())

  const report = getMonthlyReport(selectedMonth, selectedYear)
  const prevReport = getMonthlyReport(
    selectedMonth === 0 ? 11 : selectedMonth - 1,
    selectedMonth === 0 ? selectedYear - 1 : selectedYear,
  )

  const percentChange = prevReport.total > 0 ? ((report.total - prevReport.total) / prevReport.total) * 100 : 0

  const chartData = categories
    .map((cat) => ({
      name: cat,
      value: report.byCategory[cat] || 0,
      color: categoryColors[cat],
    }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value)

  const formatCurrency = (value: number) => {
    if (value >= 100000) {
      return `₹${(value / 100000).toFixed(1)}L`
    }
    return `₹${(value / 1000).toFixed(0)}K`
  }

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  return (
    <Card className="border-border card-shadow">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <CardTitle className="text-base font-semibold">Monthly Expense Report</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(Number(v))}>
              <SelectTrigger className="h-8 w-[120px] text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((month, i) => (
                  <SelectItem key={month} value={i.toString()}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(Number(v))}>
              <SelectTrigger className="h-8 w-[90px] text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2023">2023</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Summary Stats */}
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Total Expenses</p>
              <p className="text-3xl font-bold text-foreground">
                {new Intl.NumberFormat("en-IN", {
                  style: "currency",
                  currency: "INR",
                  maximumFractionDigits: 0,
                }).format(report.total)}
              </p>
              <div className="flex items-center gap-1.5 mt-2">
                {percentChange >= 0 ? (
                  <TrendingUp className="w-3.5 h-3.5 text-destructive" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 text-primary" />
                )}
                <span className={`text-xs font-semibold ${percentChange >= 0 ? "text-destructive" : "text-primary"}`}>
                  {percentChange >= 0 ? "+" : ""}
                  {percentChange.toFixed(1)}%
                </span>
                <span className="text-xs text-muted-foreground">vs previous month</span>
              </div>
            </div>

            {/* Category Breakdown List */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">By Category</p>
              <div className="space-y-2 max-h-[180px] overflow-y-auto scrollbar-thin pr-1">
                {chartData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm text-foreground">{item.name}</span>
                    </div>
                    <span className="text-sm font-semibold">
                      {new Intl.NumberFormat("en-IN", {
                        style: "currency",
                        currency: "INR",
                        maximumFractionDigits: 0,
                      }).format(item.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 20 }}>
                <XAxis
                  type="number"
                  tickFormatter={formatCurrency}
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={90}
                />
                <Tooltip
                  formatter={(value: number) =>
                    new Intl.NumberFormat("en-IN", {
                      style: "currency",
                      currency: "INR",
                      maximumFractionDigits: 0,
                    }).format(value)
                  }
                  contentStyle={{
                    backgroundColor: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
