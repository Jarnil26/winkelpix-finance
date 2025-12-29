"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, ArrowUpRight, ArrowDownRight, Loader2 } from "lucide-react"

interface DailyIncomeData {
  averageDaily: number
  currentMonth: string
  daysElapsed: number
  totalThisMonth: number
  changeFromLastMonth: number
}

export function DailyIncomeWidget() {
  const [data, setData] = useState<DailyIncomeData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/analytics/daily-income")
        if (res.ok) {
          const result = await res.json()
          setData(result)
        }
      } catch (error) {
        console.error("Failed to load daily income widget", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value)
  }

  if (loading) {
    return (
      <Card className="border-none shadow-sm bg-muted/30 h-[160px] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </Card>
    )
  }

  if (!data) return null

  const isPositive = data.changeFromLastMonth >= 0

  return (
    <Card className="border-none shadow-sm bg-[#F1F5F9] dark:bg-muted/20">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Avg. Daily Income
            </p>
            <p className="text-3xl font-bold text-foreground mt-2">
              {formatCurrency(data.averageDaily)}
            </p>
          </div>
          {/* Green Icon Box matching your screenshot */}
          <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
            <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>

        <div className="flex items-center gap-2 mb-6">
           {isPositive ? (
             <ArrowUpRight className="w-4 h-4 text-emerald-600" />
           ) : (
             <ArrowDownRight className="w-4 h-4 text-red-500" />
           )}
           <span className={`text-sm font-bold ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
             {isPositive ? "+" : ""}{data.changeFromLastMonth}%
           </span>
           <span className="text-xs text-muted-foreground">vs last month</span>
        </div>

        <div className="flex justify-between items-end border-t border-gray-200 dark:border-gray-700 pt-3">
           <div className="flex flex-col">
             <span className="text-xs text-muted-foreground mb-0.5">{data.currentMonth} Revenue</span>
             <span className="text-sm font-semibold">{formatCurrency(data.totalThisMonth)}</span>
           </div>
           <div className="flex flex-col items-end">
              <span className="text-xs text-muted-foreground mb-0.5">Days Elapsed</span>
              <span className="text-sm font-semibold">{data.daysElapsed}</span>
           </div>
        </div>
      </CardContent>
    </Card>
  )
}