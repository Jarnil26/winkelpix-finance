"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown, IndianRupee, Receipt, Wallet, PiggyBank, Loader2 } from "lucide-react"
// This import will now work because we fixed the file above
import { GaugeChart } from "./gauge-chart"

interface KpiData {
  totalRevenue: number
  totalGst: number
  totalExpenses: number
  netProfit: number
  revenueChange: number
  gstChange: number
  expenseChange: number
  profitChange: number
}

const initialData: KpiData = {
  totalRevenue: 0,
  totalGst: 0,
  totalExpenses: 0,
  netProfit: 0,
  revenueChange: 0,
  gstChange: 0,
  expenseChange: 0,
  profitChange: 0,
}

export function KpiCards() {
  const [data, setData] = useState<KpiData>(initialData)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchKpiData() {
      try {
        const res = await fetch("/api/analytics/kpi")
        if (res.ok) {
          const result = await res.json()
          setData(result)
        }
      } catch (error) {
        console.error("Failed to fetch KPI data", error)
      } finally {
        setLoading(false)
      }
    }
    fetchKpiData()
  }, [])

  const formatCurrency = (value: number) => {
    if (value >= 10000000) {
      return `₹${(value / 10000000).toFixed(2)}Cr`
    } else if (value >= 100000) {
      return `₹${(value / 100000).toFixed(2)}L`
    }
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value)
  }

  // Real Calculations for the Gauges
  const safeRevenue = data.totalRevenue || 1 
  const profitMargin = Math.round((data.netProfit / safeRevenue) * 100)
  const effectiveTaxRate = Math.round((data.totalGst / safeRevenue) * 100)
  const expenseRatio = Math.round((data.totalExpenses / safeRevenue) * 100)

  const cards = [
    {
      title: "Total Revenue",
      value: data.totalRevenue,
      change: data.revenueChange,
      icon: IndianRupee,
      color: "#10b981", 
      bgColor: "#10b98115",
      gaugeValue: Math.max(0, profitMargin), 
    },
    {
      title: "GST Collected",
      value: data.totalGst,
      change: data.gstChange,
      icon: Receipt,
      color: "#3b82f6", 
      bgColor: "#3b82f615",
      gaugeValue: Math.min(100, effectiveTaxRate), 
    },
    {
      title: "Total Expenses",
      value: data.totalExpenses,
      change: data.expenseChange,
      icon: Wallet,
      color: "#ef4444", 
      bgColor: "#ef444415",
      gaugeValue: Math.min(100, expenseRatio), 
    },
    {
      title: "Net Profit",
      value: data.netProfit,
      change: data.profitChange,
      icon: PiggyBank,
      color: "#f59e0b", 
      bgColor: "#f59e0b15",
      gaugeValue: Math.max(0, profitMargin), 
    },
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-border card-shadow h-[140px] flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card
          key={card.title}
          className="relative overflow-hidden border-border card-shadow hover:card-shadow-hover transition-shadow duration-200"
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: card.bgColor }}>
                <card.icon className="w-4 h-4" style={{ color: card.color }} />
              </div>
              <GaugeChart value={card.gaugeValue} color={card.color} size={52} />
            </div>
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
                {card.title}
              </p>
              <p className="text-xl font-bold text-card-foreground mb-1">
                {formatCurrency(card.value)}
              </p>
              <div className="flex items-center gap-1">
                {card.change >= 0 ? (
                  <TrendingUp className="w-3 h-3 text-emerald-600" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-500" />
                )}
                <span
                  className={`text-[11px] font-semibold ${
                    card.change >= 0 ? "text-emerald-600" : "text-red-500"
                  }`}
                >
                  {card.change > 0 ? "+" : ""}
                  {card.change}%
                </span>
                <span className="text-[10px] text-muted-foreground">vs last month</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}