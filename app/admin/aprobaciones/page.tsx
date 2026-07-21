"use client"

import { useState, useEffect, useCallback } from "react"
import {
  ShieldCheck, Search, RefreshCw, CheckCircle2, Ban,
  Clock, MapPin, Calendar, AlertTriangle, FileText,
  ChevronDown, X, Info, UserCheck
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const API_MON = "http://localhost:8081/api/monitoreo"

interface Solicitud {
  amplId:        number
  mantId:        number
  amplMotivo:    string
  amplFechaNva:  string
  amplEstado:    string
  amplFechaCrea: string
  amplResolucion?: string
  mantTitulo?:   string
  mantEstado?:   string
  mantFechaFin?: string
  parqId?:       number
  parqNombre?:   string
}

// ── Tarjeta de solicitud pendiente ─────────────────────────────────────────────
function SolicitudCard({
  item,
  userId,
  onResolved,
}: {
  item: Solicitud
  userId: number
  onResolved: () => void
}) {
  const [expanded, setExpanded]   = useState(false)
  const [resolucion, setResolucion] = useState("")
  const [showRechazo, setShowRechazo] = useState(false)
  const [saving, setSaving]       = useState(false)

  const fechaNva = item.amplFechaNva
    ? new Date(item.amplFechaNva + "T00:00:00").toLocaleDateString("es-PE")
    : "—"
  const fechaCrea = item.amplFechaCrea
    ? new Date(item.amplFechaCrea).toLocaleString("es-PE")
    : "—"

    const handleResolver = async (estado: "APROBADO" | "RECHAZADO") => {
    if (estado === "RECHAZADO" && !resolucion.trim()) {
      toast.error("Indica el motivo de rechazo")
      return
    }
    setSaving(true)
    try {
      const accion = estado === "APROBADO" ? "APROBAR" : "RECHAZAR"
      const res = await fetch(`${API_MON}/ampliaciones/${item.amplId}/evaluar`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accion,
          resolucion: resolucion.trim() || (estado === "APROBADO" ? "Ampliación aprobada por subgerencia" : ""),
          evaluadorId: userId,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      toast.success(
        estado === "APROBADO"
          ? "✅ Ampliación aprobada. Plazo extendido."
          : "Solicitud rechazada."
      )
      onResolved()
    } catch (err: any) {
      toast.error(err.message ?? "Error al resolver la solicitud")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-3xl border border-amber-400/30 bg-amber-500/3 shadow-sm overflow-hidden">
      {/* Header */}
      <div
        className="p-5 flex items-start gap-4 cursor-pointer hover:bg-muted/10 transition-colors select-none"
        onClick={() => setExpanded(prev => !prev)}
      >
        <div className="h-12 w-12 min-w-12 rounded-2xl bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center flex-shrink-0">
          <Clock className="h-6 w-6 text-amber-500" />
        </div>

        <div className="flex-1 min-w-0 pr-2">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="font-extrabold text-sm text-foreground truncate max-w-[280px]" title={item.mantTitulo}>
              {item.mantTitulo || `Mantenimiento #${item.mantId}`}
            </h3>
            <Badge className="text-[9px] font-black bg-amber-100 dark:bg-amber-950/30 text-amber-600 border border-amber-200 dark:border-amber-800/30 animate-pulse">
              PENDIENTE
            </Badge>
          </div>

          <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3 text-emerald-600" />
              {item.parqNombre || "Sin parque"}
            </span>
            <span className="flex items-center gap-1 font-mono font-bold text-amber-500">
              <Calendar className="h-3 w-3" />
              Nueva fecha: {fechaNva}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <div className={cn("transition-transform duration-300", expanded ? "rotate-180" : "rotate-0")}>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* Cuerpo expandido */}
      {expanded && (
        <div className="border-t border-border/40 p-5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
            <div className="rounded-2xl bg-muted/20 border border-border/40 p-3">
              <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Solicitado el</p>
              <p className="font-mono font-bold text-foreground">{fechaCrea}</p>
            </div>
            <div className="rounded-2xl bg-muted/20 border border-border/40 p-3">
              <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Fecha fin actual</p>
              <p className="font-mono font-bold text-foreground">
                {item.mantFechaFin
                  ? new Date(item.mantFechaFin + "T00:00:00").toLocaleDateString("es-PE")
                  : "—"}
              </p>
            </div>
          </div>

          {/* Motivo */}
          <div className="rounded-2xl bg-amber-500/5 border border-amber-500/20 p-3">
            <p className="text-[9px] font-black uppercase tracking-widest text-amber-700/70 dark:text-amber-400/70 mb-1.5 flex items-center gap-1.5">
              <FileText className="h-3 w-3" />
              Motivo de la solicitud
            </p>
            <p className="text-xs text-foreground leading-relaxed">{item.amplMotivo}</p>
          </div>

          {/* Nota de resolución (rechazo) */}
          {showRechazo && (
            <div className="space-y-1.5 animate-in fade-in duration-200">
              <label className="text-[10px] font-black uppercase tracking-wider text-rose-600">
                Motivo de rechazo <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                placeholder="Explica por qué se rechaza la ampliación..."
                value={resolucion}
                onChange={e => setResolucion(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-card border border-rose-300/40 text-xs focus:outline-none focus:ring-2 focus:ring-rose-400/30 resize-none text-foreground"
              />
            </div>
          )}

          {/* Acciones */}
          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <Button
              type="button"
              onClick={() => handleResolver("APROBADO")}
              disabled={saving}
              className="flex-1 h-10 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
            >
              <CheckCircle2 className="h-4 w-4" />
              {saving ? "Procesando..." : "Aprobar Ampliación"}
            </Button>
            {!showRechazo ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowRechazo(true)}
                disabled={saving}
                className="flex-1 h-10 text-xs font-bold rounded-xl border-rose-300/50 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 gap-1.5"
              >
                <Ban className="h-4 w-4" />
                Rechazar
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => handleResolver("RECHAZADO")}
                disabled={saving}
                className="flex-1 h-10 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white gap-1.5"
              >
                <Ban className="h-4 w-4" />
                {saving ? "Procesando..." : "Confirmar Rechazo"}
              </Button>
            )}
            {showRechazo && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => { setShowRechazo(false); setResolucion("") }}
                className="h-10 px-3 text-xs rounded-xl"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Página Principal ───────────────────────────────────────────────────────────
export default function AprobacionesPage() {
  const { user } = useAuth()

  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState("")
  const [resueltas, setResueltas]   = useState<Solicitud[]>([])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [pRes, rRes] = await Promise.all([
        fetch(`${API_MON}/ampliaciones/pendientes`),
        fetch(`${API_MON}/ampliaciones/resueltas`),
      ])
      const pData = pRes.ok ? await pRes.json() : []
      const rData = rRes.ok ? await rRes.json() : []
      setSolicitudes(pData)
      setResueltas(rData)
    } catch (err) {
      toast.error("Error al cargar las solicitudes")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const filtered = solicitudes.filter(s => {
    const term = search.toLowerCase().trim()
    if (!term) return true
    return (
      (s.mantTitulo ?? "").toLowerCase().includes(term) ||
      (s.parqNombre ?? "").toLowerCase().includes(term) ||
      (s.amplMotivo ?? "").toLowerCase().includes(term)
    )
  })

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-black flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-primary" />
            Aprobación de Ampliaciones
          </h3>
          <p className="text-muted-foreground text-sm mt-0.5">
            Revisa y resuelve las solicitudes de ampliación de plazo de mantenimientos vencidos
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={fetchData}
          className="gap-2 rounded-xl h-10 font-bold self-start sm:self-auto"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          Actualizar
        </Button>
      </div>


      {/* Estadísticas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: "Pendientes", value: solicitudes.length, color: "bg-amber-500/10 text-amber-600", border: "border-amber-300/30" },
          { label: "Resueltas",  value: resueltas.length,  color: "bg-emerald-500/10 text-emerald-600", border: "border-emerald-300/30" },
        ].map(stat => (
          <div key={stat.label} className={cn(
            "rounded-2xl p-4 border flex flex-col items-center text-center",
            stat.color, stat.border
          )}>
            <span className="text-2xl font-black">{stat.value}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider mt-0.5 opacity-80">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 bg-muted/20 p-4 rounded-3xl border border-border/50">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título, parque o motivo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 h-11 rounded-2xl bg-card border-border/50 w-full"
          />
        </div>
        <Badge variant="secondary" className="h-11 px-4 rounded-2xl font-bold border border-border/40 flex items-center justify-center text-xs whitespace-nowrap">
          {filtered.length} pendiente(s)
        </Badge>
      </div>

      {/* Lista de pendientes */}
      <div>
        <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
          Solicitudes por Resolver
        </h4>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="h-24 rounded-3xl bg-muted/30 animate-pulse border border-border/30" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 space-y-3 rounded-3xl border border-dashed border-border/40 bg-muted/5">
            <ShieldCheck className="h-16 w-16 text-emerald-500/30 mx-auto" />
            <p className="text-muted-foreground font-bold">No hay solicitudes pendientes 🎉</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(item => (
              <SolicitudCard
                key={item.amplId}
                item={item}
                userId={Number(user?.id ?? 0)}
                onResolved={fetchData}
              />
            ))}
          </div>
        )}
      </div>

      {/* Historial de resueltas */}
      {resueltas.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5" />
            Historial de Resueltas
          </h4>
          <div className="space-y-2">
            {resueltas.map(a => (
              <div key={a.amplId} className="rounded-2xl border border-border/40 bg-card p-4 flex items-start gap-3">
                <div className={cn(
                  "h-9 w-9 min-w-9 rounded-xl flex items-center justify-center flex-shrink-0",
                  a.amplEstado === "APROBADO" ? "bg-emerald-100 dark:bg-emerald-900/20" : "bg-rose-100 dark:bg-rose-900/20"
                )}>
                  {a.amplEstado === "APROBADO"
                    ? <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    : <Ban className="h-5 w-5 text-rose-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-bold text-foreground truncate">
                      {a.mantTitulo || `Mantenimiento #${a.mantId}`}
                    </p>
                    <Badge className={cn(
                      "text-[8px] font-black border px-1.5 py-0 rounded-full",
                      a.amplEstado === "APROBADO"
                        ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400"
                        : "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400"
                    )}>
                      {a.amplEstado}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                    Nueva fecha: <b className="font-mono">{a.amplFechaNva ? new Date(a.amplFechaNva + "T00:00:00").toLocaleDateString("es-PE") : "—"}</b>
                    {a.amplResolucion ? ` · ${a.amplResolucion}` : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
