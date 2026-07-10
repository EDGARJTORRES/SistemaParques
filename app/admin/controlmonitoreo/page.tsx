"use client"

import { useState, useEffect } from "react"
import {
  Search,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  TreePine,
  RefreshCw,
  Monitor,
  Layers,
  Building2,
  ChevronDown,
  Wrench,
} from "lucide-react"
import { logAction } from "@/lib/logging"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const API_BASE = "http://localhost:8081/api"



export default function ParqueServiciosPage() {
  const { user } = useAuth()


  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* ── Header ── */}
      <div>
        <h4 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-3">
          <Monitor className="h-6 w-6 text-primary" />
           Control y Monitoreo de Mantenimientos programados
        </h4>
        <p className="text-muted-foreground mt-1 font-medium">
          Monitorea la ejecución y el cumplimiento de los mantenimientos programados.
        </p>
      </div>

      {/* ── Layout 2 columnas ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6 items-start">

        {/* ══════════════════════════
            PANEL IZQUIERDO
        ══════════════════════════ */}
        <div className="space-y-4">

         aqui se marcaran con check el cumpliminiento de los mantenimientos
        </div>

      </div>
    </div>
  )
}