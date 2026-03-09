"use client"

import Image from "next/image"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { LayoutName, allLayoutLabels, defaultLayout, layoutIcons } from "@/app/layouts"

import { cn } from "@/lib/utils"

export function SelectLayout({
  defaultValue = defaultLayout,
  onLayoutChange,
  disabled = false,
  layouts = [],
  className = ""
}: {
  defaultValue?: string | undefined
  onLayoutChange?: ((name: LayoutName) => void)
  disabled?: boolean
  layouts: string[]
  className?: string
}) {
  return (
    <Select
      defaultValue={defaultValue}
      onValueChange={(name) => { onLayoutChange?.(name as LayoutName) }}
      disabled={disabled}
    >
      <SelectTrigger className={cn(
        "flex-grow h-14 backdrop-blur-md bg-white/40 border-white/20 text-[var(--text-main)] rounded-[var(--radius-md)] hover:bg-white/60 transition-colors px-6",
        className
      )}>
        <SelectValue className="text-sm md:text-base font-bold font-[var(--font-main)]" placeholder="选择画幅布局" />
      </SelectTrigger>
      <SelectContent>
        {layouts.map(key =>
          <SelectItem key={key} value={key} className="w-full">
            <div className="space-x-6 flex flex-row items-center justify-between">
              <div className="flex">{
                (allLayoutLabels as any)[key]
              }</div>

              {(layoutIcons as any)[key]
                ? <Image
                  className="rounded-sm opacity-75"
                  src={(layoutIcons as any)[key]}
                  width={20}
                  height={18}
                  style={{ width: 'auto' }}
                  alt={key}
                /> : null}
            </div>
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  )
}