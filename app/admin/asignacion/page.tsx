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

interface Parque {
  parqId: number
  parqNombre: string
}

interface Servicio {
  servId: number
  servNombre: string
  servEstado: string
}

interface ParqueServicio {
  paseId: number
  parqId: number
  parqNombre: string
  servId: number
  servNombre: string
  paseEstado: string
}

export default function ParqueServiciosPage() {
  const { user } = useAuth()

  const [parques, setParques] = useState<Parque[]>([])
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [parqueSeleccionado, setParqueSeleccionado] = useState("")
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState<number[]>([])
  const [relaciones, setRelaciones] = useState<ParqueServicio[]>([])
  const [loadingRelaciones, setLoadingRelaciones] = useState(false)
  const [loadingAsignar, setLoadingAsignar] = useState(false)
  const [search, setSearch] = useState("")
  const [filterEstado, setFilterEstado] = useState<"all" | "A" | "I">("all")

  useEffect(() => { loadParques(); loadServicios() }, [])
  useEffect(() => {
    if (parqueSeleccionado) loadParqueServicios(Number(parqueSeleccionado))
    else setRelaciones([])
  }, [parqueSeleccionado])

  const loadParques = async () => {
    try {
      const res = await fetch(`${API_BASE}/parques`)
      if (res.ok) setParques(await res.json())
      else toast.error("Error al cargar parques")
    } catch { toast.error("Error de conexión al cargar parques") }
  }

  const loadServicios = async () => {
    try {
      const res = await fetch(`${API_BASE}/servicios`)
      if (res.ok) {
        const data: Servicio[] = await res.json()
        setServicios(data.filter((s) => s.servEstado === "A"))
      } else toast.error("Error al cargar servicios")
    } catch { toast.error("Error de conexión al cargar servicios") }
  }

  const loadParqueServicios = async (parqId: number) => {
    setLoadingRelaciones(true)
    try {
      const res = await fetch(`${API_BASE}/parque-servicios/parque/${parqId}`)
      if (res.ok) setRelaciones(await res.json())
      else { const err = await res.json().catch(() => ({})); toast.error(err.message || "Error al cargar servicios") }
    } catch { toast.error("Error de conexión al cargar servicios del parque") }
    finally { setLoadingRelaciones(false) }
  }

  const handleAsignar = async () => {
    if (!parqueSeleccionado) { toast.warning("Seleccione un parque"); return }
    if (serviciosSeleccionados.length === 0) { toast.warning("Seleccione al menos un servicio"); return }

    setLoadingAsignar(true)
    let errores = 0

    for (const servId of serviciosSeleccionados) {
      try {
        const res = await fetch(`${API_BASE}/parque-servicios`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ parqId: Number(parqueSeleccionado), servId }),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          toast.error(err.message || `Error al asignar servicio ID ${servId}`)
          errores++
        }
      } catch { toast.error(`Error de conexión al asignar servicio ID ${servId}`); errores++ }
    }

    if (errores === 0) {
      const parqNombre = parques.find((p) => p.parqId === Number(parqueSeleccionado))?.parqNombre ?? ""
      await logAction("Asignación", "Parque-Servicios",
        `${serviciosSeleccionados.length} servicio(s) asignado(s) al parque: ${parqNombre}`, user?.id)
      toast.success(serviciosSeleccionados.length === 1
        ? "Servicio asignado correctamente"
        : `${serviciosSeleccionados.length} servicios asignados correctamente`)
    }

    setServiciosSeleccionados([])
    setLoadingAsignar(false)
    loadParqueServicios(Number(parqueSeleccionado))
  }

  const handleToggleEstado = async (item: ParqueServicio) => {
    const isActive = item.paseEstado === "A"
    const url = isActive
      ? `${API_BASE}/parque-servicios/${item.paseId}`
      : `${API_BASE}/parque-servicios/${item.paseId}/reactivar`
    try {
      const res = await fetch(url, { method: isActive ? "DELETE" : "PATCH" })
      if (res.ok) {
        const accion = isActive ? "Desasignación" : "Reactivación"
        await logAction(accion, "Parque-Servicios",
          `Servicio "${item.servNombre}" ${accion.toLowerCase()} en parque "${item.parqNombre}"`, user?.id)
        toast.success(isActive ? "Servicio desasignado" : "Servicio reactivado")
        loadParqueServicios(Number(parqueSeleccionado))
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.message || "Error al cambiar el estado")
      }
    } catch { toast.error("Error de conexión") }
  }

  const toggleServicio = (servId: number) =>
    setServiciosSeleccionados((prev) =>
      prev.includes(servId) ? prev.filter((id) => id !== servId) : [...prev, servId])

  const idsAsignadosActivos = relaciones.filter((r) => r.paseEstado === "A").map((r) => r.servId)
  const parqueActual = parques.find((p) => p.parqId === Number(parqueSeleccionado))
  const totalActivos = relaciones.filter((r) => r.paseEstado === "A").length
  const totalInactivos = relaciones.filter((r) => r.paseEstado === "I").length

  const filtered = relaciones.filter((r) => {
    const matchSearch = r.servNombre.toLowerCase().includes(search.toLowerCase())
    const matchEstado = filterEstado === "all" || r.paseEstado === filterEstado
    return matchSearch && matchEstado
  })

  const initials = (name: string) =>
    name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* ── Header ── */}
      <div>
        <h4 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-3">
          <Layers className="h-6 w-6 text-primary" />
          Asignación de Servicios a Parques
        </h4>
        <p className="text-muted-foreground mt-1 font-medium">
          Selecciona un parque y gestiona los servicios que tiene asignados.
        </p>
      </div>

      {/* ── Layout 2 columnas ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6 items-start">

        {/* ══════════════════════════
            PANEL IZQUIERDO
        ══════════════════════════ */}
        <div className="space-y-4">

          {/* Selector de parque */}
          <div className="rounded-2xl bg-card shadow-md dark:border border-0 p-5 space-y-4">
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5" /> Seleccionar Parque
            </p>

            <div className="relative">
              <select
                className="w-full h-12 rounded-xl border border-input bg-background px-4 pr-10 text-sm font-semibold appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                value={parqueSeleccionado}
                onChange={(e) => { setParqueSeleccionado(e.target.value); setServiciosSeleccionados([]) }}
              >
                <option value="">Seleccione un parque...</option>
                {parques.map((p) => (
                  <option key={p.parqId} value={p.parqId}>{p.parqNombre}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>

            {/* Banner parque seleccionado */}
            {parqueActual && (
              <div className="rounded-xl bg-primary/5 border border-primary/10 p-4 flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-primary flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                  {initials(parqueActual.parqNombre)}
                </div>
                <div className="min-w-0">
                  <p className="font-black text-sm text-foreground truncate">{parqueActual.parqNombre}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-bold text-emerald-500">{totalActivos} activo{totalActivos !== 1 ? "s" : ""}</span>
                    {totalInactivos > 0 && (
                      <span className="text-xs font-bold text-rose-400">· {totalInactivos} inactivo{totalInactivos !== 1 ? "s" : ""}</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Asignar servicios */}
          {parqueSeleccionado && (
            <div className="rounded-2xl bg-card shadow-md dark:border border-0 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Plus className="h-3.5 w-3.5" /> Asignar Nuevos
                </p>
                {serviciosSeleccionados.length > 0 && (
                  <Badge className="bg-primary/10 text-primary border border-primary/20 font-black text-[10px] px-2">
                    {serviciosSeleccionados.length} sel.
                  </Badge>
                )}
              </div>

              {servicios.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No hay servicios activos disponibles.</p>
              ) : (
                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {servicios.map((s) => {
                    const yaAsignado = idsAsignadosActivos.includes(s.servId)
                    const seleccionado = serviciosSeleccionados.includes(s.servId)
                    return (
                      <button
                        key={s.servId}
                        type="button"
                        disabled={yaAsignado}
                        onClick={() => toggleServicio(s.servId)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-3 rounded-xl border text-sm font-semibold text-left transition-all",
                          yaAsignado
                            ? "opacity-40 cursor-not-allowed border-border/20 bg-muted/10"
                            : seleccionado
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border/40 bg-background hover:border-primary/40 hover:bg-primary/5"
                        )}
                      >
                        <div className={cn(
                          "h-4 w-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all",
                          seleccionado && !yaAsignado ? "bg-primary border-primary" : "border-border/60"
                        )}>
                          {(seleccionado || yaAsignado) && (
                            <CheckCircle2 className={cn("h-2.5 w-2.5",
                              seleccionado && !yaAsignado ? "text-white" : "text-muted-foreground")} />
                          )}
                        </div>
                        <span className="flex-1 truncate">{s.servNombre}</span>
                        {yaAsignado && (
                          <span className="text-[10px] font-black text-muted-foreground">✓</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}

              <Button
                onClick={handleAsignar}
                disabled={serviciosSeleccionados.length === 0 || loadingAsignar}
                className="w-full rounded-xl h-11 font-bold gap-2"
              >
                {loadingAsignar
                  ? <><RefreshCw className="h-4 w-4 animate-spin" /> Asignando...</>
                  : <><Plus className="h-4 w-4" />
                    {serviciosSeleccionados.length > 0
                      ? `Asignar ${serviciosSeleccionados.length} servicio${serviciosSeleccionados.length > 1 ? "s" : ""}`
                      : "Asignar"
                    }</>
                }
              </Button>
            </div>
          )}
        </div>

        {/* ══════════════════════════
            PANEL DERECHO — TARJETAS
        ══════════════════════════ */}
        <div className="space-y-4">
          {!parqueSeleccionado ? (
            <div className="rounded-2xl bg-card shadow-md dark:border border-0 flex flex-col items-center justify-center py-24 text-center px-8">
              <div className="h-20 w-20 rounded-3xl bg-muted/40 flex items-center justify-center mb-5">
                <TreePine className="h-10 w-10 text-muted-foreground/25" />
              </div>
              <p className="font-black text-base text-muted-foreground">Ningún parque seleccionado</p>
              <p className="text-sm text-muted-foreground/50 mt-1.5 max-w-xs">
                Selecciona un parque para ver y gestionar sus servicios asignados.
              </p>
            </div>
          ) : (
            <>
              {/* Barra filtros */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex gap-1 p-1 rounded-xl bg-muted/40 border border-border/30">
                  {(["all", "A", "I"] as const).map((val) => (
                    <button
                      key={val}
                      onClick={() => setFilterEstado(val)}
                      className={cn(
                        "px-3 py-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap",
                        filterEstado === val
                          ? "bg-card text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {val === "all"  
                        ? `Todos (${relaciones.length})`
                        : val === "A"
                        ? `Activos (${totalActivos})`
                        : `Inactivos (${totalInactivos})`}
                    </button>
                  ))}
                </div>
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Buscar servicio..."
                    className="pl-9 h-13 rounded-xl bg-card border-border/50 text-sm"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>

              {/* Cards */}
              {loadingRelaciones ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="rounded-xl bg-card border border-border/30 h-48 animate-pulse" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="rounded-xl bg-card shadow-sm dark:border border-0 flex flex-col items-center justify-center py-20 text-center px-8">
                  <div className="h-12 w-12 rounded-xl bg-muted/40 flex items-center justify-center mb-3">
                    <Layers className="h-6 w-6 text-muted-foreground/30" />
                  </div>
                  <p className="font-bold text-sm text-muted-foreground">
                    {search || filterEstado !== "all"
                      ? "Sin resultados para el filtro aplicado."
                      : "Este parque no tiene servicios asignados aún."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-3">
                  {filtered.map((item) => (
                    <div
                      key={item.paseId}
                      className={cn(
                        "group rounded-xl bg-card border transition-all duration-200",
                        item.paseEstado === "A"
                          ? "border-border/10 "
                          : "border-border/10"
                      )}
                    >
                      {/* Franja de color superior */}
                      <div className={cn(
                        "h-1 rounded-t-xl",
                        item.paseEstado === "A" ? "bg-primary/30" : "bg-muted/50"
                      )} />

                      <div className="p-4 flex items-center gap-4 py-5">
                        {/* Ícono */}
                        <div className={cn(
                          "h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors",
                          item.paseEstado === "A"
                            ? "bg-primary/10 text-primary group-hover:bg-primary/15"
                            : "bg-muted/40 text-muted-foreground"
                        )}>
                          <Wrench className="h-5 w-5" />
                        </div>

                        {/* Texto */}
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-sm text-foreground leading-tight truncate">
                            {item.servNombre}
                          </p>
                          {item.paseEstado === "A" ? (
                            <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-black text-emerald-500">
                              <CheckCircle2 className="h-3 w-3" /> Activo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-black text-rose-400">
                              <XCircle className="h-3 w-3" /> Inactivo
                            </span>
                          )}
                        </div>

                        {/* Botón acción */}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button
                              className={cn(
                                "flex-shrink-0 h-8 w-8 rounded-xl flex items-center justify-center border transition-all",
                                item.paseEstado === "A"
                                  ? "border-rose-400/20 text-rose-400 hover:bg-rose-500/10 hover:border-rose-400/40"
                                  : "border-emerald-400/20 text-emerald-500 hover:bg-emerald-500/10 hover:border-emerald-400/40"
                              )}
                            >
                              {item.paseEstado === "A"
                                ? <Trash2 className="h-3.5 w-3.5" />
                                : <CheckCircle2 className="h-3.5 w-3.5" />}
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="rounded-3xl">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="font-black text-xl">
                                {item.paseEstado === "A" ? "Confirmar Desasignación" : "Confirmar Reactivación"}
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                ¿Seguro que deseas{" "}
                                {item.paseEstado === "A" ? "desasignar" : "reactivar"} el servicio{" "}
                                <b>{item.servNombre}</b>{" "}
                                {item.paseEstado === "A" ? "del" : "en el"} parque{" "}
                                <b>{item.parqNombre}</b>?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="rounded-xl font-bold">Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleToggleEstado(item)}
                                className="rounded-xl font-black bg-primary"
                              >
                                Confirmar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}