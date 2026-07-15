"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Search, Plus, Edit2, Trash2, CheckCircle2,
  Wrench, ChevronLeft, ChevronRight,
  ArrowLeft, ArrowRight, Save, TreePine,
  ClipboardList, Users, AlertTriangle,
  Clock, PlayCircle, CheckSquare, Ban, Eye, CalendarPlus,
  Calendar, List, MoreHorizontal, MapPin, Check
} from "lucide-react"
import { logAction } from "@/lib/logging"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
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

// ── FormView ──────────────────────────────────────────────────────────────────
function FormView({ editingItem, formData, setFormData, onSubmit, onCancel, catalogos, loadingCatalog }: {
  editingItem: Mantenimiento | null
  formData: Mantenimiento
  setFormData: (d: Mantenimiento) => void
  onSubmit: (e?: React.FormEvent) => void
  onCancel: () => void
  catalogos: { supervisores: Supervisor[], obreros: Obrero[], tipos: Tipo[], parques: Parque[], incidencias: Incidencia[] }
  loadingCatalog: boolean
}) {
  const [activeStep, setActiveStep] = useState<"general" | "tipos" | "personal">("general")
  const [searchObrero, setSearchObrero] = useState("")
  const [searchTipo, setSearchTipo] = useState("")

  const preventEnterSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
    }
  }

  const toggleTipo = (id: number, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    const cur  = formData.timaIds ?? []
    setFormData({ ...formData, timaIds: cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id] })
  }
  const toggleObrero = (id: number, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    const cur  = formData.obreroIds ?? []
    setFormData({ ...formData, obreroIds: cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id] })
  }

  // Validaciones
  const isStep1Valid = !!(formData.mantTitulo?.trim() && formData.parqId)

  const handleStepChange = (step: "general" | "tipos" | "personal") => {
    if (step !== "general" && !isStep1Valid) {
      toast.error("Por favor, completa los campos requeridos para continuar (Título y Parque).")
      return
    }
    setActiveStep(step)
  }

  const handleNextStep = () => {
    if (activeStep === "general") {
      if (!isStep1Valid) {
        toast.error("Por favor, ingresa el Título y selecciona un Parque.")
        return
      }
      setActiveStep("tipos")
    } else if (activeStep === "tipos") {
      setActiveStep("personal")
    }
  }

  const handlePrevStep = () => {
    if (activeStep === "personal") {
      setActiveStep("tipos")
    } else if (activeStep === "tipos") {
      setActiveStep("general")
    }
  }

  // Filtrado de obreros
  const filteredObreros = catalogos.obreros.filter(o =>
    o.nombreCompleto.toLowerCase().includes(searchObrero.toLowerCase()) ||
    o.persDni.includes(searchObrero)
  )

  // Filtrado de tipos
  const filteredTipos = catalogos.tipos.filter(t =>
    t.timaNombre.toLowerCase().includes(searchTipo.toLowerCase()) ||
    (t.timaDescrip && t.timaDescrip.toLowerCase().includes(searchTipo.toLowerCase()))
  )

  // Nombre del parque seleccionado
  const selectedParque = catalogos.parques.find(p => p.parqId === formData.parqId)
  
  // Nombre del supervisor seleccionado
  const selectedSupervisor = catalogos.supervisores.find(s => s.idUsuario === formData.persResponsable)

  // Incidencia seleccionada
  const selectedIncidencia = catalogos.incidencias.find(i => i.inciId === formData.inciId)

  // Obreros seleccionados
  const selectedObrerosList = catalogos.obreros.filter(o => (formData.obreroIds ?? []).includes(o.obrId))

  // Calcular duración en días
  const getDurationText = () => {
    if (!formData.mantFechaIni || !formData.mantFechaFin) return null
    const s = new Date(formData.mantFechaIni)
    const e = new Date(formData.mantFechaFin)
    const diff = e.getTime() - s.getTime()
    if (isNaN(diff)) return null
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1
    if (days <= 0) return { text: "Rango de fechas inválido", isError: true }
    return { text: `${days} día(s) programado(s)`, isError: false }
  }
  const durationInfo = getDurationText()

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-5">
        <div className="flex items-center gap-4">
          <Button type="button" variant="ghost" onClick={onCancel} className="h-10 w-10 rounded-xl p-0 border border-border/50 flex-shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <span className="text-xs font-black uppercase text-primary tracking-wider">Mód. Programación</span>
            <h4 className="text-2xl font-black flex items-center gap-2">
              {editingItem ? <Edit2 className="h-5 w-5 text-primary" /> : <Plus className="h-5 w-5 text-primary" />}
              {editingItem ? "Editar Mantenimiento" : "Nuevo Mantenimiento"}
            </h4>
          </div>
        </div>
        
        {/* Wizard Progress Steps */}
        <div className="flex items-center gap-2 bg-muted/30 p-1.5 rounded-2xl border border-border/50">
          <button
            type="button"
            onClick={() => handleStepChange("general")}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5",
              activeStep === "general" ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:bg-muted/65"
            )}
          >
            <span className="h-5 w-5 rounded-full bg-black/10 flex items-center justify-center text-[10px]">1</span>
            General
          </button>
          <div className="h-1.5 w-6 bg-border rounded-full" />
          <button
            type="button"
            onClick={() => handleStepChange("tipos")}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5",
              activeStep === "tipos" ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:bg-muted/65",
              !isStep1Valid && "opacity-50 cursor-not-allowed"
            )}
          >
            <span className="h-5 w-5 rounded-full bg-black/10 flex items-center justify-center text-[10px]">2</span>
            Tipos e Incidencias
          </button>
          <div className="h-1.5 w-6 bg-border rounded-full" />
          <button
            type="button"
            onClick={() => handleStepChange("personal")}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5",
              activeStep === "personal" ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:bg-muted/65",
              !isStep1Valid && "opacity-50 cursor-not-allowed"
            )}
          >
            <span className="h-5 w-5 rounded-full bg-black/10 flex items-center justify-center text-[10px]">3</span>
            Personal
          </button>
        </div>
      </div>

      <div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Form Content Panel (col-span-2) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* STEP 1: Datos Generales */}
            {activeStep === "general" && (
              <div className="rounded-3xl bg-card border border-border/50 shadow-md p-6 space-y-6 animate-in fade-in duration-300">
                <div className="flex items-center gap-2.5 pb-4 border-b border-border/40">
                  <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                    <ClipboardList className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h5 className="font-black text-base text-foreground">Información del Mantenimiento</h5>
                    <p className="text-xs text-muted-foreground">Define los campos esenciales para la programación del servicio.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Título */}
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-xs font-black uppercase text-muted-foreground tracking-widest flex items-center gap-1">
                      Título de Mantenimiento <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <Input
                      placeholder="Ej. Limpieza general y corte de césped"
                      className="h-12 rounded-2xl bg-muted/10 border-border/60 focus-visible:bg-background transition-all placeholder:text-muted-foreground/60"
                      value={formData.mantTitulo}
                      onChange={e => setFormData({ ...formData, mantTitulo: e.target.value })}
                      onKeyDown={preventEnterSubmit}
                      required
                    />
                  </div>

                  {/* Parque */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase text-muted-foreground tracking-widest flex items-center gap-1">
                      Parque / Ubicación <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <select
                      className="w-full h-12 px-4 rounded-2xl border border-input bg-muted/10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground"
                      value={formData.parqId ?? ""}
                      onChange={e => setFormData({ ...formData, parqId: +e.target.value || undefined })}
                      required
                    >
                      <option value="" className="text-muted-foreground">— Seleccionar Parque —</option>
                      {catalogos.parques.map(p => (
                        <option key={p.parqId} value={p.parqId} className="text-foreground">{p.parqNombre}</option>
                      ))}
                    </select>
                  </div>

                  {/* Responsable */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase text-muted-foreground tracking-widest">
                      Supervisor de Obra
                    </label>
                    <select
                      className="w-full h-12 px-4 rounded-2xl border border-input bg-muted/10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground"
                      value={formData.persResponsable ?? ""}
                      onChange={e => setFormData({ ...formData, persResponsable: +e.target.value || undefined })}
                    >
                      <option value="">— Seleccionar Supervisor —</option>
                      {catalogos.supervisores.map(s => (
                        <option key={s.idUsuario} value={s.idUsuario}>{s.nombres}</option>
                      ))}
                    </select>
                  </div>

                  {/* Fecha Inicio */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase text-muted-foreground tracking-widest flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-primary" /> Fecha de Inicio
                    </label>
                    <Input
                      type="date"
                      className="h-12 rounded-2xl bg-muted/10 border-border/60 focus-visible:bg-background transition-all"
                      value={formData.mantFechaIni ?? ""}
                      onChange={e => setFormData({ ...formData, mantFechaIni: e.target.value })}
                      onKeyDown={preventEnterSubmit}
                    />
                  </div>

                  {/* Fecha Fin */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase text-muted-foreground tracking-widest flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-primary" /> Fecha de Finalización
                    </label>
                    <Input
                      type="date"
                      className="h-12 rounded-2xl bg-muted/10 border-border/60 focus-visible:bg-background transition-all"
                      value={formData.mantFechaFin ?? ""}
                      onChange={e => setFormData({ ...formData, mantFechaFin: e.target.value })}
                      onKeyDown={preventEnterSubmit}
                    />
                  </div>

                  {/* Duración (Dinámico) */}
                  {durationInfo && (
                    <div className="md:col-span-2 px-4 py-2.5 rounded-2xl bg-muted/20 border border-border/40 text-xs font-bold flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      <span className={cn(durationInfo.isError ? "text-rose-500" : "text-muted-foreground")}>
                        {durationInfo.text}
                      </span>
                    </div>
                  )}

                  {/* Estado */}
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-xs font-black uppercase text-muted-foreground tracking-widest">
                      Estado de Programación
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {ESTADOS.map(e => {
                        const cfg = ESTADO_CONFIG[e];
                        const Icon = cfg.icon;
                        const isSel = formData.mantEstado === e;
                        return (
                          <button
                            key={e}
                            type="button"
                            onClick={() => setFormData({ ...formData, mantEstado: e })}
                            className={cn(
                              "flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all cursor-pointer gap-1.5",
                              isSel
                                ? `${cfg.color} border-current ring-1 ring-current scale-[1.02] shadow-sm`
                                : "border-border/50 bg-muted/10 hover:bg-muted/40 text-muted-foreground"
                            )}
                          >
                            <Icon className="h-5 w-5" />
                            <span className="text-xs font-black">{cfg.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Observación */}
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-xs font-black uppercase text-muted-foreground tracking-widest">
                      Detalles y Observaciones Especiales
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Agrega comentarios o requerimientos específicos para el equipo técnico..."
                      className="w-full px-4 py-3 rounded-2xl bg-muted/10 border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none text-foreground"
                      value={formData.mantObservacion ?? ""}
                      onChange={e => setFormData({ ...formData, mantObservacion: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Tipos y Requerimientos */}
            {activeStep === "tipos" && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* Tipos Checklist */}
                <div className="rounded-3xl bg-card border border-border/50 shadow-md p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/40">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Wrench className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h5 className="font-black text-base text-foreground">Tipos de Mantenimiento</h5>
                        <p className="text-xs text-muted-foreground">Selecciona uno o más tipos de actividades a programar.</p>
                      </div>
                    </div>
                    {/* Búsqueda de Tipo */}
                    <div className="relative w-full sm:w-60">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        placeholder="Filtrar tipos..."
                        className="h-9 pl-9 rounded-xl bg-muted/10 border-border/60"
                        value={searchTipo}
                        onChange={e => setSearchTipo(e.target.value)}
                        onKeyDown={preventEnterSubmit}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
                    {loadingCatalog ? (
                      <div className="col-span-2 h-24 rounded-2xl bg-muted/30 animate-pulse" />
                    ) : filteredTipos.length === 0 ? (
                      <div className="col-span-2 text-center py-8 text-xs text-muted-foreground italic bg-muted/10 rounded-2xl">
                        No se encontraron tipos con "{searchTipo}"
                      </div>
                    ) : (
                      filteredTipos.map(t => {
                        const sel = (formData.timaIds ?? []).includes(t.timaId)
                        return (
                          <div
                            key={t.timaId}
                            onClick={(e) => toggleTipo(t.timaId, e)}
                            className={cn(
                              "flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer select-none",
                              sel
                                ? "bg-primary/8 border-primary shadow-sm"
                                : "border-border/50 hover:bg-muted/10 hover:border-border/80"
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={sel}
                              readOnly
                              className="h-4 w-4 rounded accent-primary mt-0.5 pointer-events-none"
                            />
                            <div className="min-w-0">
                              <p className={cn("text-xs font-black", sel ? "text-primary" : "text-foreground")}>
                                {t.timaNombre}
                              </p>
                              {t.timaDescrip && (
                                <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                                  {t.timaDescrip}
                                </p>
                              )}
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>

                {/* Incidencia Relacionada */}
                <div className="rounded-3xl bg-card border border-border/50 shadow-md p-6 space-y-4">
                  <div className="flex items-center gap-2.5 pb-4 border-b border-border/40">
                    <div className="h-9 w-9 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
                      <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500" />
                    </div>
                    <div>
                      <h5 className="font-black text-base text-foreground">Incidencia de Parque Vinculada</h5>
                      <p className="text-xs text-muted-foreground">Si este mantenimiento atiende a un reporte previo, elígelo aquí.</p>
                    </div>
                  </div>

                  {catalogos.incidencias.length === 0 ? (
                    <div className="text-xs text-muted-foreground italic text-center py-6 bg-muted/10 rounded-2xl border border-dashed border-border/60">
                      No hay incidencias activas en el sistema en este momento
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[250px] overflow-y-auto pr-1">
                      {/* Opción ninguna */}
                      <label 
                        className={cn(
                          "flex items-center gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all",
                          !formData.inciId
                            ? "bg-muted/20 border-border/80 text-foreground"
                            : "border-border/50 hover:bg-muted/10 text-muted-foreground"
                        )}
                      >
                        <input
                          type="radio"
                          name="inci"
                          checked={!formData.inciId}
                          onChange={() => setFormData({ ...formData, inciId: undefined })}
                          className="h-4 w-4 accent-primary"
                        />
                        <div>
                          <span className="text-xs font-black uppercase animate-pulse">Ninguna Incidencia</span>
                          <p className="text-[10px] text-muted-foreground">Mantenimiento programado de rutina</p>
                        </div>
                      </label>

                      {catalogos.incidencias.map(i => {
                        const sel = formData.inciId === i.inciId
                        return (
                          <label
                            key={i.inciId}
                            className={cn(
                              "flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all",
                              sel
                                ? "bg-amber-500/8 border-amber-500 shadow-sm"
                                : "border-border/50 hover:bg-muted/10"
                            )}
                          >
                            <input
                              type="radio"
                              name="inci"
                              checked={sel}
                              onChange={() => setFormData({ ...formData, inciId: i.inciId })}
                              className="h-4 w-4 accent-amber-600 dark:accent-amber-500 mt-0.5"
                            />
                            <div className="min-w-0">
                              <p className={cn("text-xs font-black", sel ? "text-amber-700 dark:text-amber-400" : "text-foreground")}>
                                {i.inciTitulo}
                              </p>
                              <Badge className={cn("text-[9px] font-black px-2 mt-1 py-0.5",
                                i.inciPrioridad === "ALTA" ? "bg-rose-100 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/30" :
                                i.inciPrioridad === "MEDIA" ? "bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30" :
                                "bg-muted text-muted-foreground border border-border/40"
                              )}>{i.inciPrioridad}</Badge>
                            </div>
                          </label>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 3: Obreros Asignados */}
            {activeStep === "personal" && (
              <div className="rounded-3xl bg-card border border-border/50 shadow-md p-6 space-y-6 animate-in fade-in duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/40">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-500" />
                    </div>
                    <div>
                      <h5 className="font-black text-base text-foreground">Equipo de Trabajo (Obreros)</h5>
                      <p className="text-xs text-muted-foreground">Asigna al personal técnico encargado de ejecutar las labores.</p>
                    </div>
                  </div>

                  {/* Búsqueda de Obrero */}
                  <div className="relative w-full sm:w-60">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Filtrar por nombre o DNI..."
                      className="h-10 pl-9 rounded-xl bg-muted/10 border-border/60 focus:bg-background transition-all"
                      value={searchObrero}
                      onChange={e => setSearchObrero(e.target.value)}
                      onKeyDown={preventEnterSubmit}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  {loadingCatalog ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-16 rounded-2xl bg-muted/30 animate-pulse" />
                      ))}
                    </div>
                  ) : filteredObreros.length === 0 ? (
                    <div className="text-center py-10 text-xs text-muted-foreground bg-muted/10 rounded-2xl italic">
                      No se encontraron obreros con "{searchObrero}"
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[365px] overflow-y-auto pr-1.5 pb-2">
                      {filteredObreros.map(o => {
                        const sel = (formData.obreroIds ?? []).includes(o.obrId)
                        const initials = o.nombreCompleto.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
                        const isActivo = o.obrEstado === "ACTIVO"
                        
                        return (
                          <div
                            key={o.obrId}
                            onClick={(e) => toggleObrero(o.obrId, e)}
                            className={cn(
                              "flex items-center gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer select-none group relative overflow-hidden",
                              sel
                                ? "bg-emerald-500/8 border-emerald-500 dark:border-emerald-600 shadow-sm"
                                : "border-border/50 bg-muted/10 hover:bg-muted/30 hover:border-border/80 hover:shadow-xs"
                            )}
                          >
                            {/* Avatar Bubble */}
                            <div className={cn(
                              "h-10 w-10 min-w-10 rounded-xl flex items-center justify-center font-black text-xs transition-colors",
                              sel
                                ? "bg-emerald-600 text-white"
                                : "bg-neutral-200 dark:bg-neutral-800 text-muted-foreground group-hover:bg-neutral-300 dark:group-hover:bg-neutral-700"
                            )}>
                              {sel ? <Check className="h-5 w-5" /> : initials}
                            </div>

                            {/* Detalle del personal */}
                            <div className="min-w-0 flex-1">
                              <p className={cn("font-bold text-xs truncate", sel ? "text-emerald-700 dark:text-emerald-400" : "text-foreground")}>
                                {o.nombreCompleto}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] text-muted-foreground/80 font-semibold font-mono">DNI: {o.persDni}</span>
                                {o.persCelu01 && (
                                  <span className="text-[10px] text-muted-foreground/80 font-bold">📲 {o.persCelu01}</span>
                                )}
                              </div>
                            </div>
                            
                            {/* Badge de disponibilidad */}
                            <Badge className={cn("text-[9px] font-black px-1.5 py-0",
                              isActivo
                                ? "bg-emerald-100 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/20"
                                : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
                            )}>
                              {o.obrEstado}
                            </Badge>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Step navigation actions for main form panel */}
            <div className="flex items-center justify-between p-4 bg-muted/10 rounded-2xl border border-border/40">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevStep}
                disabled={activeStep === "general"}
                className="gap-2 rounded-xl h-11 px-5"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>

              {activeStep !== "personal" ? (
                <Button
                  type="button"
                  onClick={handleNextStep}
                  className="gap-2 rounded-xl h-11 px-5"
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={() => onSubmit()}
                  className="gap-2 rounded-xl h-11 px-6 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md font-bold"
                >
                  <Save className="h-4 w-4" />
                  {editingItem ? "Guardar Cambios" : "Programar Servicio"}
                </Button>
              )}
            </div>
          </div>

          {/* Sticky Ticket Preview Card (col-span-1) */}
          <div className="lg:sticky lg:top-20 space-y-4">
            <div className="rounded-3xl bg-card border border-border/60 shadow-lg p-6 space-y-5 overflow-hidden relative">
              
              {/* Background accent glow */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full filter blur-2xl pointer-events-none" />

              <div className="border-b border-border/40 pb-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/75 font-sans">Vista de Ticket</span>
                <h5 className="font-extrabold text-base text-foreground mt-0.5 flex items-center gap-1.5">
                  <TreePine className="h-4.5 w-4.5 text-primary animate-pulse" /> Vista Programable
                </h5>
              </div>

              {/* Grid content inside Ticket */}
              <div className="space-y-4 text-xs">
                
                {/* Title */}
                <div className="space-y-1">
                  <span className="font-bold text-muted-foreground/70 uppercase text-[9px] tracking-wider">Título de Orden</span>
                  <p className="font-black text-sm text-foreground leading-tight truncate">
                    {formData.mantTitulo?.trim() || <span className="text-muted-foreground/45 italic font-medium">Sin título asignado</span>}
                  </p>
                </div>

                {/* Ubicación / Parque */}
                <div className="space-y-1">
                  <span className="font-bold text-muted-foreground/70 uppercase text-[9px] tracking-wider">Ubicación</span>
                  <div className="flex items-start gap-2 pt-0.5">
                    <MapPin className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-bold text-foreground truncate">
                        {selectedParque ? selectedParque.parqNombre : <span className="text-muted-foreground/45 italic font-medium">Pendiente elección</span>}
                      </p>
                      {selectedParque?.parqDireccion && (
                        <p className="text-[10px] text-muted-foreground truncate leading-relaxed">{selectedParque.parqDireccion}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Fechas */}
                <div className="space-y-1">
                  <span className="font-bold text-muted-foreground/70 uppercase text-[9px] tracking-wider">Cronograma</span>
                  <div className="rounded-2xl bg-muted/30 border border-border/30 p-3 space-y-2 mt-0.5">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-muted-foreground">📅 Inicio:</span>
                      <span className="font-mono font-bold text-foreground">
                        {formData.mantFechaIni ? new Date(formData.mantFechaIni + "T00:00:00").toLocaleDateString("es-PE") : "—"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-muted-foreground">🏁 Fin:</span>
                      <span className="font-mono font-bold text-foreground">
                        {formData.mantFechaFin ? new Date(formData.mantFechaFin + "T00:00:00").toLocaleDateString("es-PE") : "—"}
                      </span>
                    </div>
                    {durationInfo && !durationInfo.isError && (
                      <div className="border-t border-border/30 pt-1.5 text-center text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                        ⏱️ {durationInfo.text}
                      </div>
                    )}
                  </div>
                </div>

                {/* Supervisor */}
                {selectedSupervisor && (
                  <div className="space-y-1">
                    <span className="font-bold text-muted-foreground/70 uppercase text-[9px] tracking-wider">Supervisor responsable</span>
                    <div className="flex items-center gap-2 pt-0.5">
                      <div className="h-6 w-6 rounded-full bg-primary/20 text-primary font-black text-[10px] flex items-center justify-center">
                        {selectedSupervisor.nombres.substring(0,2).toUpperCase()}
                      </div>
                      <span className="font-bold text-foreground truncate">{selectedSupervisor.nombres}</span>
                    </div>
                  </div>
                )}

                {/* Tipos Seleccionados */}
                <div className="space-y-1.5">
                  <span className="font-bold text-muted-foreground/70 uppercase text-[9px] tracking-wider flex justify-between">
                    <span>Tipos de Mantenimiento</span>
                    <span className="font-mono text-primary font-black">({formData.timaIds?.length ?? 0})</span>
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {formData.timaIds && formData.timaIds.length > 0 ? (
                      catalogos.tipos
                        .filter(t => formData.timaIds?.includes(t.timaId))
                        .map(t => (
                          <Badge key={t.timaId} variant="secondary" className="text-[9px] font-black px-2 py-0 border border-border/50">
                            {t.timaNombre}
                          </Badge>
                        ))
                    ) : (
                      <span className="text-[10px] text-muted-foreground/50 italic">Ningún tipo seleccionado</span>
                    )}
                  </div>
                </div>

                {/* Incidencia */}
                {selectedIncidencia && (
                  <div className="space-y-1">
                    <span className="font-bold text-muted-foreground/70 uppercase text-[9px] tracking-wider">Incidencia Relacionada</span>
                    <div className="rounded-xl bg-amber-500/8 border border-amber-500/20 p-2.5 mt-0.5 text-[10px] text-amber-800 dark:text-amber-400 flex items-start gap-1.5 leading-relaxed">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                      <span>{selectedIncidencia.inciTitulo}</span>
                    </div>
                  </div>
                )}

                {/* Equipo de Trabajo */}
                <div className="space-y-1.5">
                  <span className="font-bold text-muted-foreground/70 uppercase text-[9px] tracking-wider flex justify-between">
                    <span>Obreros Asignados</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-black">({formData.obreroIds?.length ?? 0})</span>
                  </span>
                  {selectedObrerosList.length > 0 ? (
                    <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                      {selectedObrerosList.map(o => (
                        <div key={o.obrId} className="flex items-center gap-1.5 py-1 text-[11px] font-semibold text-foreground border-b border-border/20 last:border-b-0">
                          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                          <span className="truncate">{o.nombreCompleto}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-muted-foreground/50 italic">Sin obreros asignados</p>
                  )}
                </div>
              </div>

              {/* Botón de Cancelar en el lateral */}
              <div className="border-t border-border/40 pt-4 flex gap-2">
                <Button type="button" variant="ghost" onClick={onCancel} className="flex-1 rounded-xl text-xs h-9">
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
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
  const [filterEstado, setFilterEstado] = useState<string>("TODOS")
  const [filterParque, setFilterParque] = useState<string>("TODOS")

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

  // Normaliza la respuesta de un catálogo
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

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
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

  // Reactive filters useEffect
  useEffect(() => {
    const term = searchTerm.trim().toLowerCase()
    const list = mantenimientos.filter(item => {
      const matchesSearch = !term ||
        item.mantTitulo.toLowerCase().includes(term) ||
        (item.parqNombre && item.parqNombre.toLowerCase().includes(term)) ||
        (item.responsableNombre && item.responsableNombre.toLowerCase().includes(term)) ||
        (item.mantObservacion && item.mantObservacion.toLowerCase().includes(term))

      const matchesEstado = filterEstado === "TODOS" || item.mantEstado === filterEstado
      const matchesParque = filterParque === "TODOS" || String(item.parqId) === filterParque

      return matchesSearch && matchesEstado && matchesParque
    })
    setFilteredItems(list)
  }, [searchTerm, filterEstado, filterParque, mantenimientos])

  // ── Render condicional por vista ──
  if (view === "form") {
    return (
      <div className="container mx-auto space-y-6 ">
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
              <Calendar className="h-8 w-8 text-primary animate-pulse" />
              Cronograma de Mantenimientos
            </h2>
            <p className="text-muted-foreground">Vista calendario de los mantenimientos programados</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setView("table")} className="gap-2 hover:bg-muted hover:text-dark rounded-xl h-10 font-bold">
              <List className="h-4 w-4" />
              Listar Mantenimientos
            </Button>
            <Button onClick={handleCreate} className="gap-2 rounded-xl h-10 font-bold">
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black flex items-center gap-3">
            <Wrench className="h-8 w-8 text-primary" />
            Programación de Mantenimientos
          </h2>
          <p className="text-muted-foreground">Gestiona los mantenimientos de parques y áreas verdes</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setView("calendar")} className="gap-2 hover:bg-muted hover:text-dark rounded-xl h-10 font-bold">
            <Calendar className="h-4 w-4" />
            Consultar Cronograma
          </Button>
          <Button onClick={handleCreate} className="gap-2 rounded-xl h-10 font-bold">
            <Plus className="h-4 w-4" />
            Nuevo Mantenimiento
          </Button>
        </div>
      </div>

      {/* Barra de búsqueda y filtros */}
      <div className="flex flex-col xl:flex-row xl:items-center gap-4 bg-muted/20 p-4 rounded-3xl border border-border/50">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título, parque, responsable o detalles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-11 rounded-2xl bg-card border-border/50 w-full"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
          {/* Filtro Estado */}
          <div className="w-full sm:w-48">
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="w-full h-11 px-3 rounded-2xl border border-border/50 bg-card text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
            >
              <option value="TODOS">Todos los Estados</option>
              {ESTADOS.map(e => (
                <option key={e} value={e}>{ESTADO_CONFIG[e].label}</option>
              ))}
            </select>
          </div>

          {/* Filtro Parque */}
          <div className="w-full sm:w-56">
            <select
              value={filterParque}
              onChange={(e) => setFilterParque(e.target.value)}
              className="w-full h-11 px-3 rounded-2xl border border-border/50 bg-card text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
            >
              <option value="TODOS">Todos los Parques</option>
              {catalogos.parques.map(p => (
                <option key={p.parqId} value={String(p.parqId)}>{p.parqNombre}</option>
              ))}
            </select>
          </div>

          {/* Botón borrar filtros */}
          {(searchTerm || filterEstado !== "TODOS" || filterParque !== "TODOS") && (
            <Button
              variant="ghost"
              onClick={() => { setSearchTerm(""); setFilterEstado("TODOS"); setFilterParque("TODOS"); }}
              className="h-11 px-4 rounded-2xl gap-2 font-bold text-xs w-full sm:w-auto"
            >
              Limpiar filtros
            </Button>
          )}

          <Badge variant="secondary" className="px-4 py-2 text-xs min-h-11 rounded-2xl font-bold border border-border/40 whitespace-nowrap self-stretch flex items-center justify-center">
            {filteredItems.length} de {mantenimientos.length} mantenimientos
          </Badge>
        </div>
      </div>

      {/* Grid de Cards */}
      <div className="rounded-2xl border border-border/10 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center space-y-4">
            <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-muted-foreground">Cargando mantenimientos...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <TreePine className="h-16 w-16 text-muted-foreground/30 mx-auto" />
            <div>
              <h3 className="text-lg font-bold text-muted-foreground">Ningún registro coincide</h3>
              <p className="text-sm text-muted-foreground">
                No se encontraron mantenimientos para los criterios o búsqueda ingresada.
              </p>
            </div>
            {(searchTerm || filterEstado !== "TODOS" || filterParque !== "TODOS") ? (
              <Button onClick={() => { setSearchTerm(""); setFilterEstado("TODOS"); setFilterParque("TODOS"); }} className="gap-2 rounded-xl">
                Restablecer Todo
              </Button>
            ) : (
              <Button onClick={handleCreate} className="gap-2 rounded-xl">
                <Plus className="h-4 w-4" />
                Crear Mantenimiento
              </Button>
            )}
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredItems.map((item) => {
            const estadoConfig =
              ESTADO_CONFIG[item.mantEstado as Estado] ?? ESTADO_CONFIG.PENDIENTE
            const EstadoIcon = estadoConfig.icon

            return (
              <div
                key={item.mantId}
                className="rounded-3xl bg-card border border-border/50 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col justify-between"
              >
                <div>
                  {/* Header Card */}
                  <div className="p-5 border-b border-border/40">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex gap-3 min-w-0">
                        <div className="h-11 w-11 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Wrench className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-extrabold text-sm text-foreground truncate" title={item.mantTitulo}>
                            {item.mantTitulo}
                          </h3>
                          {item.mantObservacion ? (
                            <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                              {item.mantObservacion}
                            </p>
                          ) : (
                            <p className="text-[11px] text-muted-foreground/50 italic mt-1 font-medium">Sin observaciones adicionales</p>
                          )}
                        </div>
                      </div>

                      {/* Acciones */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 rounded-lg hover:bg-muted"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end" className="rounded-xl shadow-md border-border/60">
                          <DropdownMenuItem
                            onClick={() => handleEdit(item)}
                            className="rounded-lg cursor-pointer"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Ver detalles
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => handleEdit(item)}
                            className="rounded-lg cursor-pointer"
                          >
                            <Edit2 className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                        

                          <DropdownMenuSeparator className="bg-border/60" />

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem
                                onSelect={(e) => e.preventDefault()}
                                className="text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/20 rounded-lg cursor-pointer font-bold"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            </AlertDialogTrigger>

                            <AlertDialogContent className="rounded-3xl">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="font-extrabold text-base">
                                  ¿Eliminar programación?
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-xs">
                                  Esta acción dará de baja la programación de mantenimiento para:
                                  <b className="text-foreground block mt-1 py-1 px-2.5 rounded-lg bg-muted text-[11px] font-mono truncate">{item.mantTitulo}</b>
                                </AlertDialogDescription>
                              </AlertDialogHeader>

                              <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-xl text-xs">
                                  Cancelar
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(item)}
                                  className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold"
                                >
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Datos del Mantenimiento */}
                  <div className="p-5 space-y-4">
                    {/* Estado & Parque Row */}
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-1.5 text-muted-foreground min-w-0">
                        <MapPin className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                        <span className="font-bold text-foreground truncate max-w-[130px] md:max-w-[160px]">
                          {item.parqNombre || "Sin asignar"}
                        </span>
                      </div>
                      <Badge className={cn("text-[10px] font-black border px-2 py-0.5 rounded-full select-none", estadoConfig.color)}>
                        <EstadoIcon className="h-3 w-3 mr-1 flex-shrink-0" />
                        {estadoConfig.label}
                      </Badge>
                    </div>

                    {/* Responsable */}
                    <div className="flex items-center gap-2 text-xs">
                      <div className="h-5 w-5 rounded-full bg-primary/20 text-primary font-black text-[9px] flex items-center justify-center flex-shrink-0">
                        {item.responsableNombre ? item.responsableNombre.substring(0, 2).toUpperCase() : "SA"}
                      </div>
                      <span className="text-muted-foreground truncate">
                        Resp: <b className="text-foreground font-bold">{item.responsableNombre || "Sin asignar"}</b>
                      </span>
                    </div>

                    {/* Fechas box */}
                    {(item.mantFechaIni || item.mantFechaFin) && (
                      <div className="rounded-2xl bg-muted/20 border border-border/30 p-3 text-[10px] font-medium space-y-1 font-mono">
                        {item.mantFechaIni && (
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">📅 Inicio:</span>
                            <span className="font-bold text-foreground">
                              {new Date(item.mantFechaIni + "T00:00:00").toLocaleDateString("es-PE")}
                            </span>
                          </div>
                        )}
                        {item.mantFechaFin && (
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">🏁 Límite:</span>
                            <span className="font-bold text-foreground">
                              {new Date(item.mantFechaFin + "T00:00:00").toLocaleDateString("es-PE")}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tipos Badges */}
                    <div className="space-y-1.5">
                      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block">
                        Tipos de Actividad
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {item.timaNombres && item.timaNombres.length > 0 ? (
                          item.timaNombres.map((tipo, idx) => (
                            <Badge
                              key={idx}
                              variant="secondary"
                              className="text-[9px] font-black px-2 py-0 border border-border/50"
                            >
                              {tipo}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-[10px] text-muted-foreground/60 italic font-medium">No se asociaron tipos</span>
                        )}
                      </div>
                    </div>

                    {/* Incidencia en alerta */}
                    {item.inciTitulo && (
                      <div className="rounded-xl bg-amber-500/8 border border-amber-500/10 p-2.5 text-[10px] font-bold text-amber-800 dark:text-amber-400 mt-2 flex items-start gap-1.5 leading-relaxed">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                        <span className="truncate">{item.inciTitulo}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer del card: asignación de personal obrero */}
                <div className="p-5 border-t border-border/40 bg-muted/10 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Personal Asignado
                  </span>
                  
                  {item.obreros && item.obreros.length > 0 ? (
                    <div className="flex items-center gap-2 animate-in fade-in">
                      <div className="flex -space-x-2.5 overflow-hidden">
                        {item.obreros.slice(0, 3).map((obr) => {
                          const oInitials = obr.nombreCompleto.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase();
                          return (
                            <div
                              key={obr.obrId}
                              title={obr.nombreCompleto}
                              className="inline-block h-7 w-7 rounded-lg ring-2 ring-card bg-emerald-600 text-white font-black text-[9px] flex items-center justify-center border border-white dark:border-neutral-900 flex-shrink-0"
                            >
                              {oInitials}
                            </div>
                          );
                        })}
                        {item.obreros.length > 3 && (
                          <div className="inline-block h-7 w-7 rounded-lg ring-2 ring-card bg-muted border border-white dark:border-neutral-900 text-muted-foreground font-black text-[9px] flex items-center justify-center flex-shrink-0">
                            +{item.obreros.length - 3}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <span className="text-[10px] text-muted-foreground/60 italic font-medium">Asignar obreros</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        )}
      </div>
    </div>
  )
}