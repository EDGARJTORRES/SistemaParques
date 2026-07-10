"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import dynamic from "next/dynamic"
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  TreePine,
  ChevronLeft,
  ChevronRight,
  Settings,
  MapPin,
  CalendarDays,
  Navigation,
  Map as MapIcon,
  Loader2,
  ArrowLeft,
  Save,
} from "lucide-react"
import { logAction } from "@/lib/logging"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const API = "http://localhost:8081/api/parques"

const CHICLAYO_CENTER: [number, number] = [-6.7714, -79.8409]
const CHICLAYO_BOUNDS: [[number, number], [number, number]] = [
  [-6.830, -79.910],
  [-6.720, -79.770],
]

interface Parque {
  parqId?: number
  parqNombre: string
  parqDireccion: string
  parqCoordenadas: string
  parqFechaCrea?: string
  parqEstado: string
}

interface NominatimResult {
  display_name: string
  lat: string
  lon: string
  address?: {
    park?: string
    leisure?: string
    amenity?: string
  }
}

const emptyForm = (): Parque => ({
  parqNombre: "",
  parqDireccion: "",
  parqCoordenadas: "",
  parqEstado: "A",
})

// ─────────────────────────────────────────────────────────────────────────────
// MapPickerInner
// ─────────────────────────────────────────────────────────────────────────────
interface MapPickerProps {
  initialCoords: string
  onPick: (info: { nombre: string; direccion: string; coordenadas: string }) => void
}

function MapPickerInner({ initialCoords, onPick }: MapPickerProps) {
  const mapRef      = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)
  const markerRef   = useRef<any>(null)
  const LRef        = useRef<any>(null)
  const [searchText, setSearchText]           = useState("")
  const [suggestions, setSuggestions]         = useState<NominatimResult[]>([])
  const [searching, setSearching]             = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const parseCoords = (raw: string): [number, number] | null => {
    if (!raw) return null
    const parts = raw.split(",").map((s) => parseFloat(s.trim()))
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1]))
      return [parts[0], parts[1]]
    return null
  }

  const placeMarker = useCallback(
    (latlng: [number, number], nombre = "", direccion = "") => {
      const L = LRef.current
      if (!L || !mapInstance.current) return
      if (markerRef.current) { markerRef.current.remove(); markerRef.current = null }

      const greenPin = L.divIcon({
        className: "",
        html: `<div style="width:28px;height:28px;background:#22c55e;border:3px solid #fff;
                border-radius:50% 50% 50% 0;transform:rotate(-45deg);
                box-shadow:0 2px 8px rgba(0,0,0,0.35)"></div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        popupAnchor: [0, -30],
      })

      markerRef.current = L.marker(latlng, { icon: greenPin })
        .addTo(mapInstance.current)
        .bindPopup(
          `<b style="font-size:13px">${nombre || "Ubicación seleccionada"}</b><br/>
           <span style="font-size:11px;color:#555">${direccion}</span>`
        )
        .openPopup()

      mapInstance.current.setView(latlng, 17)
      onPick({
        nombre,
        direccion,
        coordenadas: `${latlng[0].toFixed(7)}, ${latlng[1].toFixed(7)}`,
      })
    },
    [onPick]
  )

  const reverseGeocode = useCallback(
    async (lat: number, lng: number) => {
      try {
        const res  = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=es`,
          { headers: { "User-Agent": "SistemaParques/1.0" } }
        )
        const data: NominatimResult = await res.json()
        const addr   = data.address
        const nombre = addr?.park || addr?.leisure || addr?.amenity || ""
        placeMarker([lat, lng], nombre, data.display_name)
      } catch {
        placeMarker([lat, lng], "", `${lat.toFixed(7)}, ${lng.toFixed(7)}`)
      }
    },
    [placeMarker]
  )

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return
    let destroyed = false

    import("leaflet").then((L) => {
      if (destroyed || !mapRef.current || mapInstance.current) return
      LRef.current = L.default ?? L

      const initial = parseCoords(initialCoords) ?? CHICLAYO_CENTER
      const map = (LRef.current as any).map(mapRef.current, {
        center: initial,
        zoom: 14,
        maxBounds: CHICLAYO_BOUNDS,
        maxBoundsViscosity: 0.7,
        zoomControl: true,
      })

      ;(LRef.current as any)
        .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        })
        .addTo(map)

      setTimeout(() => map.invalidateSize(), 200)
      mapInstance.current = map

      const initCoords = parseCoords(initialCoords)
      if (initCoords) placeMarker(initCoords)

      map.on("click", (e: any) => reverseGeocode(e.latlng.lat, e.latlng.lng))
    })

    return () => {
      destroyed = true
      if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSearchInput = (val: string) => {
    setSearchText(val)
    setShowSuggestions(true)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!val.trim() || val.length < 3) { setSuggestions([]); return }

    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const url =
          `https://nominatim.openstreetmap.org/search` +
          `?q=${encodeURIComponent(val + " Chiclayo Peru")}` +
          `&format=json&limit=6&countrycodes=pe` +
          `&bounded=1` +
          `&viewbox=${CHICLAYO_BOUNDS[0][1]},${CHICLAYO_BOUNDS[1][0]},${CHICLAYO_BOUNDS[1][1]},${CHICLAYO_BOUNDS[0][0]}` +
          `&accept-language=es`
        const res  = await fetch(url, { headers: { "User-Agent": "SistemaParques/1.0" } })
        const data: NominatimResult[] = await res.json()
        setSuggestions(data)
      } catch {
        setSuggestions([])
      } finally {
        setSearching(false)
      }
    }, 500)
  }

  const handleSelectSuggestion = (item: NominatimResult) => {
    const lat  = parseFloat(item.lat)
    const lng  = parseFloat(item.lon)
    const addr = item.address
    const nombre = addr?.park || addr?.leisure || addr?.amenity || ""
    placeMarker([lat, lng], nombre, item.display_name)
    setSearchText(item.display_name)
    setSuggestions([])
    setShowSuggestions(false)
  }

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Buscador */}
     <div className="relative flex-shrink-0" style={{ zIndex: 1000 }}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary z-10" />
        {searching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin z-10" />
        )}
        <input
          value={searchText}
          onChange={(e) => handleSearchInput(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder="Buscar parque o dirección en Chiclayo..."
          className="w-full h-11 pl-10 pr-10 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 top-full mt-1 w-full bg-background border border-border/50 rounded-xl shadow-xl overflow-hidden">
            {suggestions.map((item, i) => (
              <button key={i} type="button" onClick={() => handleSelectSuggestion(item)}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted/60 transition-colors flex items-start gap-2 border-b border-border/30 last:border-0">
                <MapPin className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-primary" />
                <span className="line-clamp-2 text-foreground">{item.display_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Mapa */}
      <div ref={mapRef} className="flex-1 rounded-xl overflow-hidden border border-border/50" style={{ minHeight: 480 }} />

      <p className="text-xs text-muted-foreground/60 flex items-center gap-1 flex-shrink-0">
        <MapPin className="h-3 w-3" />
        Haz clic en el mapa o usa el buscador para marcar la ubicación.
      </p>
    </div>
  )
}

const MapPicker = dynamic(
  () => Promise.resolve({ default: MapPickerInner }),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center flex-1 rounded-xl border border-border/50 bg-muted/20" style={{ minHeight: 280 }}>
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-sm font-medium">Cargando mapa...</span>
        </div>
      </div>
    ),
  }
)

// ─────────────────────────────────────────────────────────────────────────────
// Vista: Formulario (nueva página dentro del mismo componente)
// ─────────────────────────────────────────────────────────────────────────────
interface FormViewProps {
  editingItem: Parque | null
  formData: Parque
  setFormData: (d: Parque) => void
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
  mapKey: number
  onMapPick: (info: { nombre: string; direccion: string; coordenadas: string }) => void
}

function FormView({ editingItem, formData, setFormData, onSubmit, onCancel, mapKey, onMapPick }: FormViewProps) {
  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300 flex flex-col h-full">
      {/* Sub-header */}
      <div className="bg-card px-4 py-3 text-white relative overflow-hidden mb-3 rounded-2xl border border-border/50 shadow-sm">
        <div className="absolute top-0 right-0 w-10 h-15 bg-primary/20 rounded-full -mr-10 -mt-10" />
          <div className="absolute bottom-0 left-0 w-20 h-20 rounded-full -ml-10 -mb-10" />
              <div className="relative z-6 flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center border border-white/20">
                  <Button variant="ghost" onClick={onCancel}
                    className="h-10 w-10 rounded-xl p-0  hover:bg-muted hover:text-foreground flex-shrink-0">
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                </div>
              <div>
              <h4 className="text-xl text-primary font-bold tracking-tight">
                  {editingItem ? "Editar Parque" : "Nuevo Parque"}
              </h4>
              <p className="text-muted-foreground font-medium text-md">
                  {editingItem ? `Modificando: ${editingItem.parqNombre}` : "Completa los datos y selecciona la ubicación en el mapa"}
              </p>
                
          </div>
        </div>
      </div>
      <form onSubmit={onSubmit} className="flex-1 flex flex-col min-h-0">
        {/* Grid: formulario angosto / mapa ancho */}
        <div className="grid gap-6 flex-1 min-h-0" style={{ gridTemplateColumns: "2fr 3fr", minHeight: "calc(100vh - 220px)" }}>

          {/* ── Columna izquierda ── */}
          <div className="flex flex-col gap-5">
            <div className="rounded-2xl bg-card border border-border/50 shadow-sm p-6 space-y-5 flex-shrink-0">
              <h5 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <TreePine className="h-3.5 w-3.5" /> Datos del Parque
              </h5>

              {/* Nombre */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-muted-foreground tracking-widest pl-1">
                  Nombre <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <TreePine className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                  <Input
                    placeholder="Ej. Parque Principal de Chiclayo"
                    className="h-12 pl-11 rounded-2xl bg-background focus-visible:ring-2 focus-visible:ring-primary/20"
                    value={formData.parqNombre}
                    onChange={(e) => setFormData({ ...formData, parqNombre: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Dirección */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-muted-foreground tracking-widest pl-1">
                  Dirección
                </label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                  <Input
                    placeholder="Se completa al seleccionar en el mapa"
                    className="h-12 pl-11 rounded-2xl bg-background focus-visible:ring-2 focus-visible:ring-primary/20"
                    value={formData.parqDireccion}
                    onChange={(e) => setFormData({ ...formData, parqDireccion: e.target.value })}
                  />
                </div>
              </div>

              {/* Coordenadas */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-muted-foreground tracking-widest pl-1">
                  Coordenadas GPS
                </label>
                <div className="relative">
                  <Navigation className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                  <Input
                    placeholder="Se completa desde el mapa"
                    className="h-12 pl-11 rounded-2xl bg-muted/50 font-mono text-sm"
                    value={formData.parqCoordenadas}
                    onChange={(e) => setFormData({ ...formData, parqCoordenadas: e.target.value })}
                  />
                </div>
              </div>

              {/* Estado (solo edición) */}
              {editingItem && (
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-400/5 border border-emerald-400/10 select-none">
                  <input type="checkbox" id="parqEstado" className="h-5 w-5 rounded-md"
                    checked={formData.parqEstado === "A"}
                    onChange={(e) => setFormData({ ...formData, parqEstado: e.target.checked ? "A" : "I" })}
                  />
                  <label htmlFor="parqEstado" className="text-sm font-bold text-emerald-500 cursor-pointer">
                    Parque activo
                  </label>
                </div>
              )}
            </div>

            {/* Botones */}
            <div className="flex flex-col gap-5">
              <Button type="button" variant="outline" onClick={onCancel}
                className="flex-1 h-16 rounded-2xl font-bold border-border/50 hover:bg-muted/50 hover:text-foreground flex items-center justify-center gap-2">
                <ArrowLeft className="h-4 w-4 mr-2 my-2" /> Cancelar
              </Button>
              <Button type="submit" className="flex-[2] h-16 rounded-2xl font-black bg-primary gap-2">
                <Save className="h-4 w-4 my-2" />
                {editingItem ? "Guardar Cambios" : "Crear Parque"}
              </Button>
            </div>
          </div>

          {/* ── Columna derecha: mapa ── */}
          <div className="rounded-2xl bg-card border border-border/50 shadow-sm p-6 flex flex-col min-h-0">
            <div className="flex-1 min-h-0">
              <MapPicker key={mapKey} initialCoords={formData.parqCoordenadas} onPick={onMapPick} />
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
export default function ParquesPage() {
  const { user }       = useAuth()
  const [view, setView] = useState<"table" | "form">("table")   // ← controla la vista activa
  const [parques, setParques]           = useState<Parque[]>([])
  const [loading, setLoading]           = useState(true)
  const [search, setSearch]             = useState("")
  const [filterEstado, setFilterEstado] = useState<"all" | "A" | "I">("all")
  const [editingItem, setEditingItem]   = useState<Parque | null>(null)
  const [formData, setFormData]         = useState<Parque>(emptyForm())
  const [currentPage, setCurrentPage]   = useState(1)
  const [mapKey, setMapKey]             = useState(0)
  const ITEMS_PER_PAGE = 10

  useEffect(() => { fetchParques() }, [])

  const fetchParques = async () => {
    setLoading(true)
    try {
      const res = await fetch(API)
      if (res.ok) setParques(await res.json())
      else toast.error("Error al cargar parques")
    } catch {
      toast.error("Error de conexión con el servidor")
    } finally {
      setLoading(false)
    }
  }

  const handleMapPick = useCallback(
    (info: { nombre: string; direccion: string; coordenadas: string }) => {
      setFormData((prev) => ({
        ...prev,
        parqNombre:      info.nombre    || prev.parqNombre,
        parqDireccion:   info.direccion || prev.parqDireccion,
        parqCoordenadas: info.coordenadas,
      }))
    },
    []
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.parqNombre.trim()) { toast.error("El nombre del parque es obligatorio"); return }

    const method = editingItem ? "PUT" : "POST"
    const url    = editingItem ? `${API}/${editingItem.parqId}` : API

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        const accion  = editingItem ? "Actualización" : "Creación"
        await logAction(accion, "Parques", `Parque ${accion.toLowerCase()}: ${formData.parqNombre}`, user?.id)
        toast.success(editingItem ? "Parque actualizado" : "Parque creado")
        goToTable()          // ← vuelve a la tabla
        fetchParques()
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.message || "Error al guardar el parque")
      }
    } catch {
      toast.error("Error de conexión")
    }
  }

  const handleToggleEstado = async (item: Parque) => {
    const isActive = item.parqEstado === "A"
    const url    = isActive ? `${API}/${item.parqId}` : `${API}/${item.parqId}/reactivar`
    const method = isActive ? "DELETE" : "PATCH"
    try {
      const res = await fetch(url, { method })
      if (res.ok) {
        const accion = isActive ? "Desactivación" : "Reactivación"
        await logAction(accion, "Parques", `Parque ${accion.toLowerCase()}: ${item.parqNombre}`, user?.id)
        toast.success(isActive ? "Parque desactivado" : "Parque reactivado")
        fetchParques()
      } else {
        toast.error("Error al cambiar el estado")
      }
    } catch {
      toast.error("Error de conexión")
    }
  }

  const goToCreate = () => {
    setEditingItem(null)
    setFormData(emptyForm())
    setMapKey((k) => k + 1)
    setView("form")
  }

  const goToEdit = (item: Parque) => {
    setEditingItem(item)
    setFormData({ ...item })
    setMapKey((k) => k + 1)
    setView("form")
  }

  const goToTable = () => {
    setView("table")
    setEditingItem(null)
    setFormData(emptyForm())
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—"
    return new Date(dateStr).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })
  }

  const filtered = parques.filter((p) => {
    const matchSearch =
      p.parqNombre.toLowerCase().includes(search.toLowerCase()) ||
      (p.parqDireccion ?? "").toLowerCase().includes(search.toLowerCase())
    const matchEstado = filterEstado === "all" || p.parqEstado === filterEstado
    return matchSearch && matchEstado
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const paginated  = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
  const totalActivos   = parques.filter((p) => p.parqEstado === "A").length
  const totalInactivos = parques.filter((p) => p.parqEstado === "I").length

  // ── Renderizado condicional de vista ──────────────────────────────────────
  if (view === "form") {
    return (
      <FormView
        editingItem={editingItem}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        onCancel={goToTable}
        mapKey={mapKey}
        onMapPick={handleMapPick}
      />
    )
  }

  // ── Vista tabla ───────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h4 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-3">
            <TreePine className="h-6 w-6 text-primary" />
            Gestión de Parques y jardines
          </h4>
          <p className="text-muted-foreground mt-1 font-medium">
            Administra los parques y jardines del distrito de Chiclayo.
          </p>
        </div>
        <Button onClick={goToCreate} className="rounded-xl h-11 px-6 font-bold gap-2">
          <Plus className="h-5 w-5" /> Nuevo Parque
        </Button>
      </div>

      {/* Cards resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Total",    value: parques.length, icon: TreePine,    color: "bg-primary/10 text-primary",         text: "" },
          { label: "Activos",  value: totalActivos,   icon: CheckCircle2, color: "bg-emerald-500/10 text-emerald-500", text: "text-emerald-500" },
          { label: "Inactivos",value: totalInactivos, icon: XCircle,      color: "bg-rose-500/10 text-rose-500",       text: "text-rose-500" },
        ].map((c) => (
          <Card key={c.label} className="bg-card shadow-md dark:border border-0">
            <CardContent className="py-2">
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

      {/* Tabla */}
      <div className="rounded-2xl bg-card shadow-md dark:border border-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/50 px-6 py-4">
          <h2 className="text-lg font-black text-foreground">Listado de Parques</h2>
          <div className="flex flex-col md:flex-row md:items-center gap-3 w-full md:w-auto">
            <div className="flex gap-2">
              {(["all", "A", "I"] as const).map((val) => (
                <button key={val} onClick={() => { setFilterEstado(val); setCurrentPage(1) }}
                  className={cn("px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border transition-all",
                    filterEstado === val ? "bg-primary text-white border-primary" : "bg-background border-border/50 text-muted-foreground hover:bg-muted"
                  )}>
                  {val === "all" ? "Todos" : val === "A" ? "Activos" : "Inactivos"}
                </button>
              ))}
            </div>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por nombre o dirección..."
                className="pl-10 h-10 rounded-xl bg-background border-border/50"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
              />
            </div>
          </div>
        </div>

        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="hover:bg-transparent border-border/50">
              <TableHead className="font-bold py-4 pl-6">#</TableHead>
              <TableHead className="font-bold">Nombre</TableHead>
              <TableHead className="font-bold">Dirección</TableHead>
              <TableHead className="font-bold">Coordenadas</TableHead>
              <TableHead className="font-bold">Registro</TableHead>
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
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground font-medium">
                  No se encontraron parques.
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((item, idx) => (
                <TableRow key={item.parqId} className="hover:bg-muted/30 transition-colors border-border/40">
                  <TableCell className="pl-6 text-muted-foreground font-mono text-xs">
                    {(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                  </TableCell>
                  <TableCell className="py-4 max-w-[220px]">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 flex-shrink-0">
                        <TreePine className="h-5 w-5" />
                      </div>
                      <span className="font-bold text-sm text-foreground">{item.parqNombre}</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[300px]">
                    <span className="text-sm text-muted-foreground line-clamp-2 flex items-start gap-1">
                      <MapPin className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-primary" />
                      {item.parqDireccion || <span className="italic opacity-50">Sin dirección</span>}
                    </span>
                  </TableCell>
                  <TableCell  className="max-w-[300px]">
                    {item.parqCoordenadas ? (
                      <a
                        href={`https://www.openstreetmap.org/?mlat=${item.parqCoordenadas.split(",")[0]?.trim()}&mlon=${item.parqCoordenadas.split(",")[1]?.trim()}&zoom=17`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col gap-1 text-xs font-mono text-primary hover:underline"
                      >
                        <div className="flex items-center gap-1.5">
                          <Navigation className="h-3 w-3 flex-shrink-0" />
                          <span>{item.parqCoordenadas.split(",")[0]?.trim()}</span>
                        </div>

                        <span className="pl-[18px]">
                          {item.parqCoordenadas.split(",")[1]?.trim()}
                        </span>
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">
                        Sin coordenadas
                      </span>
                    )}
                  </TableCell>
                  <TableCell  className="max-w-[20px] text-center"> 
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {formatDate(item.parqFechaCrea)}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-[20px]">
                    {item.parqEstado === "A" ? (
                      <Badge variant="outline" className="rounded-lg px-2.5 py-0.5 border font-bold bg-emerald-400/10 text-emerald-500 border-emerald-400/20">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Activo
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="rounded-lg px-2.5 py-0.5 border font-bold bg-rose-400/10 text-rose-500 border-rose-400/20">
                        <XCircle className="h-3 w-3 mr-1" /> Inactivo
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right pr-8 max-w-[20px]">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl border border-border/50">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 p-2 rounded-xl shadow-xl">
                        <DropdownMenuLabel className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-2 pb-2">
                          Opciones
                        </DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => goToEdit(item)} className="rounded-lg gap-2 font-bold cursor-pointer">
                          <Edit2 className="h-4 w-4 text-blue-500" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="my-1" />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}
                              className={cn("rounded-lg gap-2 font-bold cursor-pointer",
                                item.parqEstado === "A"
                                  ? "text-rose-500 hover:text-rose-400 hover:bg-rose-500/10"
                                  : "text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10"
                              )}>
                              {item.parqEstado === "A"
                                ? <><Trash2 className="h-4 w-4" /> Desactivar</>
                                : <><CheckCircle2 className="h-4 w-4" /> Reactivar</>}
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="rounded-3xl">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="font-black text-xl">
                                {item.parqEstado === "A" ? "Confirmar Desactivación" : "Confirmar Reactivación"}
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                ¿Seguro que deseas {item.parqEstado === "A" ? "desactivar" : "reactivar"} el parque <b>{item.parqNombre}</b>?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="rounded-xl font-bold">Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleToggleEstado(item)} className="rounded-xl font-black bg-primary">
                                Confirmar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
              {" "}de{" "}<span className="font-bold text-foreground">{filtered.length}</span> parques
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
  )
}
