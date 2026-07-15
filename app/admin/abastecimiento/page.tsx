"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Search, Plus, Edit2, Trash2, CheckCircle2, XCircle,
  Package, ChevronLeft, ChevronRight, Settings, User,
  CalendarDays, ArrowLeft, Save, X, ClipboardList,
  Users, Boxes, StickyNote, ShieldCheck, Eye,
  LogOut, Undo2, Clock, PackageCheck,
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
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const API = "http://localhost:8081/api/abastecimiento"

interface Persona  { persId: number; persDni: string; nombreCompleto: string; persCelu01: string; persEstado: string }
interface Bien     { bienId: number; objNombre: string; bienNumSerie: string; bienPlaca: string; bienEst: string; bienObs: string }
interface DetDTO   { asigDetId: number; bienId: number; objNombre: string; bienPlaca: string; bienNumSerie: string; estado: string }
interface Asignacion {
  asigId?: number; obrId: number; asigFecha?: string
  asigObservacion: string; asigEstado: string; idUsuario?: number
  obreroNombre?: string; obreroDni?: string; obreroCelular?: string
  detalles?: DetDTO[]; bienIds?: number[]
}

const emptyForm = (): Asignacion => ({ obrId: 0, asigObservacion: "", asigEstado: "ACTIVO", bienIds: [] })

// ─────────────────────────────────────────────────────────────────────────────
// DetalleModal — ver bienes de una asignación y gestionar retiros
// ─────────────────────────────────────────────────────────────────────────────
function DetalleModal({ asignacion, open, onClose, onRefresh }: {
  asignacion: Asignacion | null
  open: boolean
  onClose: () => void
  onRefresh: () => void
}) {
  const [detalles, setDetalles]     = useState<DetDTO[]>([])
  const [loading, setLoading]       = useState(false)
  const [procesando, setProcesando] = useState<number | null>(null)

  useEffect(() => {
    if (open && asignacion?.asigId) {
      fetchDetalle(asignacion.asigId)
    }
  }, [open, asignacion])

  const fetchDetalle = async (asigId: number) => {
    setLoading(true)
    try {
      const res = await fetch(`${API}/asignaciones/${asigId}`)
      if (res.ok) {
        const data: Asignacion = await res.json()
        setDetalles(data.detalles ?? [])
      }
    } catch { /* silencioso */ }
    finally { setLoading(false) }
  }

  const handleRetiro = async (det: DetDTO) => {
    const isRetirado = det.estado === "RETIRADO"
    const url = isRetirado
      ? `${API}/detalle/${det.asigDetId}/anular-retiro`
      : `${API}/detalle/${det.asigDetId}/retirar`
    setProcesando(det.asigDetId)
    try {
      const res = await fetch(url, { method: "PATCH" })
      if (res.ok) {
        const updated: DetDTO = await res.json()
        setDetalles(prev => prev.map(d => d.asigDetId === updated.asigDetId ? updated : d))
        onRefresh()
      }
    } finally { setProcesando(null) }
  }

  const formatDate = (d?: string | null) => {
    if (!d) return null
    return new Date(d).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
  }

  if (!asignacion) return null

  const retirados  = detalles.filter(d => d.estado === "RETIRADO").length
  const asignados  = detalles.filter(d => d.estado === "ASIGNADO").length

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[680px] p-0 rounded-3xl border-none shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-card px-8 py-5 border-b border-border/50">
          <DialogHeader>
            <DialogTitle className="text-xl font-black flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <PackageCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xl font-black">Detalle de Asignación #{asignacion.asigId}</p>
                <p className="text-sm font-normal text-muted-foreground mt-0.5">
                  Obrero: <span className="font-semibold text-foreground">{asignacion.obreroNombre}</span>
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>
        </div>

        {/* Stats rápidos */}
        <div className="grid grid-cols-3 gap-3 px-8 pt-5">
          <div className="rounded-xl bg-muted/30 border border-border/40 p-3 text-center">
            <p className="text-2xl font-black">{detalles.length}</p>
            <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider mt-0.5">Total bienes</p>
          </div>
          <div className="rounded-xl bg-emerald-500/8 border border-emerald-500/20 p-3 text-center">
            <p className="text-2xl font-black text-emerald-600">{asignados}</p>
            <p className="text-[10px] font-bold uppercase text-emerald-600/70 tracking-wider mt-0.5">En uso</p>
          </div>
          <div className="rounded-xl bg-orange-500/8 border border-orange-500/20 p-3 text-center">
            <p className="text-2xl font-black text-orange-600">{retirados}</p>
            <p className="text-[10px] font-bold uppercase text-orange-600/70 tracking-wider mt-0.5">Retirados</p>
          </div>
        </div>

        {/* Tabla de detalles */}
        <div className="px-8 pb-6 pt-4">
          <div className="rounded-2xl border border-border/50 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/30">
                <tr className="border-b border-border/50">
                  <th className="text-left px-4 py-3 text-xs font-black uppercase tracking-wider text-muted-foreground">Bien / Material</th>
                  <th className="text-left px-4 py-3 text-xs font-black uppercase tracking-wider text-muted-foreground">F. Asignación</th>
                  <th className="text-left px-4 py-3 text-xs font-black uppercase tracking-wider text-muted-foreground">F. Retiro</th>
                  <th className="text-left px-4 py-3 text-xs font-black uppercase tracking-wider text-muted-foreground">Estado</th>
                  <th className="text-right px-4 py-3 text-xs font-black uppercase tracking-wider text-muted-foreground">Acción</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}><td colSpan={5} className="px-4 py-3"><div className="h-8 rounded-lg bg-muted/30 animate-pulse" /></td></tr>
                  ))
                ) : detalles.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground italic text-sm">Sin materiales registrados</td></tr>
                ) : detalles.map(det => (
                  <tr key={det.asigDetId} className="border-t border-border/30 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-semibold">{det.objNombre}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {[det.bienPlaca && `Placa: ${det.bienPlaca}`, det.bienNumSerie && `S/N: ${det.bienNumSerie}`].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate((det as any).fechaAsignacion) ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {det.estado === "RETIRADO" ? (
                        <span className="text-xs text-orange-600 font-medium flex items-center gap-1">
                          <LogOut className="h-3 w-3" />
                          {formatDate((det as any).fechaRetiro) ?? "—"}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Sin retirar</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {det.estado === "RETIRADO" ? (
                        <Badge variant="outline" className="text-[10px] rounded-lg bg-orange-400/10 text-orange-600 border-orange-400/20 font-bold">
                          <LogOut className="h-2.5 w-2.5 mr-1" /> Retirado
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] rounded-lg bg-emerald-400/10 text-emerald-600 border-emerald-400/20 font-bold">
                          <CheckCircle2 className="h-2.5 w-2.5 mr-1" /> Asignado
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="outline" size="sm"
                        disabled={procesando === det.asigDetId}
                        onClick={() => handleRetiro(det)}
                        className={cn("h-8 rounded-xl text-xs font-bold gap-1.5 transition-all",
                          det.estado === "RETIRADO"
                            ? "border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10"
                            : "border-orange-500/30 text-orange-600 hover:bg-orange-500/10"
                        )}>
                        {procesando === det.asigDetId ? (
                          <div className="h-3 w-3 border border-current border-t-transparent rounded-full animate-spin" />
                        ) : det.estado === "RETIRADO" ? (
                          <><Undo2 className="h-3 w-3" /> Anular retiro</>
                        ) : (
                          <><LogOut className="h-3 w-3" /> Registrar retiro</>
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end mt-4">
            <Button variant="ghost" onClick={onClose} className="h-10 px-6 rounded-2xl font-bold border">
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// FormView — diseño rediseñado en 3 pasos / secciones
// ─────────────────────────────────────────────────────────────────────────────
function FormView({ editingItem, formData, setFormData, onSubmit, onCancel, personal, bienes, loadingCatalog }: {
  editingItem: Asignacion | null
  formData: Asignacion
  setFormData: (d: Asignacion) => void
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
  personal: Persona[]
  bienes: Bien[]
  loadingCatalog: boolean
}) {
  const [searchPersona, setSearchPersona] = useState("")
  const [searchBien,    setSearchBien]    = useState("")

  const filteredPersonal = personal.filter(p =>
    p.nombreCompleto.toLowerCase().includes(searchPersona.toLowerCase()) ||
    p.persDni.includes(searchPersona)
  )
  const filteredBienes = bienes.filter(b =>
    b.objNombre.toLowerCase().includes(searchBien.toLowerCase()) ||
    (b.bienPlaca    ?? "").toLowerCase().includes(searchBien.toLowerCase()) ||
    (b.bienNumSerie ?? "").toLowerCase().includes(searchBien.toLowerCase())
  )

  const toggleBien = (id: number) => {
    const cur  = formData.bienIds ?? []
    const next = cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id]
    setFormData({ ...formData, bienIds: next })
  }

  const selectedPersona  = personal.find(p => p.persId === formData.obrId)
  const selectedBienes   = bienes.filter(b => (formData.bienIds ?? []).includes(b.bienId))
  const isComplete       = !!formData.obrId && (formData.bienIds?.length ?? 0) > 0

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">

      {/* Sub-header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onCancel}
          className="h-10 w-10 rounded-xl p-0 border border-border/50 flex-shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h4 className="text-xl font-black tracking-tight flex items-center gap-2">
            {editingItem ? <Edit2 className="h-5 w-5 text-primary" /> : <Plus className="h-5 w-5 text-primary" />}
            {editingItem ? "Editar Asignación" : "Nueva Asignación de Recursos"}
          </h4>
          <p className="text-sm text-muted-foreground">
            {editingItem
              ? `Modificando asignación #${editingItem.asigId}`
              : "Selecciona el personal y los materiales para la asignación"}
          </p>
        </div>
        {/* Indicador de progreso */}
        <div className="hidden md:flex items-center gap-2 text-xs font-bold text-muted-foreground">
          <span className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all",
            formData.obrId ? "bg-primary/10 text-primary border-primary/20" : "bg-muted/40 border-border/50")}>
            <User className="h-3.5 w-3.5" /> Personal {formData.obrId ? "✓" : ""}
          </span>
          <div className="h-px w-4 bg-border" />
          <span className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all",
            (formData.bienIds?.length ?? 0) > 0 ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-muted/40 border-border/50")}>
            <Boxes className="h-3.5 w-3.5" /> Materiales {(formData.bienIds?.length ?? 0) > 0 ? `✓ (${formData.bienIds?.length})` : ""}
          </span>
          <div className="h-px w-4 bg-border" />
          <span className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all",
            isComplete ? "bg-blue-500/10 text-blue-600 border-blue-500/20" : "bg-muted/40 border-border/50")}>
            <ShieldCheck className="h-3.5 w-3.5" /> Confirmar
          </span>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── PASO 1: Consultar y asignar personal ── */}
          <div className="rounded-2xl border border-border/50 bg-card shadow-sm overflow-hidden">
            {/* header sección */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-border/50 bg-muted/20">
              <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Paso 1</p>
                <p className="text-sm font-bold text-foreground">Consultar Personal</p>
              </div>
              {selectedPersona && (
                <div className="ml-auto h-6 w-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                </div>
              )}
            </div>

            <div className="p-4 space-y-3">
              {/* Obrero seleccionado */}
              {selectedPersona && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/15 animate-in fade-in duration-200">
                  <div className="h-9 w-9 rounded-xl bg-primary text-white font-black text-xs flex items-center justify-center flex-shrink-0">
                    {selectedPersona.nombreCompleto.split(" ").map((w: string) => w[0]).slice(0,2).join("").toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate text-primary">{selectedPersona.nombreCompleto}</p>
                    <p className="text-[11px] text-muted-foreground">DNI: {selectedPersona.persDni} {selectedPersona.persCelu01 ? `· ${selectedPersona.persCelu01}` : ""}</p>
                  </div>
                  <button type="button" onClick={() => setFormData({ ...formData, obrId: 0 })}
                    className="h-6 w-6 rounded-lg hover:bg-rose-100 hover:text-rose-500 flex items-center justify-center transition-colors flex-shrink-0">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {/* Buscador */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Buscar por nombre o DNI..." className="pl-9 h-9 rounded-xl text-sm bg-background"
                  value={searchPersona} onChange={e => setSearchPersona(e.target.value)} />
              </div>

              {/* Lista de personal */}
              <div className="overflow-y-auto space-y-1 pr-1" style={{ maxHeight: 280 }}>
                {loadingCatalog ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-14 rounded-xl bg-muted/30 animate-pulse" />
                  ))
                ) : filteredPersonal.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6 italic">Sin resultados</p>
                ) : filteredPersonal.map(p => (
                  <button key={p.persId} type="button"
                    onClick={() => setFormData({ ...formData, obrId: p.persId })}
                    className={cn("w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all flex items-center gap-3 group",
                      formData.obrId === p.persId
                        ? "bg-primary text-white shadow-md shadow-primary/20"
                        : "hover:bg-muted/60 text-foreground border border-transparent hover:border-border/50"
                    )}>
                    <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center font-black text-[11px] flex-shrink-0 transition-colors",
                      formData.obrId === p.persId ? "bg-white/20 text-white" : "bg-primary/10 text-primary group-hover:bg-primary/20")}>
                      {p.nombreCompleto.split(" ").map((w: string) => w[0]).slice(0,2).join("").toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold truncate text-[13px]">{p.nombreCompleto}</p>
                      <p className={cn("text-[11px] truncate", formData.obrId === p.persId ? "text-white/70" : "text-muted-foreground")}>
                        {p.persDni}
                      </p>
                    </div>
                    {formData.obrId === p.persId && <CheckCircle2 className="h-4 w-4 text-white flex-shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── PASO 2: Consultar y asignar materiales ── */}
          <div className="rounded-2xl border border-border/50 bg-card shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-border/50 bg-muted/20">
              <div className="h-8 w-8 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                <Boxes className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Paso 2</p>
                <p className="text-sm font-bold text-foreground">Consultar Materiales</p>
              </div>
              {(formData.bienIds?.length ?? 0) > 0 && (
                <div className="ml-auto flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-full px-2.5 py-0.5 flex-shrink-0">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span className="text-[11px] font-black">{formData.bienIds?.length}</span>
                </div>
              )}
            </div>

            <div className="p-4 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Nombre, placa o serie..." className="pl-9 h-9 rounded-xl text-sm bg-background"
                  value={searchBien} onChange={e => setSearchBien(e.target.value)} />
              </div>

              <div className="overflow-y-auto space-y-1 pr-1" style={{ maxHeight: 320 }}>
                {loadingCatalog ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-14 rounded-xl bg-muted/30 animate-pulse" />
                  ))
                ) : filteredBienes.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6 italic">Sin resultados</p>
                ) : filteredBienes.map(b => {
                  const selected = (formData.bienIds ?? []).includes(b.bienId)
                  return (
                    <button key={b.bienId} type="button" onClick={() => toggleBien(b.bienId)}
                      className={cn("w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all flex items-center gap-3 group",
                        selected
                          ? "bg-emerald-500/8 border border-emerald-500/25 shadow-sm"
                          : "hover:bg-muted/60 border border-transparent hover:border-border/50"
                      )}>
                      <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all",
                        selected ? "bg-emerald-500 shadow-sm shadow-emerald-500/30" : "bg-muted group-hover:bg-muted/80")}>
                        {selected
                          ? <CheckCircle2 className="h-4 w-4 text-white" />
                          : <Package className="h-4 w-4 text-muted-foreground" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={cn("font-semibold text-[13px] truncate", selected && "text-emerald-700 dark:text-emerald-400")}>
                          {b.objNombre}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {[b.bienPlaca && `Placa: ${b.bienPlaca}`, b.bienNumSerie && `S/N: ${b.bienNumSerie}`].filter(Boolean).join(" · ") || "Sin identificador"}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* ── PASO 3: Confirmar asignación ── */}
          <div className="rounded-2xl border border-border/50 bg-card shadow-sm overflow-hidden flex flex-col">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-border/50 bg-muted/20">
              <div className="h-8 w-8 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <ClipboardList className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Paso 3</p>
                <p className="text-sm font-bold text-foreground">Confirmar Asignación</p>
              </div>
            </div>

            <div className="p-4 flex flex-col gap-4 flex-1">

              {/* Resumen personal */}
              <div className="rounded-xl border border-border/40 overflow-hidden">
                <div className="px-3 py-2 bg-muted/30 flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Personal asignado</span>
                </div>
                <div className="px-3 py-3">
                  {selectedPersona ? (
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary font-black text-[11px] flex items-center justify-center flex-shrink-0">
                        {selectedPersona.nombreCompleto.split(" ").map((w: string) => w[0]).slice(0,2).join("").toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-sm">{selectedPersona.nombreCompleto}</p>
                        <p className="text-[11px] text-muted-foreground">DNI: {selectedPersona.persDni}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No seleccionado</p>
                  )}
                </div>
              </div>

              {/* Resumen materiales */}
              <div className="rounded-xl border border-border/40 overflow-hidden flex-1">
                <div className="px-3 py-2 bg-muted/30 flex items-center gap-2">
                  <Boxes className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Materiales ({selectedBienes.length})
                  </span>
                </div>
                <div className="px-3 py-2 overflow-y-auto" style={{ maxHeight: 130 }}>
                  {selectedBienes.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic py-2">Ninguno seleccionado</p>
                  ) : (
                    <div className="space-y-1.5">
                      {selectedBienes.map(b => (
                        <div key={b.bienId} className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                          <span className="text-[12px] truncate flex-1">{b.objNombre}</span>
                          <button type="button" onClick={() => toggleBien(b.bienId)}
                            className="text-muted-foreground hover:text-rose-500 transition-colors flex-shrink-0">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Observación */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  <StickyNote className="h-3.5 w-3.5" /> Observación
                </label>
                <textarea rows={3} placeholder="Notas adicionales sobre la asignación..."
                  className="w-full px-3 py-2.5 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                  value={formData.asigObservacion}
                  onChange={e => setFormData({ ...formData, asigObservacion: e.target.value })}
                />
              </div>

              {/* Estado (solo edición) */}
              {editingItem && (
                <label className="flex items-center gap-3 p-3 rounded-xl bg-emerald-400/5 border border-emerald-400/15 cursor-pointer select-none">
                  <input type="checkbox" className="h-4 w-4 rounded accent-emerald-500"
                    checked={formData.asigEstado === "ACTIVO"}
                    onChange={e => setFormData({ ...formData, asigEstado: e.target.checked ? "ACTIVO" : "INACTIVO" })}
                  />
                  <span className="text-sm font-bold text-emerald-600">Asignación activa</span>
                </label>
              )}

              {/* Botones */}
              <div className="flex flex-col gap-3 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  className="w-full h-11 rounded-2xl font-bold"
                >
                  <ArrowLeft className="h-4 w-4 mr-1.5" />
                  Cancelar
                </Button>

                <Button
                  type="submit"
                  disabled={!isComplete}
                  className={cn(
                    "w-full h-11 rounded-2xl font-black gap-2 transition-all",
                    isComplete
                      ? "bg-primary shadow-lg shadow-primary/20"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  )}
                >
                  <Save className="h-4 w-4" />
                  {editingItem ? "Guardar Cambios" : "Confirmar Asignación"}
                </Button>
              </div>
            </div>
          </div>

        </div>
      </form>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Página principal
// ─────────────────────────────────────────────────────────────────────────────
export default function AbastecimientoPage() {
  const { user } = useAuth()
  const [view, setView]                 = useState<"table" | "form">("table")
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([])
  const [personal, setPersonal]         = useState<Persona[]>([])
  const [bienes, setBienes]             = useState<Bien[]>([])
  const [loading, setLoading]           = useState(true)
  const [loadingCatalog, setLoadingCatalog] = useState(false)
  const [editingItem, setEditingItem]   = useState<Asignacion | null>(null)
  const [formData, setFormData]         = useState<Asignacion>(emptyForm())
  const [detalleItem, setDetalleItem]   = useState<Asignacion | null>(null)
  const [detalleOpen, setDetalleOpen]   = useState(false)
  const [search, setSearch]             = useState("")
  const [filterEstado, setFilterEstado] = useState<"all" | "ACTIVO" | "INACTIVO">("all")
  const [currentPage, setCurrentPage]   = useState(1)
  const ITEMS_PER_PAGE = 10

  useEffect(() => { fetchAsignaciones() }, [])

  const fetchAsignaciones = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API}/asignaciones`)
      if (res.ok) setAsignaciones(await res.json())
      else toast.error("Error al cargar asignaciones")
    } catch { toast.error("Error de conexión") }
    finally { setLoading(false) }
  }

  const fetchCatalog = useCallback(async () => {
    setLoadingCatalog(true)
    try {
      const [pRes, bRes] = await Promise.all([
        fetch(`${API}/consultar-personal-mantenimiento`),
        fetch(`${API}/consultar-recursos-materiales`),
      ])
      if (pRes.ok) setPersonal(await pRes.json())
      if (bRes.ok) setBienes(await bRes.json())
    } catch { toast.error("Error al cargar catálogos") }
    finally { setLoadingCatalog(false) }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.obrId)             { toast.error("Selecciona un obrero");          return }
    if (!formData.bienIds?.length)   { toast.error("Selecciona al menos un bien");   return }

    const payload = { ...formData, idUsuario: user?.id }
    const method  = editingItem ? "PUT" : "POST"
    const url     = editingItem
      ? `${API}/asignaciones/${editingItem.asigId}`
      : `${API}/asignar-recurso-materiales`

    try {
      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        await logAction(editingItem ? "Actualización" : "Creación", "Abastecimiento",
          `Asignación ${editingItem ? "actualizada" : "creada"}`, user?.id)
        toast.success(editingItem ? "Asignación actualizada" : "Asignación creada")
        goToTable()
        fetchAsignaciones()
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.message || "Error al guardar")
      }
    } catch { toast.error("Error de conexión") }
  }

  const handleToggleEstado = async (item: Asignacion) => {
    const isActive = item.asigEstado === "ACTIVO"
    const url    = isActive ? `${API}/asignaciones/${item.asigId}` : `${API}/asignaciones/${item.asigId}/reactivar`
    const method = isActive ? "DELETE" : "PATCH"
    try {
      const res = await fetch(url, { method })
      if (res.ok) { toast.success(isActive ? "Asignación desactivada" : "Asignación reactivada"); fetchAsignaciones() }
      else toast.error("Error al cambiar estado")
    } catch { toast.error("Error de conexión") }
  }

  const goToCreate = () => { setEditingItem(null); setFormData(emptyForm()); fetchCatalog(); setView("form") }
  const goToEdit   = (item: Asignacion) => {
    setEditingItem(item)
    setFormData({ ...item, bienIds: item.detalles?.map(d => d.bienId) ?? [] })
    fetchCatalog()
    setView("form")
  }
  const goToTable  = () => { setView("table"); setEditingItem(null); setFormData(emptyForm()) }
  const openDetalle = (item: Asignacion) => { setDetalleItem(item); setDetalleOpen(true) }

  const formatDate = (d?: string) => !d ? "—" : new Date(d).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })

  const filtered   = asignaciones.filter(a => {
    const matchSearch = (a.obreroNombre ?? "").toLowerCase().includes(search.toLowerCase()) || (a.obreroDni ?? "").includes(search)
    return (filterEstado === "all" || a.asigEstado === filterEstado) && matchSearch
  })
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const paginated  = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
  const totalActivos   = asignaciones.filter(a => a.asigEstado === "ACTIVO").length
  const totalInactivos = asignaciones.filter(a => a.asigEstado === "INACTIVO").length

  if (view === "form") return (
    <FormView editingItem={editingItem} formData={formData} setFormData={setFormData}
      onSubmit={handleSubmit} onCancel={goToTable}
      personal={personal} bienes={bienes} loadingCatalog={loadingCatalog} />
  )

  return (    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h4 className="text-2xl font-black tracking-tight flex items-center gap-3">
            <Package className="h-6 w-6 text-primary" /> Gestión de Abastecimiento
          </h4>
          <p className="text-muted-foreground mt-1 font-medium">Asignación de personal y materiales para mantenimiento de parques.</p>
        </div>
        <Button onClick={goToCreate} className="rounded-xl h-11 px-6 font-bold gap-2">
          <Plus className="h-5 w-5" /> Nueva Asignación
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Total", value: asignaciones.length, icon: Package, color: "bg-primary/10 text-primary", text: "" },
          { label: "Activas", value: totalActivos, icon: CheckCircle2, color: "bg-emerald-500/10 text-emerald-500", text: "text-emerald-500" },
          { label: "Inactivas", value: totalInactivos, icon: XCircle, color: "bg-rose-500/10 text-rose-500", text: "text-rose-500" },
        ].map(c => (
          <Card key={c.label} className="bg-card shadow-md dark:border border-0">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{c.label}</p>
                  <p className={cn("text-3xl font-black mt-1", c.text)}>{c.value}</p>
                </div>
                <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center", c.color)}>
                  <c.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="rounded-2xl bg-card shadow-md dark:border border-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/50 px-6 py-4">
          <h2 className="text-lg font-black">Listado de Asignaciones</h2>
          <div className="flex flex-col md:flex-row md:items-center gap-3 w-full md:w-auto">
            <div className="flex gap-2">
              {(["all", "ACTIVO", "INACTIVO"] as const).map(val => (
                <button key={val} onClick={() => { setFilterEstado(val); setCurrentPage(1) }}
                  className={cn("px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border transition-all",
                    filterEstado === val ? "bg-primary text-white border-primary" : "bg-background border-border/50 text-muted-foreground hover:bg-muted"
                  )}>
                  {val === "all" ? "Todos" : val === "ACTIVO" ? "Activos" : "Inactivos"}
                </button>
              ))}
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por obrero o DNI..."
                className="pl-10 h-10 rounded-xl bg-background border-border/50"
                value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1) }} />
            </div>
          </div>
        </div>

        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="hover:bg-transparent border-border/50">
              <TableHead className="font-bold py-4 pl-6">#</TableHead>
              <TableHead className="font-bold">Obrero</TableHead>
              <TableHead className="font-bold">Materiales Asignados</TableHead>
              <TableHead className="font-bold">Observación</TableHead>
              <TableHead className="font-bold">Fecha</TableHead>
              <TableHead className="font-bold">Estado</TableHead>
              <TableHead className="text-right font-bold pr-8">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}><TableCell colSpan={7} className="h-16 animate-pulse bg-muted/10" /></TableRow>
              ))
            ) : paginated.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="h-32 text-center text-muted-foreground font-medium">Sin asignaciones registradas.</TableCell></TableRow>
            ) : paginated.map((item, idx) => (
              <TableRow key={item.asigId} className="hover:bg-muted/30 transition-colors border-border/40">
                <TableCell className="pl-6 text-muted-foreground font-mono text-xs">{(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}</TableCell>
                <TableCell className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-sm flex-shrink-0">
                      {item.obreroNombre ? item.obreroNombre.split(" ").map((w: string) => w[0]).slice(0,2).join("").toUpperCase() : <User className="h-5 w-5" />}
                    </div>
                    <div>
                      <p className="font-bold text-sm">{item.obreroNombre || `Obrero #${item.obrId}`}</p>
                      <p className="text-xs text-muted-foreground">{item.obreroDni ? `DNI: ${item.obreroDni}` : ""}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1 max-w-[220px]">
                    {(item.detalles ?? []).slice(0, 2).map(d => (
                      <Badge key={d.asigDetId} variant="outline" className="text-[10px] rounded-lg bg-muted/50 font-medium max-w-[100px] truncate">
                        {d.objNombre}
                      </Badge>
                    ))}
                    {(item.detalles?.length ?? 0) > 2 && (
                      <Badge variant="outline" className="text-[10px] rounded-lg bg-primary/10 text-primary font-bold">
                        +{(item.detalles?.length ?? 0) - 2}
                      </Badge>
                    )}
                    {!(item.detalles?.length) && <span className="text-xs text-muted-foreground italic">Sin materiales</span>}
                  </div>
                </TableCell>
                <TableCell className="max-w-[160px]">
                  <span className="text-sm text-muted-foreground line-clamp-1">{item.asigObservacion || "—"}</span>
                </TableCell>
                <TableCell>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5" />{formatDate(item.asigFecha)}
                  </span>
                </TableCell>
                <TableCell>
                  {item.asigEstado === "ACTIVO"
                    ? <Badge variant="outline" className="rounded-lg font-bold bg-emerald-400/10 text-emerald-500 border-emerald-400/20"><CheckCircle2 className="h-3 w-3 mr-1" />Activo</Badge>
                    : <Badge variant="outline" className="rounded-lg font-bold bg-rose-400/10 text-rose-500 border-rose-400/20"><XCircle className="h-3 w-3 mr-1" />Inactivo</Badge>
                  }
                </TableCell>
                <TableCell className="text-right pr-8">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl border border-border/50"><Settings className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 p-2 rounded-xl shadow-xl">
                      <DropdownMenuLabel className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-2 pb-2">Opciones</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => openDetalle(item)} className="rounded-lg gap-2 font-bold cursor-pointer">
                        <Eye className="h-4 w-4 text-emerald-500" /> Ver detalle
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => goToEdit(item)} className="rounded-lg gap-2 font-bold cursor-pointer">
                        <Edit2 className="h-4 w-4 text-blue-500" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="my-1" />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem onSelect={e => e.preventDefault()}
                            className={cn("rounded-lg gap-2 font-bold cursor-pointer",
                              item.asigEstado === "ACTIVO" ? "text-rose-500 hover:bg-rose-500/10" : "text-emerald-500 hover:bg-emerald-500/10")}>
                            {item.asigEstado === "ACTIVO" ? <><Trash2 className="h-4 w-4" />Desactivar</> : <><CheckCircle2 className="h-4 w-4" />Reactivar</>}
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-3xl">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="font-black text-xl">{item.asigEstado === "ACTIVO" ? "Confirmar Desactivación" : "Confirmar Reactivación"}</AlertDialogTitle>
                            <AlertDialogDescription>¿Seguro que deseas {item.asigEstado === "ACTIVO" ? "desactivar" : "reactivar"} la asignación <b>#{item.asigId}</b>?</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-xl font-bold">Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleToggleEstado(item)} className="rounded-xl font-black bg-primary">Confirmar</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {!loading && filtered.length > 0 && totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-8 py-6 border-t border-border/30">
            <p className="text-sm text-muted-foreground">
              Mostrando <span className="font-bold text-foreground">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span>–<span className="font-bold text-foreground">{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)}</span> de <span className="font-bold text-foreground">{filtered.length}</span>
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(p-1,1))} disabled={currentPage===1} className="rounded-xl font-bold h-10 disabled:opacity-50"><ChevronLeft className="h-4 w-4 mr-1"/>Anterior</Button>
              {Array.from({length: Math.min(totalPages,5)},(_,i)=>{
                let p = totalPages<=5?i+1:currentPage<=3?i+1:currentPage>=totalPages-2?totalPages-4+i:currentPage-2+i
                return <Button key={p} variant={currentPage===p?"default":"outline"} size="sm" onClick={()=>setCurrentPage(p)} className={cn("w-10 h-10 rounded-xl font-bold",currentPage===p?"bg-primary text-white shadow-md":"border-border/50 bg-card hover:bg-muted/50")}>{p}</Button>
              })}
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(p+1,totalPages))} disabled={currentPage===totalPages} className="rounded-xl font-bold h-10 disabled:opacity-50">Siguiente<ChevronRight className="h-4 w-4 ml-1"/></Button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de detalle con gestión de retiros */}
      <DetalleModal
        asignacion={detalleItem}
        open={detalleOpen}
        onClose={() => setDetalleOpen(false)}
        onRefresh={fetchAsignaciones}
      />
    </div>
  )
}