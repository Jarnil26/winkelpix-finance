"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts"
import { Loader2, AlertCircle } from "lucide-react"

interface ChartData {
  month: string
  revenue: number
  gst: number
  baseAmount: number
}

function CustomTooltip({
  active,
  payload,
  label,
}: { active?: boolean; payload?: Array<{ value: number; name: string; color: string; fill?: string }>; label?: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg shadow-lg p-3">
        <p className="font-semibold text-sm text-foreground mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-sm py-0.5">
            {/* Use entry.color (for line) or entry.fill (for bar) */}
            <div 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: entry.fill || entry.color }} 
            />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-semibold">₹{entry.value.toLocaleString("en-IN")}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export function RevenueGstChart() {
  const [data, setData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/analytics/revenue-chart")
        if (!res.ok) throw new Error("Failed to load chart")
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

  if (loading) {
    return (
      <Card className="border-border card-shadow h-full min-h-[350px] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-border card-shadow h-full min-h-[350px] flex flex-col items-center justify-center text-red-500 gap-2">
        <AlertCircle className="h-8 w-8" />
        <p className="text-sm">Failed to load chart data</p>
      </Card>
    )
  }

  return (
    <Card className="border-border card-shadow h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Revenue vs GST Analysis</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Monthly comparison of base revenue and GST</p>
          </div>
          <div className="flex items-center gap-4">
            {/* Legend: Base Amount (Green) */}
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#10b981" }} />
              <span className="text-xs text-muted-foreground">Base Amount</span>
            </div>
            {/* Legend: GST (Blue) */}
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 rounded-full bg-blue-500" />
              <span className="text-xs text-muted-foreground">GST</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="h-[260px] w-full">
          {data.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
              No revenue data found for this year.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `₹${value / 1000}k`}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted)/0.2)" }} />
                
                {/* 1. Bar Color changed to Emerald Green (#10b981) */}
                <Bar
                  dataKey="baseAmount"
                  fill="#10b981" 
                  name="Base Amount"
                  radius={[3, 3, 0, 0]}
                  maxBarSize={32}
                />
                
                {/* 2. Line Color stays Blue */}
                <Line
                  type="monotone"
                  dataKey="gst"
                  stroke="#3b82f6" 
                  strokeWidth={2.5}
                  name="GST"
                  dot={{ fill: "#3b82f6", strokeWidth: 0, r: 3 }}
                  activeDot={{ r: 5, fill: "#3b82f6" }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  )
}