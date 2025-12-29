"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { useExpenses, type Expense, type ExpenseCategory } from "@/contexts/expense-context"
import { Plus, Pencil, Trash2, RefreshCw, Search, ChevronLeft, ChevronRight, Bell, BellOff, Loader2 } from "lucide-react"

interface ExpenseManagementProps {
  showAddDialog: boolean
  setShowAddDialog: (show: boolean) => void
}

const categoryColors: Record<ExpenseCategory, string> = {
  Subscription: "bg-violet-100 text-violet-700 border-violet-200",
  Courier: "bg-amber-100 text-amber-700 border-amber-200",
  Utilities: "bg-blue-100 text-blue-700 border-blue-200",
  "Office Supplies": "bg-emerald-100 text-emerald-700 border-emerald-200",
  Marketing: "bg-pink-100 text-pink-700 border-pink-200",
  Travel: "bg-cyan-100 text-cyan-700 border-cyan-200",
  Maintenance: "bg-orange-100 text-orange-700 border-orange-200",
  Other: "bg-slate-100 text-slate-700 border-slate-200",
}

export function ExpenseManagement({ showAddDialog, setShowAddDialog }: ExpenseManagementProps) {
  const { expenses, addExpense, updateExpense, deleteExpense, categories, loading } = useExpenses()
  
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState<ExpenseCategory | "all">("all")
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    category: "Subscription" as ExpenseCategory,
    amount: "",
    date: new Date().toISOString().split("T")[0],
    description: "",
    recurring: false,
    recurringInterval: "monthly" as "monthly" | "quarterly" | "yearly",
    reminderEnabled: true,
    reminderDaysBefore: 3,
  })

  const filteredExpenses = expenses.filter((expense) => {
    const matchesSearch = expense.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === "all" || expense.category === filterCategory
    return matchesSearch && matchesCategory
  })

  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage)
  const paginatedExpenses = filteredExpenses.slice(
    (currentPage - 1) * itemsPerPage, 
    currentPage * itemsPerPage
  )

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value)
  }

  const handleSubmit = async () => {
    if (!formData.name || !formData.amount) return
    setIsSubmitting(true)
    const expenseData = {
      name: formData.name,
      category: formData.category,
      amount: Number(formData.amount),
      date: formData.date,
      description: formData.description,
      recurring: formData.recurring,
      recurringInterval: formData.recurring ? formData.recurringInterval : undefined,
      reminderEnabled: formData.recurring ? formData.reminderEnabled : false,
      reminderDaysBefore: formData.recurring ? formData.reminderDaysBefore : undefined,
    }
    try {
      if (editingExpense) {
        await updateExpense(editingExpense.id, expenseData)
      } else {
        await addExpense(expenseData)
      }
      resetForm()
    } catch (error) {
      console.error("Failed to save expense", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      category: "Subscription",
      amount: "",
      date: new Date().toISOString().split("T")[0],
      description: "",
      recurring: false,
      recurringInterval: "monthly",
      reminderEnabled: true,
      reminderDaysBefore: 3,
    })
    setEditingExpense(null)
    setShowAddDialog(false)
  }

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense)
    const dateStr = new Date(expense.date).toISOString().split("T")[0]
    setFormData({
      name: expense.name,
      category: expense.category,
      amount: expense.amount.toString(),
      date: dateStr,
      description: expense.description || "",
      recurring: expense.recurring,
      recurringInterval: expense.recurringInterval || "monthly",
      reminderEnabled: expense.reminderEnabled ?? true,
      reminderDaysBefore: expense.reminderDaysBefore ?? 3,
    })
    setShowAddDialog(true)
  }

  const toggleReminder = async (expense: Expense) => {
    await updateExpense(expense.id, { reminderEnabled: !expense.reminderEnabled })
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this expense?")) {
      await deleteExpense(id)
    }
  }

  return (
    <>
      <Card className="border-border card-shadow h-full flex flex-col">
        <CardHeader className="pb-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <CardTitle className="text-lg font-semibold">Expense Management</CardTitle>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
              {/* Search - Full width on mobile */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Search expenses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-11 pl-11 pr-4 text-sm w-full"
                />
              </div>
              
              {/* Filters & Add Button */}
              <div className="flex items-center gap-2 flex-1 sm:flex-none">
                <Select value={filterCategory} onValueChange={(v) => setFilterCategory(v as ExpenseCategory | "all")}>
                  <SelectTrigger className="h-11 w-[140px] text-sm flex-shrink-0">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  size="sm" 
                  className="h-11 px-4 gap-2 flex-shrink-0 bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => setShowAddDialog(true)}
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Add</span>
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0 flex-1 min-h-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 p-8 text-muted-foreground gap-3">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="text-sm text-center">Loading expenses...</p>
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 p-8 text-muted-foreground gap-4">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                <Search className="w-8 h-8" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-lg font-semibold text-foreground">No expenses found</p>
                <p className="text-sm">Add one to get started.</p>
              </div>
              <Button 
                className="h-10 px-6 bg-emerald-600 hover:bg-emerald-700"
                onClick={() => setShowAddDialog(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Expense
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-b border-border/50">
                      <TableHead className="w-[200px] text-xs font-semibold">Name</TableHead>
                      <TableHead className="w-[120px] hidden md:table-cell text-xs font-semibold">Category</TableHead>
                      <TableHead className="w-[100px] text-xs font-semibold text-right">Amount</TableHead>
                      <TableHead className="w-[100px] text-xs font-semibold">Date</TableHead>
                      <TableHead className="w-[80px] hidden sm:table-cell text-xs font-semibold">Type</TableHead>
                      <TableHead className="w-[100px] text-xs font-semibold text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedExpenses.map((expense) => (
                      <TableRow key={expense.id} className="group hover:bg-muted/50 border-b border-border/20 last:border-b-0">
                        <TableCell className="font-medium text-sm pr-4 max-w-[180px]">
                          <div className="flex items-center gap-2">
                            <span className="truncate">{expense.name}</span>
                            {expense.recurring && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleReminder(expense)
                                }}
                                className="text-muted-foreground hover:text-foreground transition-colors p-1 -m-1 rounded-full hover:bg-muted"
                                title={expense.reminderEnabled ? "Reminder enabled" : "Reminder disabled"}
                              >
                                {expense.reminderEnabled ? (
                                  <Bell className="w-4 h-4 text-amber-500" />
                                ) : (
                                  <BellOff className="w-4 h-4" />
                                )}
                              </button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge
                            variant="outline"
                            className={`text-xs font-medium ${categoryColors[expense.category]} max-w-[110px]`}
                          >
                            {expense.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-sm font-mono">
                          {formatCurrency(expense.amount)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground font-mono">
                          {new Date(expense.date).toLocaleDateString("en-IN", { 
                            day: "2-digit", 
                            month: "short" 
                          })}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {expense.recurring && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <RefreshCw className="w-3 h-3 animate-spin" />
                              <span className="capitalize font-medium">{expense.recurringInterval}</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right pr-4">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-9 w-9 p-2 hover:bg-muted"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEdit(expense)
                              }}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 p-2 text-destructive hover:bg-destructive/5 hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDelete(expense.id)
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/20">
                  <div className="text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredExpenses.length)} of {filteredExpenses.length}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 border-muted-foreground hover:bg-muted"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(currentPage - 1)}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <div className="flex items-center gap-1 text-sm font-medium">
                      <span>Page</span>
                      <span className="w-8 text-center">{currentPage}</span>
                      <span>of</span>
                      <span>{totalPages}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 border-muted-foreground hover:bg-muted"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(currentPage + 1)}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Expense Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="p-6 pb-4 border-b">
            <DialogTitle className="text-xl font-semibold">
              {editingExpense ? "Edit Expense" : "Add New Expense"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="p-6 space-y-4">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Expense Name</Label>
              <Input
                placeholder="e.g., AWS Hosting, Google Ads"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="h-12"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Category</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v as ExpenseCategory })}>
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Amount</Label>
                <Input
                  type="number"
                  placeholder="₹0"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="h-12"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Date</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Description</Label>
                <Input
                  placeholder="Optional description..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="h-12"
                />
              </div>
            </div>

            {/* Recurring Options */}
            <div className="space-y-3 pt-4 border-t border-border/50">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="recurring"
                  checked={formData.recurring}
                  onCheckedChange={(checked) => setFormData({ ...formData, recurring: !!checked })}
                />
                <Label htmlFor="recurring" className="text-sm font-medium cursor-pointer flex-1">
                  Make this a recurring expense
                </Label>
              </div>

              {formData.recurring && (
                <div className="pl-6 space-y-3 border-l-2 border-dashed border-muted-foreground/30">
                  <div className="grid grid-cols-2 gap-3">
                    <Select value={formData.recurringInterval} onValueChange={(v) => setFormData({ ...formData, recurringInterval: v as any })}>
                      <SelectTrigger className="h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id="reminder"
                        checked={formData.reminderEnabled}
                        onCheckedChange={(checked) => setFormData({ ...formData, reminderEnabled: !!checked })}
                      />
                      <Label htmlFor="reminder" className="text-sm font-medium cursor-pointer whitespace-nowrap">
                        Send reminder
                      </Label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="p-6 pt-0 border-t bg-muted/30 gap-3">
            <Button
              variant="outline"
              className="h-12 flex-1 sm:w-auto"
              onClick={resetForm}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              className="h-12 px-8 flex-1 sm:w-auto bg-emerald-600 hover:bg-emerald-700"
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.name || !formData.amount}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : editingExpense ? (
                "Update Expense"
              ) : (
                "Add Expense"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
