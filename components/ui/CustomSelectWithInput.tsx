"use client"

import * as React from "react"
import { Info } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface CustomSelectWithInputProps {
  label: string
  tooltipContent: React.ReactNode
  value: string
  onChange: (newValue: string) => void
  options: { value: string; label: string }[]
}

export function CustomSelectWithInput({
  label,
  tooltipContent,
  value,
  onChange,
  options,
}: CustomSelectWithInputProps) {
  const isCustomValue = !options.some(option => option.value === value)
  const [showCustomInput, setShowCustomInput] = React.useState(isCustomValue)

  const handleSelectChange = (selectValue: string) => {
    if (selectValue === "custom") {
      setShowCustomInput(true)
      // Do not call onChange here, wait for user input
    } else {
      setShowCustomInput(false)
      onChange(selectValue)
    }
  }

  const selectValue = isCustomValue ? "custom" : value

  React.useEffect(() => {
    setShowCustomInput(isCustomValue)
  }, [isCustomValue])

  return (
    <div className="space-y-2">
      <div className="flex items-center">
        <Label>{label}</Label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" className="ml-2">
                <Info className="h-4 w-4 text-muted-foreground" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{tooltipContent}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <Select onValueChange={handleSelectChange} value={selectValue}>
        <SelectTrigger>
          <SelectValue placeholder="Select a value" />
        </SelectTrigger>
        <SelectContent>
          {options.map(option => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
          <SelectItem value="custom">Custom</SelectItem>
        </SelectContent>
      </Select>
      {showCustomInput && (
        <Input
          className="mt-2"
          value={isCustomValue ? value : ""}
          onChange={e => onChange(e.target.value)}
          placeholder="Enter custom value"
        />
      )}
    </div>
  )
}