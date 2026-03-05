import { ReactNode } from "react"
import { cn } from "@/lib/utils"

export const Field = ({ className, children }: {
  className?: string
  children: ReactNode
}) => {
  return (
    <div className={cn("flex flex-col space-y-3", className)}>{children}</div>
  )
}