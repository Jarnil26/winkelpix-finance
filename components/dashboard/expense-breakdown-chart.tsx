"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { Loader2, AlertCircle } from "lucide-react"

// Map categories to specific consistent colors
const categoryColors: Record<string, string> = {
  "Subscription": "#8b5cf6",     // Violet
  "Courier": "#f59e0b",          // Amber
  "Utilities": "#3b82f6",        // Blue
  "Office Supplies": "#10b981",  // Emerald
  "Marketing": "#ec4899",        // Pink
  "Travel": "#06b6d4",           // Cyan
  "Maintenance": "#f97316",      // Orange
  "Other": "#64748b",            // Slate
  // Fallback for unknown categories
  "default": "#94a3b8" 
}

interface ExpenseData {
  name: string
  value: number
}

export function ExpenseBreakdownChart() {
  const [data, setData] = useState<ExpenseData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/analytics/expense-breakdown")
        if (!res.ok) throw new Error("Failed to fetch")
        const result = await res.json()
        setData(result)
      } catch (err) {
        console.error(err)
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Calculate total for percentage display
  const total = data.reduce((acc, item) => acc + item.value, 0)

  // Helper to get color safely
  const getColor = (name: string) => categoryColors[name] || categoryColors["default"]

  if (loading) {
    return (
      <Card className="border-border card-shadow h-[180px] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-border card-shadow h-[180px] flex items-center justify-center text-red-400">
        <AlertCircle className="h-6 w-6" />
        <span className="ml-2 text-xs">Failed to load data</span>
      </Card>
    )
  }

  if (data.length === 0) {
    return (
      <Card className="border-border card-shadow h-[180px] flex flex-col items-center justify-center text-muted-foreground">
        <p className="text-xs">No expenses recorded yet.</p>
      </Card>
    )
  }

  return (
    <Card className="border-border card-shadow">
      <CardContent className="p-4">
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-3">Expense Breakdown</p>
        <div className="flex items-center gap-3">
          {/* Chart Section */}
          <div className="w-20 h-20 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={22}
                  outerRadius={36}
                  dataKey="value"
                  strokeWidth={0}
                  paddingAngle={2}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getColor(entry.name)} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => `₹${value.toLocaleString("en-IN")}`}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: "hsl(var(--foreground))"
                  }}
                  itemStyle={{ color: "hsl(var(--foreground))" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend Section (Top 4 items) */}
          <div className="flex-1 space-y-1.5">
            {data.slice(0, 4).map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: getColor(item.name) }} 
                  />
                  <span className="text-[11px] text-muted-foreground truncate max-w-[80px]" title={item.name}>
                    {item.name}
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-foreground">
                  {total > 0 ? ((item.value / total) * 100).toFixed(0) : 0}%
                </span>
              </div>
            ))}
            
            {/* "Others" indicator if more than 4 items */}
            {data.length > 4 && (
               <div className="text-[10px] text-muted-foreground text-center pt-1 italic">
                 + {data.length - 4} more categories
               </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}