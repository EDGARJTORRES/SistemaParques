"use client"

import React, { useState, useEffect, useMemo } from "react"
import {
  Sparkles,
  CalendarDays,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import Highcharts from "highcharts"
import HighchartsReact from "highcharts-react-official"

// ─── Types ────────────────────────────────────────────────────────────────────




interface UserRaw {
  idUsuario: number
  idRol: number
  nombreRol: string
  activo: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseMonto(amount: string | number): number {
  if (typeof amount === "number") return amount
  const n = parseFloat(String(amount).replace(/[^\d.-]/g, ""))
  return isNaN(n) ? 0 : n
}

function formatCurrency(n: number) {
  return `S/ ${n.toLocaleString("es-PE", { minimumFractionDigits: 2 })}`
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  } catch {
    return dateStr
  }
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return "Buenos días"
  if (h < 18) return "Buenas tardes"
  return "Buenas noches"
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { user } = useAuth()
  const router = useRouter()

  const [users, setUsers] = useState<UserRaw[]>([])
  const [isLoading, setIsLoading] = useState(true)


  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-7 animate-in fade-in slide-in-from-bottom-3 duration-500">

      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-2xl font-black text-foreground flex items-center gap-2 flex-wrap">
            <Sparkles className="h-6 w-6 text-primary flex-shrink-0" />
            {getGreeting()}, {user?.nombre ?? "Admin"} 👋
          </h4>
          <p className="text-muted-foreground text-sm mt-1">
            Aquí está el resumen de{" "}
            <span className="font-bold text-foreground">SisParques</span> al día de hoy.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-card border border-border rounded-2xl px-5 py-3 shadow-sm self-start sm:self-auto">
          <CalendarDays className="h-5 w-5 text-primary" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Hoy</p>
            <p className="text-sm font-bold text-foreground">
              {new Date().toLocaleDateString("es-PE", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
