"use client"

import { useState, useEffect, useMemo } from "react"
import {
  Search,
  Trash2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  TriangleAlert,
  ChevronLeft,
  ChevronRight,
  Settings,
  MapPin,
  CalendarDays,
  SearchIcon,
  Clock,
  User,
  Phone,
  Mail,
  IdCard,
  FileText,
  Eye,
  Loader2,
  AlertCircle,
  CircleDot,
  Flame,
  Minus,
  ArrowUpRight,
  Plus,
} from "lucide-react"
import { logAction } from "@/lib/logging"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const API_BASE = "http://localhost:8081/api"
const API_INCIDENCIAS = `${API_BASE}/incidencias`
const API_CIUDADANOS = `${API_BASE}/ciudadanos`

// ─────────────────────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────────────────────
interface Incidencia {
  inciId?: number
  ciudId?: number
  ciudNombreCompleto?: string
  inciTitulo: string
  inciDescripcion: string
  inciDireccion: string
  inciReferencia: string
  inciEstado: string
  inciPrioridad: string
  inciObservacion: string
  inciFechCrea?: string
  idUsuario?: number
}

interface Ciudadano {
  ciudId?: number
  ciudNombres: string
  ciudApellidos: string
  ciudTipoDocumento: string
  ciudNumeroDocumento: string
  ciudTelefono: string
  ciudEmail: string
  ciudDireccion: string
  ciudEstado: string
  ciudFechaRegistro?: string
}

const ESTADOS = ["PENDIENTE", "EN_PROCESO", "RESUELTO", "CANCELADO"] as const
const PRIORIDADES = ["ALTA", "MEDIA", "BAJA"] as const

type Estado = (typeof ESTADOS)[number]
type Prioridad = (typeof PRIORIDADES)[number]

// ─────────────────────────────────────────────────────────────────────────────
// Helpers visuales
// ─────────────────────────────────────────────────────────────────────────────
const ESTADO_CONFIG: Record<string, { label: string; className: string; icon: any }> = {
  PENDIENTE:  { label: "Pendiente",  className: "bg-amber-400/10 text-amber-500 border-amber-400/20",   icon: Clock },
  EN_PROCESO: { label: "En Proceso", className: "bg-sky-400/10 text-sky-500 border-sky-400/20",         icon: RefreshCw },
  RESUELTO:   { label: "Resuelto",   className: "bg-emerald-400/10 text-emerald-500 border-emerald-400/20", icon: CheckCircle2 },
  CANCELADO:  { label: "Cancelado",  className: "bg-rose-400/10 text-rose-500 border-rose-400/20",       icon: XCircle },
}

const PRIORIDAD_CONFIG: Record<string, { label: string; className: string; icon: any }> = {
  ALTA:  { label: "Alta",  className: "bg-rose-400/10 text-rose-500 border-rose-400/20",   icon: Flame },
  MEDIA: { label: "Media", className: "bg-amber-400/10 text-amber-500 border-amber-400/20", icon: ArrowUpRight },
  BAJA:  { label: "Baja",  className: "bg-slate-400/10 text-slate-500 border-slate-400/20", icon: Minus },
}

const emptyDetail = (): Incidencia => ({
  inciTitulo: "",
  inciDescripcion: "",
  inciDireccion: "",
  inciReferencia: "",
  inciEstado: "PENDIENTE",
  inciPrioridad: "MEDIA",
  inciObservacion: "",
})


// ─────────────────────────────────────────────────────────────────────────────
// Componente: EstadoBadge / PrioridadBadge
// ─────────────────────────────────────────────────────────────────────────────
function EstadoBadge({ estado }: { estado: string }) {
  const cfg = ESTADO_CONFIG[estado] ?? ESTADO_CONFIG.PENDIENTE
  const Icon = cfg.icon
  return (
    <Badge variant="outline" className={cn("rounded-lg px-2.5 py-0.5 border font-bold", cfg.className)}>
      <Icon className="h-3 w-3 mr-1" /> {cfg.label}
    </Badge>
  )
}

function PrioridadBadge({ prioridad }: { prioridad: string }) {
  const cfg = PRIORIDAD_CONFIG[prioridad] ?? PRIORIDAD_CONFIG.MEDIA
  const Icon = cfg.icon
  return (
    <Badge variant="outline" className={cn("rounded-lg px-2.5 py-0.5 border font-bold", cfg.className)}>
      <Icon className="h-3 w-3 mr-1" /> {cfg.label}
    </Badge>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Página principal
// ─────────────────────────────────────────────────────────────────────────────
export default function IncidenciasPage() {
  const { user } = useAuth()

  const [incidencias, setIncidencias] = useState<Incidencia[]>([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState("")
  const [filterEstado, setFilterEstado]     = useState<"all" | Estado>("all")
  const [filterPrioridad, setFilterPrioridad] = useState<"all" | Prioridad>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 10

  // ── Diálogo de detalle ──
  const [detailOpen, setDetailOpen]       = useState(false)
  const [selected, setSelected]           = useState<Incidencia | null>(null)
  const [editData, setEditData]           = useState<Incidencia>(emptyDetail())
  const [ciudadano, setCiudadano]         = useState<Ciudadano | null>(null)
  const [loadingCiudadano, setLoadingCiudadano] = useState(false)
  const [saving, setSaving]               = useState(false)

  useEffect(() => { fetchIncidencias() }, [])

  const fetchIncidencias = async () => {
    setLoading(true)
    try {
      const res = await fetch(API_INCIDENCIAS)
      if (res.ok) setIncidencias(await res.json())
      else toast.error("Error al cargar incidencias")
    } catch {
      toast.error("Error de conexión con el servidor")
    } finally {
      setLoading(false)
    }
  }

  const openDetail = async (item: Incidencia) => {
    setSelected(item)
    setEditData({ ...item })
    setDetailOpen(true)
    setCiudadano(null)

    if (item.ciudId) {
      setLoadingCiudadano(true)
      try {
        const res = await fetch(`${API_CIUDADANOS}/${item.ciudId}`)
        if (res.ok) setCiudadano(await res.json())
      } catch {
        // silencioso: el detalle del ciudadano es informativo, no bloquea el flujo
      } finally {
        setLoadingCiudadano(false)
      }
    }
  }

  const closeDetail = () => {
    setDetailOpen(false)
    setSelected(null)
    setCiudadano(null)
    setEditData(emptyDetail())
  }

  const handleSaveDetail = async () => {
    if (!selected?.inciId) return
    setSaving(true)
    try {
      const res = await fetch(`${API_INCIDENCIAS}/${selected.inciId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      })
      if (res.ok) {
        await logAction(
          "Actualización",
          "Incidencias",
          `Incidencia actualizada: ${editData.inciTitulo} (estado: ${editData.inciEstado})`,
          user?.id
        )
        toast.success("Incidencia actualizada correctamente")
        closeDetail()
        fetchIncidencias()
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.message || "Error al actualizar la incidencia")
      }
    } catch {
      toast.error("Error de conexión")
    } finally {
      setSaving(false)
    }
  }

  const handleQuickEstado = async (item: Incidencia, nuevoEstado: string) => {
    if (!item.inciId) return
    try {
      const res = await fetch(`${API_INCIDENCIAS}/${item.inciId}/estado`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado }),
      })
      if (res.ok) {
        await logAction("Cambio de estado", "Incidencias", `Incidencia "${item.inciTitulo}" → ${nuevoEstado}`, user?.id)
        toast.success("Estado actualizado")
        fetchIncidencias()
      } else {
        toast.error("Error al cambiar el estado")
      }
    } catch {
      toast.error("Error de conexión")
    }
  }

  const handleCancelar = async (item: Incidencia) => {
    if (!item.inciId) return
    try {
      const res = await fetch(`${API_INCIDENCIAS}/${item.inciId}`, { method: "DELETE" })
      if (res.ok) {
        await logAction("Cancelación", "Incidencias", `Incidencia cancelada: ${item.inciTitulo}`, user?.id)
        toast.success("Incidencia cancelada")
        fetchIncidencias()
      } else {
        toast.error("Error al cancelar la incidencia")
      }
    } catch {
      toast.error("Error de conexión")
    }
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—"
    return new Date(dateStr).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })
  }

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return "—"
    return new Date(dateStr).toLocaleString("es-PE", {
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    })
  }

  // ── Filtros ──
  const filtered = useMemo(() => {
    return incidencias.filter((i) => {
      const matchSearch =
        i.inciTitulo.toLowerCase().includes(search.toLowerCase()) ||
        (i.inciDireccion ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (i.ciudNombreCompleto ?? "").toLowerCase().includes(search.toLowerCase())
      const matchEstado = filterEstado === "all" || i.inciEstado === filterEstado
      const matchPrioridad = filterPrioridad === "all" || i.inciPrioridad === filterPrioridad
      return matchSearch && matchEstado && matchPrioridad
    })
  }, [incidencias, search, filterEstado, filterPrioridad])

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const paginated  = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const counts = useMemo(() => {
    const c: Record<string, number> = { PENDIENTE: 0, EN_PROCESO: 0, RESUELTO: 0, CANCELADO: 0 }
    incidencias.forEach((i) => { c[i.inciEstado] = (c[i.inciEstado] ?? 0) + 1 })
    return c
  }, [incidencias])
  
  // ── Diálogo de nueva incidencia ──
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating]     = useState(false)
  const [docBusqueda, setDocBusqueda] = useState("")
  const [buscandoCiud, setBuscandoCiud] = useState(false)
  const [ciudEncontrado, setCiudEncontrado] = useState<Ciudadano | null>(null)
  const [ciudNoEncontrado, setCiudNoEncontrado] = useState(false)

  const emptyCiudForm = (): Ciudadano => ({
    ciudNombres: "",
    ciudApellidos: "",
    ciudTipoDocumento: "DNI",
    ciudNumeroDocumento: "",
    ciudTelefono: "",
    ciudEmail: "",
    ciudDireccion: "",
    ciudEstado: "A",
  })

  const [ciudForm, setCiudForm]   = useState<Ciudadano>(emptyCiudForm())
  const [inciForm, setInciForm]   = useState<Incidencia>(emptyDetail())
  const resetCreateForm = () => {
    setDocBusqueda("")
    setCiudEncontrado(null)
    setCiudNoEncontrado(false)
    setCiudForm(emptyCiudForm())
    setInciForm(emptyDetail())
  }

  const openCreate = () => {
    resetCreateForm()
    setCreateOpen(true)
  }

  const closeCreate = () => {
    setCreateOpen(false)
    resetCreateForm()
  }

  // Busca al ciudadano por número de documento antes de registrar
  const handleBuscarCiudadano = async () => {
    if (!docBusqueda.trim()) {
      toast.error("Ingresa un número de documento para buscar")
      return
    }
    setBuscandoCiud(true)
    setCiudEncontrado(null)
    setCiudNoEncontrado(false)
    try {
      const res = await fetch(`${API_CIUDADANOS}`)
      if (res.ok) {
        const lista: Ciudadano[] = await res.json()
        const encontrado = lista.find((c) => c.ciudNumeroDocumento === docBusqueda.trim())
        if (encontrado) {
          setCiudEncontrado(encontrado)
          setCiudForm(encontrado)
        } else {
          setCiudNoEncontrado(true)
          setCiudForm({ ...emptyCiudForm(), ciudNumeroDocumento: docBusqueda.trim() })
        }
      }
    } catch {
      toast.error("Error al buscar el ciudadano")
    } finally {
      setBuscandoCiud(false)
    }
  }

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!ciudForm.ciudNumeroDocumento.trim() || !ciudForm.ciudNombres.trim() || !ciudForm.ciudApellidos.trim()) {
      toast.error("Completa los datos obligatorios del ciudadano")
      return
    }
    if (!inciForm.inciTitulo.trim() || !inciForm.inciDescripcion.trim()) {
      toast.error("Completa el título y la descripción de la incidencia")
      return
    }

    setCreating(true)
    try {
      const res = await fetch(`${API_INCIDENCIAS}/registrar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ciudadano: ciudForm,
          incidencia: inciForm,
        }),
      })
      if (res.ok) {
        await logAction("Creación", "Incidencias", `Incidencia registrada: ${inciForm.inciTitulo}`, user?.id)
        toast.success("Incidencia registrada correctamente")
        closeCreate()
        fetchIncidencias()
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.message || "Error al registrar la incidencia")
      }
    } catch {
      toast.error("Error de conexión")
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h4 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-3">
            <TriangleAlert className="h-6 w-6 text-primary" />
            Gestión de Incidencias Recibidas
          </h4>
          <p className="text-muted-foreground mt-1 font-medium">
            Visualiza, revisa y administra las incidencias reportadas por los ciudadanos.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={fetchIncidencias} className="rounded-xl h-11 px-5 font-bold gap-2 border-border/50">
            <RefreshCw className="h-4 w-4" /> Actualizar
          </Button>
          <Button onClick={openCreate} className="rounded-xl h-11 px-6 font-bold gap-2">
            <Plus className="h-5 w-5" /> Nueva Incidencia
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 items-start">

        {/* ══════════════════════════
            PANEL SUPERIOR — EN UNA FILA
        ══════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 items-stretch">

        {/* ==========================
            RESUMEN TOTAL
        =========================== */}
        <Card className="bg-card rounded-2xl shadow-md dark:border border-0">
          <CardContent className="p-5 h-25">
            <div className="flex items-center justify-between h-full">

              <div>
                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                  Total Incidencias
                </p>

                <p className="text-4xl font-black mt-2 text-foreground">
                  {incidencias.length}
                </p>

                <span className="text-xs text-muted-foreground">
                  Registradas actualmente
                </span>
              </div>


              <div className="h-14 w-14 rounded-2xl flex items-center justify-center bg-primary/10 text-primary">
                <TriangleAlert className="h-7 w-7" />
              </div>

            </div>
          </CardContent>
        </Card>



        {/* ==========================
            FILTRO ESTADO
        =========================== */}
        <div className="md:col-span-2 bg-card rounded-2xl shadow-md dark:border border-0 p-5">

          <div className="flex items-center justify-between mb-4">

            <h5 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <CircleDot className="h-4 w-4" />
              Estado
            </h5>

          </div>


          <div className="flex flex-wrap gap-2">

            <button
              onClick={() => {
                setFilterEstado("all")
                setCurrentPage(1)
              }}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border transition-all",
                filterEstado === "all"
                  ? "bg-primary text-white border-primary shadow-sm"
                  : "bg-background border-border/50 text-muted-foreground hover:bg-muted"
              )}
            >
              Todos ({incidencias.length})
            </button>


            {ESTADOS.map((estado)=>{

              const cfg = ESTADO_CONFIG[estado]
              const Icon = cfg.icon


              return (

                <button
                  key={estado}
                  onClick={()=>{
                    setFilterEstado(estado)
                    setCurrentPage(1)
                  }}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border transition-all",
                    filterEstado === estado
                    ? "bg-primary text-white border-primary shadow-sm"
                    : "bg-background border-border/50 text-muted-foreground hover:bg-muted"
                  )}
                >

                  <Icon className="h-4 w-4"/>

                  {cfg.label}

                  <span className="opacity-70">
                    ({counts[estado] ?? 0})
                  </span>

                </button>

              )

            })}


          </div>

        </div>




        {/* ==========================
            FILTRO PRIORIDAD
        =========================== */}
        <div className="bg-card rounded-2xl border-0 border-border/50 dark:border shadow-md p-5">

          <h5 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-4">

            <Flame className="h-4 w-4"/>

            Prioridad

          </h5>


          <div className="flex flex-wrap gap-2">


            <button
              onClick={()=>{
                setFilterPrioridad("all")
                setCurrentPage(1)
              }}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border transition-all",
                filterPrioridad==="all"
                ? "bg-primary text-white border-primary shadow-sm"
                : "bg-background border-border/50 text-muted-foreground hover:bg-muted"
              )}
            >
              Todas
            </button>



            {PRIORIDADES.map((p)=>(

              <button
                key={p}
                onClick={()=>{
                  setFilterPrioridad(p)
                  setCurrentPage(1)
                }}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border transition-all",
                  filterPrioridad===p
                  ? "bg-primary text-white border-primary shadow-sm"
                  : "bg-background border-border/50 text-muted-foreground hover:bg-muted"
                )}
              >

                {PRIORIDAD_CONFIG[p].label}

              </button>

            ))}


          </div>


        </div>

      </div>

        {/* ══════════════════════════
            PANEL DERECHO — TABLA
        ══════════════════════════ */}
        <div className="rounded-2xl bg-card shadow-md dark:border border-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/50 px-6 py-4">
            <h2 className="text-lg font-black text-foreground">Listado de Incidencias</h2>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por título, dirección o ciudadano..."
                className="pl-10 h-10 rounded-xl bg-card border-border/50"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
              />
            </div>
          </div>

          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-border/50">
                <TableHead className="font-bold py-4 pl-6">#</TableHead>
                <TableHead className="font-bold">Ciudadano</TableHead>
                <TableHead className="font-bold">Título</TableHead>
                <TableHead className="font-bold">Prioridad</TableHead>
                <TableHead className="font-bold">Estado</TableHead>
                <TableHead className="font-bold">Fecha</TableHead>
                <TableHead className="text-right font-bold pr-8">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}><TableCell colSpan={7} className="h-16 animate-pulse bg-muted/10" /></TableRow>
                ))
              ) : paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground font-medium">
                    No se encontraron incidencias.
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((item, idx) => (
                  <TableRow key={item.inciId} className="hover:bg-muted/30 transition-colors border-border/40">
                    <TableCell className="pl-6 text-muted-foreground font-mono text-xs">
                      {(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                    </TableCell>
                    <TableCell className="py-4 max-w-[200px]">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-600 flex-shrink-0">
                          <User className="h-5 w-5" />
                        </div>
                        <span className="font-bold text-sm text-foreground line-clamp-2">
                          {item.ciudNombreCompleto || <span className="italic opacity-50 font-medium">Sin datos</span>}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-bold text-foreground line-clamp-1">{item.inciTitulo}</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1 line-clamp-1">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          {item.inciDireccion || "Sin dirección"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[40px]"><PrioridadBadge prioridad={item.inciPrioridad} /></TableCell>
                    <TableCell className="max-w-[100px]"><EstadoBadge estado={item.inciEstado} /></TableCell>
                    <TableCell className="max-w-[40px] text-start">
                      <span className="flex items-start justify-start gap-1.5 text-xs text-muted-foreground font-medium">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {formatDate(item.inciFechCrea)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right pr-8 max-w-[20px]">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDetail(item)}
                          className="h-10 w-10 rounded-xl border border-border/50 hover:bg-primary/10 hover:text-primary"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl border border-border/50">
                              <Settings className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52 p-2 rounded-xl shadow-xl">
                            <DropdownMenuLabel className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-2 pb-2">
                              Cambiar Estado
                            </DropdownMenuLabel>
                            {ESTADOS.filter((e) => e !== item.inciEstado).map((estado) => {
                              const cfg = ESTADO_CONFIG[estado]
                              const Icon = cfg.icon
                              return (
                                <DropdownMenuItem
                                  key={estado}
                                  onClick={() => handleQuickEstado(item, estado)}
                                  className="rounded-lg gap-2 font-bold cursor-pointer"
                                >
                                  <Icon className="h-4 w-4" /> Marcar como {cfg.label}
                                </DropdownMenuItem>
                              )
                            })}
                            <DropdownMenuSeparator className="my-1" />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem
                                  onSelect={(e) => e.preventDefault()}
                                  className="rounded-lg gap-2 font-bold cursor-pointer text-rose-500 hover:text-rose-400 hover:bg-rose-500/10"
                                >
                                  <Trash2 className="h-4 w-4" /> Cancelar Incidencia
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="rounded-3xl">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="font-black text-xl">Confirmar Cancelación</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    ¿Seguro que deseas cancelar la incidencia <b>{item.inciTitulo}</b>? Esta acción marcará el registro como cancelado.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="rounded-xl font-bold">Volver</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleCancelar(item)} className="rounded-xl font-black bg-rose-500 hover:bg-rose-600">
                                    Confirmar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Paginación */}
          {!loading && filtered.length > 0 && totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-8 py-6 border-t border-border/30">
              <div className="text-sm text-muted-foreground font-medium">
                Mostrando <span className="font-bold text-foreground">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span>
                {" "}–{" "}<span className="font-bold text-foreground">{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)}</span>
                {" "}de{" "}<span className="font-bold text-foreground">{filtered.length}</span> incidencias
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="rounded-xl font-bold h-10 border-border/50 bg-card hover:bg-muted/50 disabled:opacity-50">
                  <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let p: number
                    if (totalPages <= 5) p = i + 1
                    else if (currentPage <= 3) p = i + 1
                    else if (currentPage >= totalPages - 2) p = totalPages - 4 + i
                    else p = currentPage - 2 + i
                    return (
                      <Button key={p} variant={currentPage === p ? "default" : "outline"} size="sm"
                        onClick={() => setCurrentPage(p)}
                        className={cn("w-10 h-10 rounded-xl font-bold transition-all",
                          currentPage === p ? "bg-primary text-primary-foreground shadow-md" : "border-border/50 bg-card hover:bg-muted/50"
                        )}>
                        {p}
                      </Button>
                    )
                  })}
                </div>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="rounded-xl font-bold h-10 border-border/50 bg-card hover:bg-muted/50 disabled:opacity-50">
                  Siguiente <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════
          DIÁLOGO DE DETALLE
      ══════════════════════════ */}
      <Dialog open={detailOpen} onOpenChange={(open) => !open && closeDetail()}>
        <DialogContent className="w-full sm:max-w-5xl rounded-3xl max-h-[90vh] overflow-y-auto bg-card">

          <DialogHeader>
            <DialogTitle className="font-black text-xl flex items-center gap-2">
              <TriangleAlert className="h-5 w-5 text-primary" />
              Detalle de Incidencia
            </DialogTitle>
          </DialogHeader>


          {selected && (

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

              <div className="space-y-5">

                {/* Datos ciudadano */}
                <div className="rounded-2xl bg-muted/30 border border-border/50 p-5">

                  <h5 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2 mb-4">
                    <User className="h-4 w-4"/>
                    Datos del Ciudadano
                  </h5>


                  {loadingCiudadano ? (

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin"/>
                      Cargando información...
                    </div>

                  ) : ciudadano ? (

                    <div className="space-y-3 text-sm">

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-primary"/>
                          <span>
                            {ciudadano.ciudNombres} {ciudadano.ciudApellidos}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <IdCard className="h-4 w-4 text-primary"/>
                          <span>
                            {ciudadano.ciudTipoDocumento}: {ciudadano.ciudNumeroDocumento}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-primary"/>
                          <span>
                            {ciudadano.ciudTelefono || "—"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-primary"/>
                          <span className="truncate">
                            {ciudadano.ciudEmail || "—"}
                          </span>
                        </div>
                      </div>


                    </div>

                  ) : (

                    <div className="text-sm text-muted-foreground flex gap-2">
                      <AlertCircle className="h-4 w-4"/>
                      No existe información.
                    </div>

                  )}

                </div>



                {/* Información incidencia */}
                <div className="rounded-2xl bg-card border border-border/50 p-5 space-y-4">


                  <h5 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                    <FileText className="h-4 w-4"/>
                    Información Reportada
                  </h5>


                  <div>
                    <p className="text-xs font-black uppercase text-muted-foreground">
                      Título
                    </p>

                    <p className="text-sm mt-1">
                      {selected.inciTitulo}
                    </p>
                  </div>



                  <div>
                    <p className="text-xs font-black uppercase text-muted-foreground">
                      Descripción
                    </p>

                    <p className="text-sm  leading-relaxed mt-1">
                      {selected.inciDescripcion || "—"}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs font-black uppercase text-muted-foreground flex gap-1">
                        <MapPin className="h-3 w-3"/>
                        Dirección
                      </p>

                      <p className="text-sm mt-1">
                        {selected.inciDireccion || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase text-muted-foreground">
                        Referencia
                      </p>

                      <p className="text-sm mt-1">
                        {selected.inciReferencia || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase text-muted-foreground flex gap-1">
                        <Clock className="h-3 w-3"/>
                        Fecha Registro
                      </p>

                      <p className="text-sm mt-1">
                        {formatDateTime(selected.inciFechCrea)}
                      </p>

                    </div>

                  </div>
                </div>


              </div>
              
              {/* ============================
                  COLUMNA DERECHA
              ============================== */}
              <div className="space-y-4">

                {/* CARD GESTIÓN INTERNA */}
                <div className="rounded-2xl bg-card border border-border/50 p-5 space-y-5">

                  <h5 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                    <FileText className="h-4 w-4"/>
                    Gestión Interna
                  </h5>


                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                    {/* Estado */}
                    <div className="space-y-2">

                      <label className="text-xs font-black uppercase text-muted-foreground">
                        Estado
                      </label>

                      <Select
                        value={editData.inciEstado}
                        onValueChange={(val)=>setEditData({
                          ...editData,
                          inciEstado:val
                        })}
                      >

                        <SelectTrigger className="h-11 rounded-xl w-50">
                          <SelectValue/>
                        </SelectTrigger>

                        <SelectContent>

                          {ESTADOS.map(e=>(

                            <SelectItem key={e} value={e}>
                              {ESTADO_CONFIG[e].label}
                            </SelectItem>

                          ))}

                        </SelectContent>

                      </Select>

                    </div>



                    {/* Prioridad */}
                    <div className="space-y-2">

                      <label className="text-xs font-black uppercase text-muted-foreground">
                        Prioridad
                      </label>

                      <Select
                        value={editData.inciPrioridad}
                        onValueChange={(val)=>setEditData({
                          ...editData,
                          inciPrioridad:val
                        })}
                      >

                        <SelectTrigger className="h-11 rounded-xl w-50">
                          <SelectValue/>
                        </SelectTrigger>

                        <SelectContent>

                          {PRIORIDADES.map(p=>(

                            <SelectItem key={p} value={p}>
                              {PRIORIDAD_CONFIG[p].label}
                            </SelectItem>

                          ))}

                        </SelectContent>

                      </Select>

                    </div>

                  </div>



                  {/* Observación */}
                  <div className="space-y-2">

                    <label className="text-xs font-black uppercase text-muted-foreground">
                      Observación / Respuesta
                    </label>

                    <Textarea
                      placeholder="Escribe una observación interna..."
                      className="min-h-[200px] rounded-xl resize-none"
                      value={editData.inciObservacion ?? ""}
                      onChange={(e)=>setEditData({
                        ...editData,
                        inciObservacion:e.target.value
                      })}
                    />

                  </div>


                </div>



                {/* BOTONES FUERA DEL CARD */}
                <div className="flex justify-end gap-3">

                  <Button
                    variant="outline"
                    onClick={closeDetail}
                    className="rounded-xl font-bold"
                  >
                    Cerrar
                  </Button>


                  <Button
                    onClick={handleSaveDetail}
                    disabled={saving}
                    className="rounded-xl font-black gap-2"
                  >

                    {
                      saving 
                      ? <Loader2 className="h-4 w-4 animate-spin"/>
                      : <CheckCircle2 className="h-4 w-4"/>
                    }

                    Guardar Cambios

                  </Button>

                </div>


              </div>



            </div>

          )}


        </DialogContent>
      </Dialog>
      {/* ══════════════════════════
          DIÁLOGO DE NUEVA INCIDENCIA
      ══════════════════════════ */}
      <Dialog open={createOpen} onOpenChange={(open) => !open && closeCreate()}>
        <DialogContent className="w-full sm:max-w-5xl rounded-3xl max-h-[90vh] overflow-y-auto bg-card">
          <DialogHeader>
            <DialogTitle className="font-black text-xl flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Registrar Nueva Incidencia
            </DialogTitle>
            <DialogDescription>
              Busca al ciudadano por su documento. Si no existe, se creará automáticamente al guardar.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="space-y-5">

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

              {/* COLUMNA IZQUIERDA */}
              <div className="space-y-5">

                {/* Búsqueda de ciudadano */}
                <div className="rounded-2xl bg-muted/30 border border-border/50 p-5 space-y-3">
                  <h5 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <IdCard className="h-3.5 w-3.5" /> Buscar Ciudadano por Documento
                  </h5>

                  <div className="flex gap-2">
                    <Input
                      placeholder="Número de documento (DNI, CE...)"
                      className="h-11 rounded-xl bg-background"
                      value={docBusqueda}
                      onChange={(e) => setDocBusqueda(e.target.value)}
                    />

                    <Button
                      type="button"
                      onClick={handleBuscarCiudadano}
                      disabled={buscandoCiud}
                      className="h-11 rounded-xl font-bold px-5 gap-2"
                    >
                      {buscandoCiud ? <Loader2 className="h-4 w-4 animate-spin" /> : <SearchIcon className="h-4 w-4" />}
                      Buscar
                    </Button>
                  </div>

                  {ciudEncontrado && (
                    <div className="flex items-center gap-2 text-sm text-emerald-500 font-bold bg-emerald-400/10 border border-emerald-400/20 rounded-xl px-4 py-2.5">
                      <CheckCircle2 className="h-4 w-4" />
                      Ciudadano encontrado: {ciudEncontrado.ciudNombres} {ciudEncontrado.ciudApellidos}
                    </div>
                  )}

                  {ciudNoEncontrado && (
                    <div className="flex items-center gap-2 text-sm text-amber-500 font-bold bg-amber-400/10 border border-amber-400/20 rounded-xl px-4 py-2.5">
                      <AlertCircle className="h-4 w-4" />
                      No existe registro. Completa sus datos.
                    </div>
                  )}
                </div>


                {/* Datos ciudadano */}
                <div className="space-y-3">
                  <h5 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <User className="h-3.5 w-3.5" /> Datos del Ciudadano
                  </h5>

                  <div className="grid grid-cols-2 gap-3">
                    <Input placeholder="Nombres *" className="h-11 rounded-xl"
                      value={ciudForm.ciudNombres}
                      onChange={(e) => setCiudForm({...ciudForm, ciudNombres:e.target.value})}
                      disabled={!!ciudEncontrado}
                      required />

                    <Input placeholder="Apellidos *" className="h-11 rounded-xl"
                      value={ciudForm.ciudApellidos}
                      onChange={(e) => setCiudForm({...ciudForm, ciudApellidos:e.target.value})}
                      disabled={!!ciudEncontrado}
                      required />

                    <Input placeholder="Teléfono" className="h-11 rounded-xl"
                      value={ciudForm.ciudTelefono}
                      onChange={(e)=>setCiudForm({...ciudForm,ciudTelefono:e.target.value})}
                      disabled={!!ciudEncontrado}/>

                    <Input placeholder="Email" type="email" className="h-11 rounded-xl"
                      value={ciudForm.ciudEmail}
                      onChange={(e)=>setCiudForm({...ciudForm,ciudEmail:e.target.value})}
                      disabled={!!ciudEncontrado}/>

                    <Input placeholder="Dirección" className="h-11 rounded-xl w-100"
                      value={ciudForm.ciudDireccion}
                      onChange={(e)=>setCiudForm({...ciudForm,ciudDireccion:e.target.value})}
                      disabled={!!ciudEncontrado}/>
                  </div>
                </div>

              </div>


              {/* COLUMNA DERECHA */}
              <div className="space-y-3">

                <h5 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <TriangleAlert className="h-3.5 w-3.5" /> Datos de la Incidencia
                </h5>

                <Input
                  placeholder="Título *"
                  className="h-11 rounded-xl"
                  value={inciForm.inciTitulo}
                  onChange={(e)=>setInciForm({...inciForm,inciTitulo:e.target.value})}
                  required
                />

                <Textarea
                  placeholder="Descripción *"
                  className="min-h-[100px] rounded-xl resize-none"
                  value={inciForm.inciDescripcion}
                  onChange={(e)=>setInciForm({...inciForm,inciDescripcion:e.target.value})}
                  required
                />

                <Input
                  placeholder="Dirección"
                  className="h-11 rounded-xl"
                  value={inciForm.inciDireccion}
                  onChange={(e)=>setInciForm({...inciForm,inciDireccion:e.target.value})}
                />

                <Input
                  placeholder="Referencia"
                  className="h-11 rounded-xl"
                  value={inciForm.inciReferencia}
                  onChange={(e)=>setInciForm({...inciForm,inciReferencia:e.target.value})}
                />

                <Select value={inciForm.inciPrioridad}
                  onValueChange={(v)=>setInciForm({...inciForm,inciPrioridad:v})}>
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="Prioridad"/>
                  </SelectTrigger>

                  <SelectContent>
                    {PRIORIDADES.map((p)=>(
                      <SelectItem key={p} value={p}>
                        {PRIORIDAD_CONFIG[p].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

              </div>

            </div>


            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={closeCreate} className="rounded-xl font-bold">
                Cancelar
              </Button>

              <Button type="submit" disabled={creating} className="rounded-xl font-black bg-primary gap-2">
                {creating ? <Loader2 className="h-4 w-4 animate-spin"/> : <Plus className="h-4 w-4"/>}
                Registrar Incidencia
              </Button>
            </DialogFooter>

          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

