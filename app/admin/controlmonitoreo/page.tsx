"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Monitor, Search, RefreshCw, CheckSquare, Square,
  Clock, CheckCircle2, Ban, PlayCircle, Wrench,
  MapPin, Users, AlertTriangle, Calendar, ChevronDown,
  ChevronRight, CalendarPlus, Send, X, Info
} from "lucide-react"
import { logAction } from "@/lib/logging"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const API_MANT    = "http://localhost:8081/api/mantenimiento"
const API_MON     = "http://localhost:8081/api/monitoreo"

// ── Configuración de estados ─────────────────────────────────────────────────
const ESTADO_CFG: Record<string, { label: string; color: string; icon: any }> = {
  PENDIENTE:   { label: "Pendiente",   icon: Clock,       color: "bg-amber-400/10 text-amber-600 border-amber-400/25" },
  EN_PROGRESO: { label: "En Progreso", icon: PlayCircle,  color: "bg-blue-400/10  text-blue-600  border-blue-400/25" },
  COMPLETADO:  { label: "Completado",  icon: CheckCircle2,color: "bg-emerald-400/10 text-emerald-600 border-emerald-400/25" },
  CANCELADO:   { label: "Cancelado",   icon: Ban,         color: "bg-rose-400/10  text-rose-600  border-rose-400/25" },
}

interface Tipo {
  timaId:    number
  timaNombre:string
  timaDescrip?: string
}
interface Progress {
  mtpId:        number | null
  timaId:       number
  mtpCompletado:boolean
  mtpFechaCheck:string | null
}
interface Ampliacion {
  amplId:      number
  mantId:      number
  amplMotivo:  string
  amplFechaNva:string
  amplEstado:  string
  amplFechaCrea:string
  amplResolucion?: string
}
interface Mantenimiento {
  mantId:           number
  mantTitulo:       string
  mantEstado:       string
  parqNombre:       string
  parqId:           number
  mantFechaIni:     string
  mantFechaFin:     string
  mantObservacion?: string
  responsableNombre?:string
  timaIds:          number[] | null
  timaNombres:      string[]
  obreros:          { obrId: number; nombreCompleto: string }[]
}

// ── Componente Panel de Monitoreo de un Mantenimiento ─────────────────────────
function MonitoreoCard({
  item,
  tipos,
  userId,
  onEstadoCambiado,
}: {
  item: Mantenimiento
  tipos: Tipo[]
  userId: number
  onEstadoCambiado: () => void
}) {
  const [progress, setProgress]   = useState<Progress[]>([])
  const [ampliaciones, setAmpliaciones] = useState<Ampliacion[]>([])
  const [expanded, setExpanded]     = useState(false)
  const [showAmpliacion, setShowAmpliacion] = useState(false)
  const [ampMotivo, setAmpMotivo]   = useState("")
  const [ampFecha, setAmpFecha]     = useState("")
  const [savingAmp, setSavingAmp]   = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(false)

  const today = new Date()
  const fechaFin = item.mantFechaFin ? new Date(item.mantFechaFin + "T00:00:00") : null
  const isVencido = fechaFin ? today > fechaFin && item.mantEstado !== "COMPLETADO" : false
  const diasRestantes = fechaFin
    ? Math.ceil((fechaFin.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    : null

  const timaIds: number[] = item.timaIds ?? []

  const fetchProgress = useCallback(async () => {
    if (!expanded) return
    setLoadingProgress(true)
    try {
      const [pRes, aRes] = await Promise.all([
        fetch(`${API_MON}/${item.mantId}/progress`),
        fetch(`${API_MON}/${item.mantId}/ampliaciones`),
      ])
      if (pRes.ok) setProgress(await pRes.json())
      if (aRes.ok) setAmpliaciones(await aRes.json())
    } catch (err) {
      console.error("Error cargando progreso:", err)
    } finally {
      setLoadingProgress(false)
    }
  }, [item.mantId, expanded])

  useEffect(() => {
    fetchProgress()
  }, [fetchProgress])

  const isChecked = (timaId: number) =>
    progress.find(p => p.timaId === timaId)?.mtpCompletado === true

  const totalTipos     = timaIds.length
  const completados    = timaIds.filter(id => isChecked(id)).length
  const pct = totalTipos > 0 ? Math.round((completados / totalTipos) * 100) : 0

  const handleToggle = async (timaId: number) => {
    if (item.mantEstado === "COMPLETADO" || item.mantEstado === "CANCELADO") {
      toast.info("Este mantenimiento ya está " + ESTADO_CFG[item.mantEstado]?.label)
      return
    }
    const wasChecked = isChecked(timaId)
    // Optimistic UI
    setProgress(prev => {
      const exists = prev.find(p => p.timaId === timaId)
      if (exists) return prev.map(p => p.timaId === timaId ? { ...p, mtpCompletado: !wasChecked } : p)
      return [...prev, { mtpId: null, timaId, mtpCompletado: true, mtpFechaCheck: new Date().toISOString() }]
    })
    try {
      const res = await fetch(`${API_MON}/${item.mantId}/progress/${timaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completado: !wasChecked, usuarioId: userId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)

      if (data.estadoActualizado) {
        toast.success("🎉 ¡Todos los tipos completados! Estado actualizado a COMPLETADO")
        onEstadoCambiado()
      } else {
        toast.success(wasChecked ? "Tipo desmarcado" : "Tipo marcado como completado")
      }
      fetchProgress()
    } catch (err: any) {
      toast.error(err.message ?? "Error al actualizar progreso")
      fetchProgress() // revert
    }
  }

  const handleSolicitarAmpliacion = async () => {
    if (!ampMotivo.trim() || !ampFecha) {
      toast.error("Completa el motivo y la nueva fecha límite")
      return
    }
    setSavingAmp(true)
    try {
      const res = await fetch(`${API_MON}/${item.mantId}/ampliaciones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ motivo: ampMotivo, fechaNueva: ampFecha, usuarioId: userId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      toast.success("Solicitud de ampliación enviada exitosamente")
      setAmpMotivo("")
      setAmpFecha("")
      setShowAmpliacion(false)
      fetchProgress()
    } catch (err: any) {
      toast.error(err.message ?? "Error al enviar solicitud")
    } finally {
      setSavingAmp(false)
    }
  }

  const estadoConfig = ESTADO_CFG[item.mantEstado] ?? ESTADO_CFG.PENDIENTE
  const EstadoIcon   = estadoConfig.icon

  return (
    <div className={cn(
      "rounded-3xl border overflow-hidden transition-all duration-300 shadow-sm",
      item.mantEstado === "COMPLETADO" ? "border-emerald-400/30 bg-emerald-500/3" :
      isVencido ? "border-rose-400/30 bg-rose-500/3" :
      "border-border/50 bg-card"
    )}>
      {/* Header */}
      <div
        className="p-5 flex items-start gap-4 cursor-pointer hover:bg-muted/10 transition-colors select-none"
        onClick={() => setExpanded(prev => !prev)}
      >
        {/* Icono */}
        <div className={cn(
          "h-12 w-12 min-w-12 rounded-2xl flex items-center justify-center flex-shrink-0",
          item.mantEstado === "COMPLETADO" ? "bg-emerald-100 dark:bg-emerald-900/20" :
          isVencido ? "bg-rose-100 dark:bg-rose-900/20" : "bg-primary/10"
        )}>
          <Wrench className={cn(
            "h-6 w-6",
            item.mantEstado === "COMPLETADO" ? "text-emerald-600" :
            isVencido ? "text-rose-500" : "text-primary"
          )} />
        </div>

        {/* Info principal */}
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="font-extrabold text-sm text-foreground truncate max-w-[260px]" title={item.mantTitulo}>
              {item.mantTitulo}
            </h3>
            {isVencido && item.mantEstado !== "COMPLETADO" && (
              <Badge className="text-[9px] font-black bg-rose-100 dark:bg-rose-950/30 text-rose-600 border border-rose-200 dark:border-rose-800/30 animate-pulse">
                ⚠ VENCIDO
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3 text-emerald-600" />
              {item.parqNombre || "Sin parque"}
            </span>
            {item.mantFechaFin && (
              <span className={cn(
                "flex items-center gap-1 font-mono font-bold",
                isVencido ? "text-rose-500" : diasRestantes !== null && diasRestantes <= 3 ? "text-amber-500" : "text-muted-foreground"
              )}>
                <Calendar className="h-3 w-3" />
                {isVencido
                  ? `Venció hace ${Math.abs(diasRestantes ?? 0)} día(s)`
                  : diasRestantes === 0 ? "Vence hoy"
                  : diasRestantes !== null && diasRestantes > 0 ? `${diasRestantes} día(s) restantes`
                  : new Date(item.mantFechaFin + "T00:00:00").toLocaleDateString("es-PE")}
              </span>
            )}
          </div>

          {/* Barra de progreso */}
          {totalTipos > 0 && (
            <div className="mt-2.5 space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-muted-foreground font-medium">{completados}/{totalTipos} tipos completados</span>
                <span className={cn(
                  "font-black",
                  pct === 100 ? "text-emerald-600" : pct >= 50 ? "text-blue-500" : "text-muted-foreground"
                )}>{pct}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-700",
                    pct === 100 ? "bg-emerald-500" : pct >= 50 ? "bg-blue-500" : "bg-amber-400"
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Estado Badge + Chevron */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge className={cn("text-[10px] font-black border px-2.5 py-0.5 rounded-full", estadoConfig.color)}>
            <EstadoIcon className="h-3 w-3 mr-1" />
            {estadoConfig.label}
          </Badge>
          <div className={cn("transition-transform duration-300", expanded ? "rotate-90" : "rotate-0")}>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div className="border-t border-border/40 p-5 space-y-5 animate-in fade-in slide-in-from-top-2 duration-200">

          {/* Obreros asignados */}
          {item.obreros && item.obreros.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <Users className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Personal:</span>
              {item.obreros.map(o => (
                <span
                  key={o.obrId}
                  className="text-[10px] font-bold bg-muted/40 border border-border/40 px-2 py-0.5 rounded-full text-foreground"
                >
                  {o.nombreCompleto}
                </span>
              ))}
            </div>
          )}

          {/* Checklist de Tipos */}
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
              <CheckSquare className="h-3.5 w-3.5 text-primary" />
              Avance de Ejecución por Tipo de Actividad
            </h4>

            {timaIds.length === 0 ? (
              <div className="text-xs text-muted-foreground/60 italic bg-muted/10 rounded-2xl p-4 text-center border border-dashed border-border/40">
                Este mantenimiento no tiene tipos de actividad asignados
              </div>
            ) : loadingProgress ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {timaIds.map(id => (
                  <div key={id} className="h-12 rounded-2xl bg-muted/30 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {timaIds.map(timaId => {
                  const tipo       = tipos.find(t => t.timaId === timaId)
                  const checked    = isChecked(timaId)
                  const progEntry  = progress.find(p => p.timaId === timaId)
                  const isDisabled = item.mantEstado === "COMPLETADO" || item.mantEstado === "CANCELADO"

                  return (
                    <button
                      key={timaId}
                      type="button"
                      onClick={() => handleToggle(timaId)}
                      disabled={isDisabled}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-2xl border text-left transition-all w-full",
                        checked
                          ? "bg-emerald-500/8 border-emerald-500/40 dark:border-emerald-700/40"
                          : "border-border/50 bg-muted/10 hover:bg-muted/30 hover:border-border/80",
                        isDisabled && "opacity-60 cursor-not-allowed"
                      )}
                    >
                      <div className={cn(
                        "h-6 w-6 min-w-6 rounded-lg flex items-center justify-center transition-colors",
                        checked ? "bg-emerald-600 text-white" : "bg-muted/50 border border-border/60"
                      )}>
                        {checked
                          ? <CheckSquare className="h-3.5 w-3.5" />
                          : <Square className="h-3.5 w-3.5 text-muted-foreground" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={cn(
                          "text-xs font-bold truncate",
                          checked ? "text-emerald-700 dark:text-emerald-400 line-through" : "text-foreground"
                        )}>
                          {tipo?.timaNombre ?? `Tipo #${timaId}`}
                        </p>
                        {checked && progEntry?.mtpFechaCheck && (
                          <p className="text-[9px] text-emerald-600/70 font-medium font-mono mt-0.5">
                            {new Date(progEntry.mtpFechaCheck).toLocaleString("es-PE")}
                          </p>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Sección: Vencido → Solicitar Ampliación */}
          {isVencido && item.mantEstado !== "COMPLETADO" && (
            <div className="rounded-2xl bg-amber-500/5 border border-amber-500/20 p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-black text-amber-800 dark:text-amber-300">
                      Plazo Vencido — Acción Requerida
                    </p>
                    <p className="text-[10px] text-amber-700/70 dark:text-amber-400/70 mt-0.5">
                      El mantenimiento superó su fecha límite. Solicita una ampliación de plazo.
                    </p>
                  </div>
                </div>
                {!showAmpliacion && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setShowAmpliacion(true)}
                    className="h-8 px-3 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-white flex-shrink-0 gap-1.5"
                  >
                    <CalendarPlus className="h-3.5 w-3.5" />
                    Solicitar
                  </Button>
                )}
              </div>

              {/* Formulario de ampliación */}
              {showAmpliacion && (
                <div className="space-y-3 pt-2 border-t border-amber-500/20 animate-in fade-in duration-200">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-300">
                      Motivo de la Ampliación
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Explica por qué se requiere más tiempo..."
                      value={ampMotivo}
                      onChange={e => setAmpMotivo(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-card border border-amber-300/40 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400/30 resize-none text-foreground"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-300">
                      Nueva Fecha Límite Propuesta
                    </label>
                    <input
                      type="date"
                      min={new Date().toISOString().split("T")[0]}
                      value={ampFecha}
                      onChange={e => setAmpFecha(e.target.value)}
                      className="w-full h-9 px-3 rounded-xl bg-card border border-amber-300/40 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400/30 text-foreground"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={handleSolicitarAmpliacion}
                      disabled={savingAmp}
                      className="flex-1 h-9 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-white gap-1.5"
                    >
                      <Send className="h-3.5 w-3.5" />
                      {savingAmp ? "Enviando..." : "Enviar Solicitud"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setShowAmpliacion(false)}
                      className="h-9 px-3 text-xs rounded-xl"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Historial de ampliaciones */}
              {ampliaciones.length > 0 && (
                <div className="pt-2 border-t border-amber-500/15 space-y-1.5">
                  <p className="text-[9px] font-black uppercase tracking-widest text-amber-700/60">
                    Historial de Solicitudes
                  </p>
                  {ampliaciones.map(a => (
                    <div key={a.amplId} className="flex items-center justify-between text-[10px]">
                      <span className="text-muted-foreground font-mono">
                        Nueva fecha: <b>{new Date(a.amplFechaNva + "T00:00:00").toLocaleDateString("es-PE")}</b>
                      </span>
                      <Badge className={cn(
                        "text-[8px] font-black border px-1.5 py-0 rounded-full",
                        a.amplEstado === "APROBADA" ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400" :
                        a.amplEstado === "RECHAZADA"? "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400" :
                        "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400"
                      )}>
                        {a.amplEstado}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Página Principal ──────────────────────────────────────────────────────────
export default function ControlMonitoreoPage() {
  const { user } = useAuth()

  const [mantenimientos, setMantenimientos] = useState<Mantenimiento[]>([])
  const [tipos, setTipos] = useState<Tipo[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterEstado, setFilterEstado] = useState("TODOS")

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [mRes, tRes] = await Promise.all([
        fetch(API_MANT),
        fetch(`${API_MANT}/tipos-mantenimiento`),
      ])
      const mData = mRes.ok ? await mRes.json() : []
      const tData = tRes.ok ? await tRes.json() : []
      setMantenimientos(mData)
      setTipos(tData.map((t: any) => ({ timaId: t.timaId, timaNombre: t.timaNombre, timaDescrip: t.timaDescrip })))
    } catch (err) {
      toast.error("Error al cargar datos")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const filtered = mantenimientos.filter(m => {
    const term = search.toLowerCase().trim()
    const matchSearch = !term ||
      m.mantTitulo.toLowerCase().includes(term) ||
      (m.parqNombre ?? "").toLowerCase().includes(term)
    const matchEstado = filterEstado === "TODOS" || m.mantEstado === filterEstado
    return matchSearch && matchEstado
  })

  // Stats
  const total      = mantenimientos.length
  const completados= mantenimientos.filter(m => m.mantEstado === "COMPLETADO").length
  const pendientes = mantenimientos.filter(m => m.mantEstado === "PENDIENTE").length
  const enProg     = mantenimientos.filter(m => m.mantEstado === "EN_PROGRESO").length
  const today = new Date()
  const vencidos   = mantenimientos.filter(m => {
    if (!m.mantFechaFin || m.mantEstado === "COMPLETADO" || m.mantEstado === "CANCELADO") return false
    return new Date(m.mantFechaFin + "T00:00:00") < today
  }).length

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black flex items-center gap-3">
            <Monitor className="h-8 w-8 text-primary" />
            Control y Monitoreo
          </h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            Registra el avance en tiempo real de los mantenimientos programados
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
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Total",       value: total,      color: "bg-primary/10 text-primary", border: "border-primary/20" },
          { label: "Completados", value: completados, color: "bg-emerald-500/10 text-emerald-600", border: "border-emerald-300/30" },
          { label: "En Progreso", value: enProg,      color: "bg-blue-500/10 text-blue-600",    border: "border-blue-300/30" },
          { label: "Pendientes",  value: pendientes,  color: "bg-amber-500/10 text-amber-600",  border: "border-amber-300/30"},
          { label: "Vencidos",    value: vencidos,    color: "bg-rose-500/10 text-rose-600",    border: "border-rose-300/30" },
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
            placeholder="Buscar por título o parque..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 h-11 rounded-2xl bg-card border-border/50 w-full"
          />
        </div>
        <select
          value={filterEstado}
          onChange={e => setFilterEstado(e.target.value)}
          className="h-11 px-4 rounded-2xl border border-border/50 bg-card text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
        >
          <option value="TODOS">Todos los estados</option>
          <option value="PENDIENTE">Pendiente</option>
          <option value="EN_PROGRESO">En Progreso</option>
          <option value="COMPLETADO">Completado</option>
          <option value="CANCELADO">Cancelado</option>
        </select>
        {(search || filterEstado !== "TODOS") && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => { setSearch(""); setFilterEstado("TODOS") }}
            className="h-11 px-4 rounded-2xl text-xs font-bold"
          >
            Limpiar
          </Button>
        )}
        <Badge variant="secondary" className="h-11 px-4 rounded-2xl font-bold border border-border/40 flex items-center justify-center text-xs whitespace-nowrap">
          {filtered.length} de {total}
        </Badge>
      </div>

      {/* Lista de Mantenimientos */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-28 rounded-3xl bg-muted/30 animate-pulse border border-border/30" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <Monitor className="h-16 w-16 text-muted-foreground/30 mx-auto" />
          <p className="text-muted-foreground font-bold">No hay mantenimientos que coincidan</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(item => (
            <MonitoreoCard
              key={item.mantId}
              item={item}
              tipos={tipos}
              userId={Number(user?.id ?? 0)}
              onEstadoCambiado={fetchData}
            />
          ))}
        </div>
      )}
    </div>
  )
}