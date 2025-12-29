"use client"

import { Bell, AlertCircle, Calendar, FileText, CheckCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useExpenses, type ExpenseNotification } from "@/contexts/expense-context"
import { cn } from "@/lib/utils"

function NotificationIcon({ type }: { type: ExpenseNotification["type"] }) {
  switch (type) {
    case "overdue":
      return <AlertCircle className="w-4 h-4 text-destructive" />
    case "due_soon":
      return <Calendar className="w-4 h-4 text-amber-500" />
    case "monthly_summary":
      return <FileText className="w-4 h-4 text-primary" />
  }
}

export function NotificationDropdown() {
  const { notifications, markNotificationRead, markAllNotificationsRead, getUnreadCount } = useExpenses()
  const unreadCount = getUnreadCount()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground relative">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-destructive text-destructive-foreground rounded-full text-[10px] font-semibold flex items-center justify-center px-1">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1"
              onClick={markAllNotificationsRead}
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all read
            </Button>
          )}
        </div>

        <div className="max-h-[360px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">No notifications</div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  "px-4 py-3 border-b border-border last:border-0 cursor-pointer transition-colors hover:bg-muted/50",
                  !notification.read && "bg-primary/5",
                )}
                onClick={() => markNotificationRead(notification.id)}
              >
                <div className="flex gap-3">
                  <div
                    className={cn(
                      "mt-0.5 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                      notification.type === "overdue" && "bg-destructive/10",
                      notification.type === "due_soon" && "bg-amber-500/10",
                      notification.type === "monthly_summary" && "bg-primary/10",
                    )}
                  >
                    <NotificationIcon type={notification.type} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn("text-sm leading-tight", !notification.read && "font-medium")}>
                        {notification.title}
                      </p>
                      {!notification.read && <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1.5" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notification.message}</p>
                    {notification.dueDate && (
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Due:{" "}
                        {new Date(notification.dueDate).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {notifications.length > 0 && (
          <div className="px-4 py-2 border-t border-border bg-muted/30">
            <p className="text-[11px] text-muted-foreground text-center">
              {notifications.filter((n) => n.type === "due_soon" || n.type === "overdue").length} upcoming payment
              reminders
            </p>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
