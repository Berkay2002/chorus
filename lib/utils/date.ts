import { formatDistanceToNow, format } from 'date-fns'

export function formatMessageTime(date: string | Date): string {
  const messageDate = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60)

  // If less than 24 hours ago, show relative time
  if (diffInHours < 24) {
    return formatDistanceToNow(messageDate, { addSuffix: true })
  }

  // If this year, show month and day
  if (messageDate.getFullYear() === now.getFullYear()) {
    return format(messageDate, 'MMM d, h:mm a')
  }

  // Otherwise show full date
  return format(messageDate, 'MMM d, yyyy, h:mm a')
}

export function formatTimestamp(date: string | Date): string {
  const messageDate = typeof date === 'string' ? new Date(date) : date
  return format(messageDate, 'h:mm a')
}
