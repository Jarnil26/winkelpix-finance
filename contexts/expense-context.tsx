"use client"

import { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from "react"

export type ExpenseCategory =
  | "Subscription"
  | "Courier"
  | "Utilities"
  | "Office Supplies"
  | "Marketing"
  | "Travel"
  | "Maintenance"
  | "Other"

export interface Expense {
  id: string
  name: string
  category: ExpenseCategory
  amount: number
  date: string
  description?: string
  recurring: boolean
  recurringInterval?: "monthly" | "quarterly" | "yearly"
  reminderEnabled?: boolean
  reminderDaysBefore?: number
  nextDueDate?: string
}

export interface ExpenseNotification {
  id: string
  expenseId: string
  type: "due_soon" | "overdue" | "monthly_summary"
  title: string
  message: string
  amount?: number
  dueDate?: string
  read: boolean
  createdAt: string
}

interface MonthlyReport {
  month: string
  year: number
  total: number
  byCategory: Record<ExpenseCategory, number>
  expenses: Expense[]
}

interface ExpenseContextType {
  expenses: Expense[]
  loading: boolean
  addExpense: (expense: Omit<Expense, "id">) => Promise<void>
  updateExpense: (id: string, expense: Partial<Expense>) => Promise<void>
  deleteExpense: (id: string) => Promise<void>
  getMonthlyReport: (month: number, year: number) => MonthlyReport
  getTotalExpenses: () => number
  categories: ExpenseCategory[]
  notifications: ExpenseNotification[]
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
  getUnreadCount: () => number
  getUpcomingRecurringExpenses: () => Expense[]
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined)

const categories: ExpenseCategory[] = [
  "Subscription",
  "Courier",
  "Utilities",
  "Office Supplies",
  "Marketing",
  "Travel",
  "Maintenance",
  "Other",
]

// Helper function to calculate next due date
function calculateNextDueDate(currentDate: string, interval?: "monthly" | "quarterly" | "yearly"): string {
  const date = new Date(currentDate)
  const today = new Date()

  // Loop until we find a future date or today
  // Note: This logic might need tweaking depending on specific business rules,
  // currently it finds the *next* occurrence relative to today.
  while (date <= today) {
    switch (interval) {
      case "monthly":
        date.setMonth(date.getMonth() + 1)
        break
      case "quarterly":
        date.setMonth(date.getMonth() + 3)
        break
      case "yearly":
        date.setFullYear(date.getFullYear() + 1)
        break
      default:
        date.setMonth(date.getMonth() + 1)
    }
  }

  return date.toISOString().split("T")[0]
}

function generateNotifications(expenses: Expense[]): ExpenseNotification[] {
  const notifications: ExpenseNotification[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Check recurring expenses for due dates
  expenses.forEach((expense) => {
    if (expense.recurring && expense.nextDueDate) {
      const dueDate = new Date(expense.nextDueDate)
      dueDate.setHours(0, 0, 0, 0)
      const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      const reminderDays = expense.reminderDaysBefore || 3

      if (daysUntilDue < 0) {
        // Overdue
        notifications.push({
          id: `overdue-${expense.id}`,
          expenseId: expense.id,
          type: "overdue",
          title: `${expense.name} is overdue`,
          message: `Payment of ₹${expense.amount.toLocaleString()} was due ${Math.abs(daysUntilDue)} day(s) ago`,
          amount: expense.amount,
          dueDate: expense.nextDueDate,
          read: false,
          createdAt: new Date().toISOString(),
        })
      } else if (daysUntilDue <= reminderDays) {
        // Due soon
        notifications.push({
          id: `due-${expense.id}`,
          expenseId: expense.id,
          type: "due_soon",
          title: `${expense.name} due ${daysUntilDue === 0 ? "today" : `in ${daysUntilDue} day(s)`}`,
          message: `${expense.recurringInterval?.charAt(0).toUpperCase()}${expense.recurringInterval?.slice(1)} payment of ₹${expense.amount.toLocaleString()}`,
          amount: expense.amount,
          dueDate: expense.nextDueDate,
          read: false,
          createdAt: new Date().toISOString(),
        })
      }
    }
  })

  // Monthly expense summary notification
  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()
  const monthlyExpenses = expenses.filter((exp) => {
    const date = new Date(exp.date)
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear
  })
  const monthlyTotal = monthlyExpenses.reduce((sum, exp) => sum + exp.amount, 0)

  if (monthlyTotal > 0) {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    notifications.push({
      id: `monthly-${currentMonth}-${currentYear}`,
      expenseId: "",
      type: "monthly_summary",
      title: `${monthNames[currentMonth]} ${currentYear} Expense Summary`,
      message: `Total expenses: ₹${monthlyTotal.toLocaleString()} across ${monthlyExpenses.length} transactions`,
      amount: monthlyTotal,
      read: false,
      createdAt: new Date().toISOString(),
    })
  }

  return notifications
}

export function ExpenseProvider({ children }: { children: ReactNode }) {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [notifications, setNotifications] = useState<ExpenseNotification[]>([])
  const [readNotifications, setReadNotifications] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  // 1. Fetch Expenses from API
  const fetchExpenses = useCallback(async () => {
    try {
      const res = await fetch("/api/expenses")
      if (!res.ok) throw new Error("Failed to fetch")
      
      const data = await res.json()
      // Map MongoDB _id to frontend id
      const formatted: Expense[] = data.map((item: any) => ({
        ...item,
        id: item._id, // Ensure ID mapping is correct
      }))
      
      setExpenses(formatted)
    } catch (error) {
      console.error("Failed to fetch expenses:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial Fetch & Load Read Notifications
  useEffect(() => {
    fetchExpenses()
    
    const savedRead = sessionStorage.getItem("ems_read_notifications")
    if (savedRead) {
      setReadNotifications(new Set(JSON.parse(savedRead)))
    }
  }, [fetchExpenses])

  // Generate notifications when expenses change
  useEffect(() => {
    if (loading) return

    const newNotifications = generateNotifications(expenses)
    setNotifications(
      newNotifications.map((n) => ({
        ...n,
        read: readNotifications.has(n.id),
      }))
    )
  }, [expenses, readNotifications, loading])

  // --- CRUD Operations ---

  const addExpense = async (expense: Omit<Expense, "id">) => {
    try {
      // Calculate next due date before sending to DB
      const expenseToSave = {
        ...expense,
        nextDueDate: expense.recurring ? calculateNextDueDate(expense.date, expense.recurringInterval) : undefined,
      }

      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(expenseToSave),
      })

      if (res.ok) {
        const newExpense = await res.json()
        const formatted = { ...newExpense, id: newExpense._id }
        setExpenses((prev) => [formatted, ...prev])
      }
    } catch (error) {
      console.error("Failed to add expense:", error)
    }
  }

  const updateExpense = async (id: string, updates: Partial<Expense>) => {
    try {
      // Logic to recalculate due date if date/interval changes
      let updatedFields = { ...updates }
      const currentExpense = expenses.find(e => e.id === id)
      
      if (currentExpense && updates.recurring && (updates.date || updates.recurringInterval)) {
        updatedFields.nextDueDate = calculateNextDueDate(
          updates.date || currentExpense.date,
          updates.recurringInterval || currentExpense.recurringInterval
        )
      }

      const res = await fetch("/api/expenses", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updatedFields }),
      })

      if (res.ok) {
        setExpenses((prev) =>
          prev.map((exp) => (exp.id === id ? { ...exp, ...updatedFields } : exp))
        )
      }
    } catch (error) {
      console.error("Failed to update expense:", error)
    }
  }

  const deleteExpense = async (id: string) => {
    try {
      const res = await fetch(`/api/expenses?id=${id}`, { method: "DELETE" })
      if (res.ok) {
        setExpenses((prev) => prev.filter((exp) => exp.id !== id))
      }
    } catch (error) {
      console.error("Failed to delete expense:", error)
    }
  }

  // --- Helpers ---

  const markNotificationRead = (id: string) => {
    setReadNotifications((prev) => {
      const newSet = new Set(prev)
      newSet.add(id)
      sessionStorage.setItem("ems_read_notifications", JSON.stringify([...newSet]))
      return newSet
    })
  }

  const markAllNotificationsRead = () => {
    const allIds = notifications.map((n) => n.id)
    setReadNotifications(new Set(allIds))
    sessionStorage.setItem("ems_read_notifications", JSON.stringify(allIds))
  }

  const getUnreadCount = () => {
    return notifications.filter((n) => !n.read).length
  }

  const getUpcomingRecurringExpenses = () => {
    return expenses
      .filter((exp) => exp.recurring && exp.nextDueDate)
      .sort((a, b) => {
        return new Date(a.nextDueDate!).getTime() - new Date(b.nextDueDate!).getTime()
      })
  }

  const getMonthlyReport = (month: number, year: number): MonthlyReport => {
    const monthExpenses = expenses.filter((exp) => {
      const date = new Date(exp.date)
      return date.getMonth() === month && date.getFullYear() === year
    })

    const byCategory = categories.reduce(
      (acc, cat) => {
        acc[cat] = monthExpenses.filter((exp) => exp.category === cat).reduce((sum, exp) => sum + exp.amount, 0)
        return acc
      },
      {} as Record<ExpenseCategory, number>,
    )

    const total = monthExpenses.reduce((sum, exp) => sum + exp.amount, 0)

    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ]

    return {
      month: monthNames[month],
      year,
      total,
      byCategory,
      expenses: monthExpenses,
    }
  }

  const getTotalExpenses = () => {
    return expenses.reduce((sum, exp) => sum + exp.amount, 0)
  }

  return (
    <ExpenseContext.Provider
      value={{
        expenses,
        loading,
        addExpense,
        updateExpense,
        deleteExpense,
        getMonthlyReport,
        getTotalExpenses,
        categories,
        notifications,
        markNotificationRead,
        markAllNotificationsRead,
        getUnreadCount,
        getUpcomingRecurringExpenses,
      }}
    >
      {children}
    </ExpenseContext.Provider>
  )
}

export function useExpenses() {
  const context = useContext(ExpenseContext)
  if (!context) {
    throw new Error("useExpenses must be used within an ExpenseProvider")
  }
  return context
}