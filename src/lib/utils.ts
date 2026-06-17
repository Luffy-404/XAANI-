import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const ORDER_STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400",
  processing: "bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-400",
  shipped: "bg-violet-100 text-violet-800 dark:bg-violet-500/15 dark:text-violet-400",
  delivered: "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-400",
}

export function orderStatusStyles(status: string) {
  return ORDER_STATUS_STYLES[status?.toLowerCase()] ?? "bg-secondary text-secondary-foreground"
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0)
}
