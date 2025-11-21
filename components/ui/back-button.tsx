"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

interface BackButtonProps {
  href?: string
  label?: string
  variant?: "default" | "outline" | "ghost"
}

export function BackButton({ href = "/", label = "Back", variant = "ghost" }: BackButtonProps) {
  const router = useRouter()

  const handleClick = () => {
    if (href) {
      router.push(href)
    } else {
      router.back()
    }
  }

  return (
    <Button variant={variant} onClick={handleClick} className="gap-2">
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Button>
  )
}
