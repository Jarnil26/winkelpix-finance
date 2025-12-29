"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ArrowUpDown, Search, Users, Loader2, AlertCircle, TrendingUp, TrendingDown } from "lucide-react"
import { Button } from "@/components/ui/button"

// --- 1. UPDATED SALARY MAPPING ---
const SALARY_MAPPING: Record<string, number> = {
  "vaibhav9913": 20000,
  "bhavesh1609": 30000,
  "sanjay0206": 35000,
  "Admin@2610": 0, // Default for Admin (optional)
}

// Interface matching API response
interface EmployeeData {
  username: string
  role: string
  tasksCompleted: number
  totalWorkValue: number
  // Salary & Difference are calculated locally
}

type SortField = "username" | "role" | "tasksCompleted" | "totalWorkValue" | "salary" | "difference"
type SortDirection = "asc" | "desc"

export function EmployeePerformanceTable() {
  const [data, setData] = useState<EmployeeData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [searchTerm, setSearchTerm] = useState("")
  const [sortField, setSortField] = useState<SortField>("difference")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/analytics/employee-performance")
        if (!res.ok) throw new Error("Failed to fetch data")
        const result = await res.json()
        setData(result)
      } catch (err) {
        console.error(err)
        setError("Failed to load employee data")
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

  // --- 2. MERGE API DATA WITH LOCAL SALARY ---
  const processedData = data.map(emp => {
    // If username matches mapping, use that salary. Otherwise default to 0.
    const salary = SALARY_MAPPING[emp.username] || 0 
    const difference = emp.totalWorkValue - salary
    return { ...emp, salary, difference }
  })

  // --- 3. FILTER & SORT ---
  const filteredAndSortedData = processedData
    .filter(
      (emp) =>
        emp.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (emp.role && emp.role.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      const aVal = a[sortField]
      const bVal = b[sortField]
      
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDirection === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }
      return sortDirection === "asc" ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number)
    })

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  const getRoleBadgeClass = (role: string) => {
    if (!role) return "bg-gray-100 text-gray-600"
    const r = role.toLowerCase()
    if (r.includes("senior") || r.includes("manager") || r.includes("head"))
      return "bg-primary/10 text-primary border-primary/20"
    if (r.includes("designer")) return "bg-purple-50 text-purple-700 border-purple-100"
    if (r.includes("developer")) return "bg-blue-50 text-blue-700 border-blue-100"
    return "bg-muted text-muted-foreground border-border"
  }

  const currentMonthName = new Date().toLocaleString('default', { month: 'long' })

  return (
    <Card className="border-border card-shadow h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Users className="w-4 h-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">Monthly Employee Performance</CardTitle>
              <p className="text-xs text-muted-foreground">Work generated vs Salary ({currentMonthName})</p>
            </div>
          </div>
          <div className="relative w-full sm:w-[200px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 flex-1">
        {loading ? (
          <div className="flex items-center justify-center h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-[300px] text-red-500 gap-2">
            <AlertCircle className="h-6 w-6" />
            <p className="text-sm">{error}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs font-semibold w-[140px]">
                      <Button variant="ghost" size="sm" onClick={() => handleSort("username")} className="p-0 h-auto font-semibold text-xs hover:bg-transparent">
                        Employee <ArrowUpDown className="ml-1.5 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-xs font-semibold">Role</TableHead>
                    
                    <TableHead className="text-xs font-semibold text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleSort("salary")} className="p-0 h-auto font-semibold text-xs hover:bg-transparent">
                        Salary <ArrowUpDown className="ml-1.5 h-3 w-3" />
                      </Button>
                    </TableHead>

                    <TableHead className="text-xs font-semibold text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleSort("totalWorkValue")} className="p-0 h-auto font-semibold text-xs hover:bg-transparent">
                        Generated <ArrowUpDown className="ml-1.5 h-3 w-3" />
                      </Button>
                    </TableHead>

                    <TableHead className="text-xs font-semibold text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleSort("difference")} className="p-0 h-auto font-semibold text-xs hover:bg-transparent">
                        Net P/L <ArrowUpDown className="ml-1.5 h-3 w-3" />
                      </Button>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedData.length === 0 ? (
                     <TableRow>
                       <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                         No performance data found for {currentMonthName}.
                       </TableCell>
                     </TableRow>
                  ) : (
                    filteredAndSortedData.map((employee) => {
                      const isProfit = employee.difference >= 0;
                      return (
                        <TableRow key={employee.username} className="group hover:bg-muted/50">
                          <TableCell className="font-medium text-sm">{employee.username}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`text-[10px] font-medium truncate max-w-[120px] ${getRoleBadgeClass(employee.role)}`}>
                              {employee.role}
                            </Badge>
                          </TableCell>
                          
                          <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                            {formatCurrency(employee.salary)}
                          </TableCell>

                          <TableCell className="text-right font-semibold text-sm tabular-nums">
                            {formatCurrency(employee.totalWorkValue)}
                          </TableCell>

                          <TableCell className={`text-right font-bold text-sm tabular-nums ${isProfit ? "text-emerald-600" : "text-red-500"}`}>
                            <div className="flex items-center justify-end gap-1">
                                {isProfit ? <TrendingUp className="w-3 h-3"/> : <TrendingDown className="w-3 h-3"/>}
                                {isProfit ? "+" : ""}{formatCurrency(employee.difference)}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
            
            <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/10 mt-auto">
              <span className="text-xs text-muted-foreground">
                {filteredAndSortedData.length} employees
              </span>
              <div className="flex gap-4">
                 <span className="text-xs text-muted-foreground">
                    Total Salary: <span className="font-semibold text-foreground">{formatCurrency(filteredAndSortedData.reduce((acc, emp) => acc + emp.salary, 0))}</span>
                 </span>
                 <span className="text-xs text-muted-foreground">
                    Total Generated: <span className="font-semibold text-foreground">{formatCurrency(filteredAndSortedData.reduce((acc, emp) => acc + emp.totalWorkValue, 0))}</span>
                 </span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}