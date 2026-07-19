"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Search, Plus, Edit2, Trash2, CheckCircle2,
  Wrench, ChevronLeft, ChevronRight,
  ArrowLeft, Save, TreePine,
  ClipboardList, Users, AlertTriangle,
  Clock, PlayCircle, CheckSquare, Ban, Eye,
  Calendar, List, MoreHorizontal
} from "lucide-react"
import { logAction } from "@/lib/logging"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const API = "http://localhost:8081/api/mantenimiento"

const ESTADOS = ["PENDIENTE", "EN_PROGRESO", "COMPLETADO", "CANCELADO"] as const
type Estado = typeof ESTADOS[number]

const ESTADO_CONFIG: Record<Estado, { label: string; color: string; icon: any }> = {
  PENDIENTE:   { label: "Pendiente",   color: "bg-amber-400/10 text-amber-600 border-amber-400/20",   icon: Clock },
  EN_PROGRESO: { label: "En Progreso", color: "bg-blue-400/10 text-blue-600 border-blue-400/20",      icon: PlayCircle },
  COMPLETADO:  { label: "Completado",  color: "bg-emerald-400/10 text-emerald-600 border-emerald-400/20", icon: CheckSquare },
  CANCELADO:   { label: "Cancelado",   color: "bg-rose-400/10 text-rose-600 border-rose-400/20",      icon: Ban },
}

interface Supervisor  { idUsuario: number; nombres: string; email: string }
interface Obrero      { obrId: number; persId: number; nombreCompleto: string; persDni: string; persCelu01: string; obrEstado: string }
interface Tipo        { timaId: number; timaNombre: string; timaDescrip: string }
interface Parque      { parqId: number; parqNombre: string; parqDireccion: string }
interface Incidencia  { inciId: number; inciTitulo: string; inciPrioridad: string }
interface Mantenimiento {
  mantId?: number; mantTitulo: string
  mantFechaIni?: string; mantFechaFin?: string
  mantObservacion?: string; persResponsable?: number
  responsableNombre?: string; mantEstado: string
  parqId?: number; parqNombre?: string
  persId?: number; persNombre?: string
  idUsuario?: number; timaIds?: number[]; timaNombres?: string[]
  inciId?: number; inciTitulo?: string
  obreroIds?: number[]; obreros?: Obrero[]
  mantFechaCrea?: string
}

const emptyForm = (): Mantenimiento => ({
  mantTitulo: "", mantEstado: "PENDIENTE",
  timaIds: [], obreroIds: [],
})

// ── Calendario / Cronograma ───────────────────────────────────────────────────
function CalendarioView({ mantenimientos, onSelect }: {
  mantenimientos: Mantenimiento[]
  onSelect: (m: Mantenimiento) => void
}) {
  const today     = new Date()
  const [year, setYear]   = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  const daysInMonth  = new Date(year, month + 1, 0).getDate()
  const firstWeekDay = new Date(year, month, 1).getDay()
  const monthNames   = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]
  const dayNames     = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"]

  const getEventsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2,"0")}-${String(day).padStart(2,"0")}`
    return mantenimientos.filter(m => {
      if (!m.mantFechaIni || !m.mantFechaFin) return false
      return m.mantFechaIni <= dateStr && m.mantFechaFin >= dateStr
    })
  }

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y-1) } else setMonth(m => m-1) }
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y+1) } else setMonth(m => m+1) }

  const cells: (number | null)[] = [
    ...Array(firstWeekDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  return (
    <div className="rounded-2xl bg-card border border-border/50 shadow-sm overflow-hidden">
      {/* Header del calendario */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-muted/20">
        <button onClick={prevMonth} className="h-8 w-8 rounded-xl border border-border/50 flex items-center justify-center hover:bg-muted transition-colors">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h3 className="font-black text-lg">{monthNames[month]} {year}</h3>
        <button onClick={nextMonth} className="h-8 w-8 rounded-xl border border-border/50 flex items-center justify-center hover:bg-muted transition-colors">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Días de la semana */}
      <div className="grid grid-cols-7 border-b border-border/30">
        {dayNames.map(d => (
          <div key={d} className="py-2 text-center text-[10px] font-black uppercase tracking-wider text-muted-foreground">
            {d}
          </div>
        ))}
      </div>

      {/* Celdas del calendario */}
      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} className="min-h-[90px] border-r border-b border-border/20 bg-muted/5" />
          const events  = getEventsForDay(day)
          const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
          return (
            <div key={day} className={cn("min-h-[90px] p-1.5 border-r border-b border-border/20 transition-colors",
              isToday ? "bg-primary/5" : "hover:bg-muted/20"
            )}>
              <div className={cn("text-xs font-black w-6 h-6 flex items-center justify-center rounded-full mb-1",
                isToday ? "bg-primary text-white" : "text-foreground"
              )}>
                {day}
              </div>
              <div className="space-y-0.5">
                {events.slice(0, 3).map(ev => {
                  const cfg = ESTADO_CONFIG[ev.mantEstado as Estado] ?? ESTADO_CONFIG.PENDIENTE
                  return (
                    <button key={ev.mantId} onClick={() => onSelect(ev)}
                      className={cn("w-full text-left px-1.5 py-0.5 rounded-md text-[10px] font-semibold truncate border transition-all hover:opacity-80", cfg.color)}>
                      {ev.mantTitulo}
                    </button>
                  )
                })}
                {events.length > 3 && (
                  <div className="text-[10px] text-muted-foreground font-bold pl-1">+{events.length - 3} más</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── FormView ──────────────────────aslo────────────────────────────────────────────
function FormView({ editingItem, formData, setFormData, onSubmit, onCancel, catalogos, loadingCatalog }: {
  editingItem: Mantenimiento | null
  formData: Mantenimiento
  setFormData: (d: Mantenimiento) => void
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
  catalogos: { supervisores: Supervisor[], obreros: Obrero[], tipos: Tipo[], parques: Parque[], incidencias: Incidencia[] }
  loadingCatalog: boolean
}) {
  const toggleTipo = (id: number) => {
    const cur  = formData.timaIds ?? []
    setFormData({ ...formData, timaIds: cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id] })
  }
  const toggleObrero = (id: number) => {
    const cur  = formData.obreroIds ?? []
    setFormData({ ...formData, obreroIds: cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id] })
  }

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
      {/* Sub-header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onCancel} className="h-10 w-10 rounded-xl p-0 border border-border/50 flex-shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h4 className="text-xl font-black flex items-center gap-2">
            {editingItem ? <Edit2 className="h-5 w-5 text-primary" /> : <Plus className="h-5 w-5 text-primary" />}
            {editingItem ? "Editar Mantenimiento" : "Nuevo Mantenimiento"}
          </h4>
          <p className="text-sm text-muted-foreground">{editingItem ? `Modificando: ${editingItem.mantTitulo}` : "Registra un nuevo mantenimiento de parque"}</p>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Col 1: Datos principales ── */}
          <div className="space-y-4">
            <div className="rounded-2xl bg-card border border-border/50 shadow-sm p-5 space-y-4">
              <h5 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <ClipboardList className="h-3.5 w-3.5" /> Datos del Mantenimiento
              </h5>

              {/* Título */}
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-muted-foreground tracking-widest">Título <span className="text-rose-500">*</span></label>
                <Input placeholder="Ej. Mantenimiento del Parque Principal" className="h-11 rounded-2xl bg-background"
                  value={formData.mantTitulo} onChange={e => setFormData({ ...formData, mantTitulo: e.target.value })} required />
              </div>

              {/* Parque */}
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-muted-foreground tracking-widest">Parque <span className="text-rose-500">*</span></label>
                <select className="w-full h-11 px-3 rounded-2xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={formData.parqId ?? ""} onChange={e => setFormData({ ...formData, parqId: +e.target.value || undefined })} required>
                  <option value="">— Seleccionar parque —</option>
                  {catalogos.parques.map(p => <option key={p.parqId} value={p.parqId}>{p.parqNombre}</option>)}
                </select>
              </div>

              {/* Responsable */}
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-muted-foreground tracking-widest">Supervisor Responsable</label>
                <select className="w-full h-11 px-3 rounded-2xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={formData.persResponsable ?? ""} onChange={e => setFormData({ ...formData, persResponsable: +e.target.value || undefined })}>
                  <option value="">— Seleccionar supervisor —</option>
                  {catalogos.supervisores.map(s => <option key={s.idUsuario} value={s.idUsuario}>{s.nombres}</option>)}
                </select>
              </div>

              {/* Fechas */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-muted-foreground tracking-widest">Fecha Inicio</label>
                  <Input type="date" className="h-11 rounded-2xl bg-background text-sm"
                    value={formData.mantFechaIni ?? ""} onChange={e => setFormData({ ...formData, mantFechaIni: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-muted-foreground tracking-widest">Fecha Fin</label>
                  <Input type="date" className="h-11 rounded-2xl bg-background text-sm"
                    value={formData.mantFechaFin ?? ""} onChange={e => setFormData({ ...formData, mantFechaFin: e.target.value })} />
                </div>
              </div>

              {/* Estado */}
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-muted-foreground tracking-widest">Estado</label>
                <select className="w-full h-11 px-3 rounded-2xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={formData.mantEstado} onChange={e => setFormData({ ...formData, mantEstado: e.target.value })}>
                  {ESTADOS.map(e => <option key={e} value={e}>{ESTADO_CONFIG[e].label}</option>)}
                </select>
              </div>

              {/* Observación */}
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-muted-foreground tracking-widest">Observación</label>
                <textarea rows={7} placeholder="Notas adicionales..."
                  className="w-full px-3 py-2.5 rounded-2xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                  value={formData.mantObservacion ?? ""} onChange={e => setFormData({ ...formData, mantObservacion: e.target.value })} />
              </div>
            </div>
          </div>

          {/* ── Col 2: Tipos + Incidencia ── */}
          <div className="space-y-4">
            {/* Tipos de mantenimiento */}
            <div className="rounded-2xl bg-card border border-border/50 shadow-sm p-5 space-y-3">
              <h5 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Wrench className="h-3.5 w-3.5" /> Tipos de Mantenimiento
                {(formData.timaIds?.length ?? 0) > 0 && (
                  <span className="ml-auto bg-primary text-white text-[10px] font-black px-2 py-0.5 rounded-full">{formData.timaIds?.length}</span>
                )}
              </h5>
              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                {loadingCatalog ? <div className="h-20 rounded-xl bg-muted/30 animate-pulse" /> :
                  catalogos.tipos.map(t => {
                    const sel = (formData.timaIds ?? []).includes(t.timaId)
                    return (
                      <label key={t.timaId} className={cn("flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                        sel ? "bg-primary/8 border-primary/20" : "border-border/40 hover:bg-muted/30")}>
                        <input type="checkbox" checked={sel} onChange={() => toggleTipo(t.timaId)}
                          className="h-4 w-4 rounded accent-primary flex-shrink-0" />
                        <div>
                          <p className={cn("text-sm font-semibold", sel && "text-primary")}>{t.timaNombre}</p>
                          {t.timaDescrip && <p className="text-[11px] text-muted-foreground line-clamp-1">{t.timaDescrip}</p>}
                        </div>
                      </label>
                    )
                  })
                }
              </div>
            </div>

            {/* Incidencia (opcional) */}
            <div className="rounded-2xl bg-card border border-border/50 shadow-sm p-5 space-y-3">
              <h5 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> Incidencia Relacionada
                <span className="text-[10px] font-normal normal-case text-muted-foreground/60 ml-1">— opcional</span>
              </h5>
              {catalogos.incidencias.length === 0 ? (
                <div className="text-xs text-muted-foreground italic text-center py-4 bg-muted/20 rounded-xl">
                  No hay incidencias en progreso
                </div>
              ) : (
                <div className="space-y-1.5 max-h-70 overflow-y-auto pr-1">
                  {/* Opción ninguna */}
                  <label className={cn("flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                    !formData.inciId ? "bg-muted/30 border-border/60" : "border-border/40 hover:bg-muted/20")}>
                    <input type="radio" name="inci" checked={!formData.inciId} onChange={() => setFormData({ ...formData, inciId: undefined })}
                      className="h-4 w-4 accent-primary flex-shrink-0" />
                    <span className="text-sm text-muted-foreground italic">Ninguna</span>
                  </label>
                  {catalogos.incidencias.map(i => {
                    const sel = formData.inciId === i.inciId
                    return (
                      <label key={i.inciId} className={cn("flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                        sel ? "bg-amber-500/8 border-amber-500/20" : "border-border/40 hover:bg-muted/20")}>
                        <input type="radio" name="inci" checked={sel} onChange={() => setFormData({ ...formData, inciId: i.inciId })}
                          className="h-4 w-4 accent-amber-500 flex-shrink-0" />
                        <div>
                          <p className={cn("text-sm font-semibold", sel && "text-amber-600")}>{i.inciTitulo}</p>
                          <Badge className={cn("text-[10px] mt-0.5",
                            i.inciPrioridad === "ALTA" ? "bg-rose-100 text-rose-600" :
                            i.inciPrioridad === "MEDIA" ? "bg-amber-100 text-amber-600" : "bg-muted text-muted-foreground"
                          )}>{i.inciPrioridad}</Badge>
                        </div>
                      </label>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── Col 3: Obreros ── */}
          <div className="space-y-4">
            <div className="rounded-2xl bg-card border border-border/50 shadow-sm p-5 space-y-3">
              <h5 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Users className="h-3.5 w-3.5" /> Obreros Asignados
                {(formData.obreroIds?.length ?? 0) > 0 && (
                  <span className="ml-auto bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{formData.obreroIds?.length}</span>
                )}
              </h5>
              <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-1">
                {loadingCatalog ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-14 rounded-xl bg-muted/30 animate-pulse" />
                )) : catalogos.obreros.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic text-center py-6">Sin obreros registrados</p>
                ) : catalogos.obreros.map(o => {
                  const sel = (formData.obreroIds ?? []).includes(o.obrId)
                  return (
                    <button key={o.obrId} type="button" onClick={() => toggleObrero(o.obrId)}
                      className={cn("w-full text-left px-3 py-2.5 rounded-xl border transition-all flex items-center gap-3",
                        sel ? "bg-emerald-500/8 border-emerald-500/25" : "border-border/40 hover:bg-muted/30")}>
                      <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center font-black text-xs flex-shrink-0",
                        sel ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground")}>
                        {sel ? <CheckCircle2 className="h-4 w-4" /> : o.nombreCompleto.substring(0,2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={cn("font-semibold text-sm truncate", sel && "text-emerald-700 dark:text-emerald-400")}>{o.nombreCompleto}</p>
                        <p className="text-[11px] text-muted-foreground">DNI: {o.persDni}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer de acciones ── */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-border/50">
          <Button type="button" variant="outline" onClick={onCancel} className="gap-2">
            Cancelar
          </Button>
          <Button type="submit" className="gap-2">
            <Save className="h-4 w-4" />
            {editingItem ? "Guardar Cambios" : "Crear Mantenimiento"}
          </Button>
        </div>
      </form>
    </div>
  )
}

// ── Componente Principal ─────────────────────────────────────────────────────
export default function ProgramacionPage() {
  const { user } = useAuth()

  // Estados principales
  const [view, setView] = useState<"table" | "calendar" | "form">("table")
  const [mantenimientos, setMantenimientos] = useState<Mantenimiento[]>([])
  const [filteredItems, setFilteredItems] = useState<Mantenimiento[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  // Estados del formulario
  const [editingItem, setEditingItem] = useState<Mantenimiento | null>(null)
  const [formData, setFormData] = useState<Mantenimiento>(emptyForm())

  // Estados de catálogos
  const [catalogos, setCatalogos] = useState<{
    supervisores: Supervisor[]
    obreros: Obrero[]
    tipos: Tipo[]
    parques: Parque[]
    incidencias: Incidencia[]
  }>({ supervisores: [], obreros: [], tipos: [], parques: [], incidencias: [] })
  const [loadingCatalog, setLoadingCatalog] = useState(false)

  // ── Cargar datos ──
  const fetchMantenimientos = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(API)
      if (!response.ok) throw new Error(`Error: ${response.status}`)
      const data = await response.json()
      setMantenimientos(data)
      setFilteredItems(data)
      await logAction(String(user?.id ?? 0), "CONSULTA", "Mantenimientos listados")
    } catch (error) {
      console.error("Error al cargar mantenimientos:", error)
      toast.error("Error al cargar los mantenimientos")
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  // Normaliza la respuesta de un catálogo: acepta tanto un array plano
  // como respuestas envueltas (ej. { data: [...] }, { rows: [...] }) y
  // nunca deja pasar algo que no sea un array, para evitar errores de
  // runtime como "X.map is not a function".
  const fetchCatalogo = useCallback(async (endpoint: string, label: string): Promise<any[]> => {
    try {
      const res = await fetch(`${API}/${endpoint}`)
      if (!res.ok) {
        console.error(`Error al cargar catálogo "${label}": ${res.status}`)
        return []
      }
      const json = await res.json()
      if (Array.isArray(json)) return json
      if (Array.isArray(json?.data)) return json.data
      if (Array.isArray(json?.rows)) return json.rows
      console.error(`Catálogo "${label}" no devolvió un array:`, json)
      return []
    } catch (error) {
      console.error(`Error al cargar catálogo "${label}":`, error)
      return []
    }
  }, [])

  const fetchCatalogos = useCallback(async () => {
    setLoadingCatalog(true)
    try {
      const [supervisores, obreros, tipos, parques, incidencias] = await Promise.all([
        fetchCatalogo("supervisores", "supervisores"),
        fetchCatalogo("obreros", "obreros"),
        fetchCatalogo("tipos-mantenimiento", "tipos"),
        fetchCatalogo("parques", "parques"),
        fetchCatalogo("incidencias-en-progreso", "incidencias"),
      ])
      setCatalogos({ supervisores, obreros, tipos, parques, incidencias })
    } catch (error) {
      console.error("Error al cargar catálogos:", error)
      toast.error("Error al cargar catálogos")
    } finally {
      setLoadingCatalog(false)
    }
  }, [fetchCatalogo])

  // ── Filtrar ──
  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term)
    if (!term.trim()) {
      setFilteredItems(mantenimientos)
      return
    }
    const filtered = mantenimientos.filter(item =>
      item.mantTitulo.toLowerCase().includes(term.toLowerCase()) ||
      item.parqNombre?.toLowerCase().includes(term.toLowerCase()) ||
      item.responsableNombre?.toLowerCase().includes(term.toLowerCase()) ||
      item.mantEstado.toLowerCase().includes(term.toLowerCase())
    )
    setFilteredItems(filtered)
  }, [mantenimientos])

  // ── Operaciones CRUD ──
  const handleCreate = () => {
    setEditingItem(null)
    setFormData(emptyForm())
    setView("form")
  }

  const handleEdit = (item: Mantenimiento) => {
    setEditingItem(item)
    setFormData({
      ...item,
      mantFechaIni: item.mantFechaIni?.split('T')[0] || '',
      mantFechaFin: item.mantFechaFin?.split('T')[0] || '',
    })
    setView("form")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = {
        ...formData,
        idUsuario: user?.id,
        timaIds: formData.timaIds?.length ? formData.timaIds : null,
        obreroIds: formData.obreroIds?.length ? formData.obreroIds : null,
      }

      const url = editingItem ? `${API}/${editingItem.mantId}` : API
      const method = editingItem ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Error ${response.status}: ${errorText}`)
      }

      toast.success(`Mantenimiento ${editingItem ? 'actualizado' : 'creado'} exitosamente`)
      await logAction(String(user?.id ?? 0), editingItem ? "ACTUALIZACION" : "INSERCION",
        `Mantenimiento ${editingItem ? 'editado' : 'creado'}: ${formData.mantTitulo}`)

      fetchMantenimientos()
      setView("table")
    } catch (error) {
      console.error("Error:", error)
      toast.error(error instanceof Error ? error.message : "Error al procesar la solicitud")
    }
  }

  const handleDelete = async (item: Mantenimiento) => {
    try {
      const response = await fetch(`${API}/${item.mantId}`, { method: "DELETE" })
      if (!response.ok) throw new Error(`Error: ${response.status}`)

      toast.success("Mantenimiento eliminado exitosamente")
      await logAction(String(user?.id ?? 0), "ELIMINACION", `Mantenimiento eliminado: ${item.mantTitulo}`)
      fetchMantenimientos()
    } catch (error) {
      console.error("Error:", error)
      toast.error("Error al eliminar el mantenimiento")
    }
  }

  const handleCancel = () => {
    setEditingItem(null)
    setFormData(emptyForm())
    setView("table")
  }

  // ── Efectos ──
  useEffect(() => {
    fetchMantenimientos()
    fetchCatalogos()
  }, [fetchMantenimientos, fetchCatalogos])

  useEffect(() => {
    handleSearch(searchTerm)
  }, [searchTerm, handleSearch])

  // ── Render condicional por vista ──
  if (view === "form") {
    return (
      <div className="container mx-auto space-y-6">
        <FormView
          editingItem={editingItem}
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          catalogos={catalogos}
          loadingCatalog={loadingCatalog}
        />
      </div>
    )
  }

  if (view === "calendar") {
    return (
      <div className="container mx-auto space-y-6">
        {/* Header del calendario */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black flex items-center gap-3">
              <Calendar className="h-8 w-8 text-primary" />
              Cronograma de Mantenimientos
            </h2>
            <p className="text-muted-foreground">Vista calendario de los mantenimientos programados</p>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={handleCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Mantenimiento
            </Button>
          </div>
        </div>

        <CalendarioView
          mantenimientos={mantenimientos}
          onSelect={handleEdit}
        />
      </div>
    )
  }

  // Vista tabla (por defecto)
    return (
      <div className="container mx-auto space-y-6">
        {/* Header del calendario */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black flex items-center gap-3">
              <Calendar className="h-8 w-8 text-primary" />
              Cronograma de Mantenimientos
            </h2>
            <p className="text-muted-foreground">Vista calendario de los mantenimientos programados</p>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={handleCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Mantenimiento
            </Button>
          </div>
        </div>

        <CalendarioView
          mantenimientos={mantenimientos}
          onSelect={handleEdit}
        />
      </div>
    )
}