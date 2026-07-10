"use client"

import { useState, useEffect } from "react"
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Wrench,
  ChevronLeft,
  ChevronRight,
  Settings,
  FileText,
  CalendarDays,
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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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

const API = "http://localhost:8081/api/tipos-mantenimiento"

interface TipoMantenimiento {
  timaId?: number
  timaNombre: string
  timaDescrip: string
  timaFechaCrea?: string
  timaEstado: string
}

const emptyForm = (): TipoMantenimiento => ({
  timaNombre: "",
  timaDescrip: "",
  timaEstado: "A",
})

export default function TiposMantenimientoPage() {
  const { user } = useAuth()
  const [tiposMantenimiento, setTiposMantenimiento] = useState<TipoMantenimiento[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterEstado, setFilterEstado] = useState<"all" | "A" | "I">("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<TipoMantenimiento | null>(null)
  const [formData, setFormData] = useState<TipoMantenimiento>(emptyForm())
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 10

  useEffect(() => {
    fetchTiposMantenimiento()
  }, [])

  const fetchTiposMantenimiento = async () => {
    setLoading(true)
    try {
      const res = await fetch(API)
      if (res.ok) setTiposMantenimiento(await res.json())
      else toast.error("Error al cargar los tipos de mantenimiento")
    } catch {
      toast.error("Error de conexión con el servidor")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.timaNombre.trim()) {
      toast.error("El nombre del tipo de mantenimiento es obligatorio")
      return
    }

    const method = editingItem ? "PUT" : "POST"
    const url = editingItem ? `${API}/${editingItem.timaId}` : API

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        const accion = editingItem ? "Actualización" : "Creación"
        const detalle = editingItem
          ? `Tipo de mantenimiento actualizado: ${formData.timaNombre}`
          : `Tipo de mantenimiento creado: ${formData.timaNombre}`
        await logAction(accion, "Tipos de Mantenimiento", detalle, user?.id)

        toast.success(
          editingItem
            ? "Tipo de mantenimiento actualizado"
            : "Tipo de mantenimiento creado"
        )
        setIsDialogOpen(false)
        resetForm()
        fetchTiposMantenimiento()
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.message || "Error al guardar el tipo de mantenimiento")
      }
    } catch {
      toast.error("Error de conexión")
    }
  }

  const handleToggleEstado = async (item: TipoMantenimiento) => {
    const isActive = item.timaEstado === "A"
    const url = isActive
      ? `${API}/${item.timaId}`
      : `${API}/${item.timaId}/reactivar`
    const method = isActive ? "DELETE" : "PATCH"

    try {
      const res = await fetch(url, { method })
      if (res.ok) {
        const accion = isActive ? "Desactivación" : "Reactivación"
        await logAction(
          accion,
          "Tipos de Mantenimiento",
          `Tipo de mantenimiento ${accion.toLowerCase()}: ${item.timaNombre}`,
          user?.id
        )
        toast.success(
          isActive
            ? "Tipo de mantenimiento desactivado"
            : "Tipo de mantenimiento reactivado"
        )
        fetchTiposMantenimiento()
      } else {
        toast.error("Error al cambiar el estado")
      }
    } catch {
      toast.error("Error de conexión")
    }
  }

  const openEditDialog = (item: TipoMantenimiento) => {
    setEditingItem(item)
    setFormData({ ...item })
    setIsDialogOpen(true)
  }

  const openCreateDialog = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  const resetForm = () => {
    setFormData(emptyForm())
    setEditingItem(null)
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—"
    return new Date(dateStr).toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  const filtered = tiposMantenimiento.filter((s) => {
    const matchSearch =
      s.timaNombre.toLowerCase().includes(search.toLowerCase()) ||
      (s.timaDescrip ?? "").toLowerCase().includes(search.toLowerCase())
    const matchEstado = filterEstado === "all" || s.timaEstado === filterEstado
    return matchSearch && matchEstado
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const handleSearch = (val: string) => {
    setSearch(val)
    setCurrentPage(1)
  }

  const totalActivos = tiposMantenimiento.filter((s) => s.timaEstado === "A").length
  const totalInactivos = tiposMantenimiento.filter((s) => s.timaEstado === "I").length

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h4 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-3">
            <Wrench className="h-6 w-6 text-primary" />
            Gestión de Tipos de Mantenimiento
          </h4>
          <p className="text-muted-foreground mt-1 font-medium">
            Administra los tipos de mantenimiento disponibles en el sistema.
          </p>
        </div>
        <Button
          onClick={openCreateDialog}
          className="rounded-xl h-11 px-6 font-bold gap-2"
        >
          <Plus className="h-5 w-5" />
          Nuevo Tipo Mantenimiento
        </Button>
      </div>

      {/* ── Summary cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card shadow-md dark:border border-0">
          <CardContent className="py-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Total</p>
                <p className="text-3xl font-black mt-1">{tiposMantenimiento.length}</p>
              </div>
              <div className="h-12 w-12 rounded-2xl flex items-center justify-center bg-primary/10 text-primary">
                <Wrench className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-md dark:border border-0">
          <CardContent className="py-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Activos</p>
                <p className="text-3xl font-black mt-1 text-emerald-500">{totalActivos}</p>
              </div>
              <div className="h-12 w-12 rounded-2xl flex items-center justify-center bg-emerald-500/10 text-emerald-500">
                <CheckCircle2 className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-md dark:border border-0">
          <CardContent className="py-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Inactivos</p>
                <p className="text-3xl font-black mt-1 text-rose-500">{totalInactivos}</p>
              </div>
              <div className="h-12 w-12 rounded-2xl flex items-center justify-center bg-rose-500/10 text-rose-500">
                <XCircle className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Table card ─────────────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-card shadow-md dark:border border-0">
        {/* Table header / filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/50 px-6 py-4">
          <h2 className="text-lg font-black text-foreground flex items-center gap-2">
            Listado de Tipos de Mantenimiento
          </h2>
          <div className="flex flex-col md:flex-row md:items-center gap-3 w-full md:w-auto">
            {/* Estado filter */}
            <div className="flex gap-2">
              {(["all", "A", "I"] as const).map((val) => (
                <button
                  key={val}
                  onClick={() => { setFilterEstado(val); setCurrentPage(1) }}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border transition-all",
                    filterEstado === val
                      ? "bg-primary text-white border-primary"
                      : "bg-background border-border/50 text-muted-foreground hover:bg-muted"
                  )}
                >
                  {val === "all" ? "Todos" : val === "A" ? "Activos" : "Inactivos"}
                </button>
              ))}
            </div>
            {/* Search */}
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o descripción..."
                className="pl-10 h-10 rounded-xl bg-background border-border/50"
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-border/50">
                <TableHead className="font-bold py-4 pl-6">#</TableHead>
                <TableHead className="font-bold">Nombre</TableHead>
                <TableHead className="font-bold">Descripción</TableHead>
                <TableHead className="font-bold">Fecha Registro</TableHead>
                <TableHead className="font-bold">Estado</TableHead>
                <TableHead className="text-right font-bold pr-8">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6} className="h-16 animate-pulse bg-muted/10" />
                  </TableRow>
                ))
              ) : paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground font-medium">
                    No se encontraron tipos de mantenimiento.
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((item, idx) => (
                  <TableRow
                    key={item.timaId}
                    className="hover:bg-muted/30 transition-colors border-border/40"
                  >
                    <TableCell className="pl-6 text-muted-foreground font-mono text-xs">
                      {(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                    </TableCell>
                    <TableCell className="max-w-[250px]">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black uppercase text-sm flex-shrink-0">
                        {item.timaNombre.substring(0, 2)}
                        </div>

                        <span className="font-bold text-sm text-foreground break-words line-clamp-2">
                        {item.timaNombre}
                        </span>
                    </div>
                    </TableCell>
                    <TableCell className="max-w-[350px]">
                    <span className="text-sm text-muted-foreground break-words line-clamp-2">
                        {item.timaDescrip || (
                        <span className="italic opacity-50">
                            Sin descripción
                        </span>
                        )}
                    </span>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {formatDate(item.timaFechaCrea)}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[20px]">
                      {item.timaEstado === "A" ? (
                        <Badge variant="outline" className="rounded-lg px-2.5 py-0.5 border font-bold bg-emerald-400/10 text-emerald-500 border-emerald-400/20">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Activo
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="rounded-lg px-2.5 py-0.5 border font-bold bg-rose-400/10 text-rose-500 border-rose-400/20">
                          <XCircle className="h-3 w-3 mr-1" /> Inactivo
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl border border-border/50 hover:bg-emerald-400/10 hover:text-emerald-400">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 p-2 rounded-xl shadow-xl">
                          <DropdownMenuLabel className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-2 pb-2">
                            Opciones
                          </DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => openEditDialog(item)}
                            className="rounded-lg gap-2 font-bold cursor-pointer"
                          >
                            <Edit2 className="h-4 w-4 text-blue-500" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="my-1" />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem
                                onSelect={(e) => e.preventDefault()}
                                className={cn(
                                  "rounded-lg gap-2 font-bold cursor-pointer",
                                  item.timaEstado === "A"
                                    ? "text-rose-500 hover:text-rose-400 hover:bg-rose-500/10"
                                    : "text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10"
                                )}
                              >
                                {item.timaEstado === "A" ? (
                                  <><Trash2 className="h-4 w-4" /> Desactivar</>
                                ) : (
                                  <><CheckCircle2 className="h-4 w-4" /> Reactivar</>
                                )}
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-3xl">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="font-black text-xl">
                                  {item.timaEstado === "A" ? "Confirmar Desactivación" : "Confirmar Reactivación"}
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  ¿Seguro que deseas{" "}
                                  {item.timaEstado === "A" ? "desactivar" : "reactivar"} el tipo de mantenimiento{" "}
                                  <b>{item.timaNombre}</b>?
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
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {!loading && filtered.length > 0 && totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-8 py-6 border-t border-border/30">
              <div className="text-sm text-muted-foreground font-medium">
                Mostrando{" "}
                <span className="font-bold text-foreground">
                  {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                </span>{" "}
                –{" "}
                <span className="font-bold text-foreground">
                  {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)}
                </span>{" "}
                de{" "}
                <span className="font-bold text-foreground">{filtered.length}</span>{" "}
                tipos de mantenimiento
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="rounded-xl font-bold h-10 border-border/50 bg-card hover:bg-muted/50 disabled:opacity-50"
                >
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
                      <Button
                        key={p}
                        variant={currentPage === p ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(p)}
                        className={cn(
                          "w-10 h-10 rounded-xl font-bold transition-all",
                          currentPage === p
                            ? "bg-primary text-primary-foreground shadow-md border-primary"
                            : "border-border/50 bg-card hover:bg-muted/50"
                        )}
                      >
                        {p}
                      </Button>
                    )
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="rounded-xl font-bold h-10 border-border/50 bg-card hover:bg-muted/50 disabled:opacity-50"
                >
                  Siguiente <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Create / Edit Dialog ────────────────────────────────────────────── */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="sm:max-w-[560px] p-0 overflow-hidden border-none shadow-2xl rounded-3xl"
        >
          <form onSubmit={handleSubmit} className="bg-card">
            {/* Dialog header */}
            <div className="bg-card py-4 px-8 border-b border-border/50 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl" />
              <DialogHeader>
                <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-3 text-foreground">
                  {editingItem ? (
                    <Edit2 className="h-6 w-6 text-primary" />
                  ) : (
                    <Plus className="h-6 w-6 text-primary" />
                  )}
                  {editingItem ? "Editar Tipo de Mantenimiento" : "Nuevo Tipo de Mantenimiento"}
                </DialogTitle>
              </DialogHeader>
            </div>

            {/* Form body */}
            <div className="p-8 space-y-5">
              {/* Nombre */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-muted-foreground tracking-widest pl-1">
                  Nombre <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Wrench className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                  <Input
                    placeholder="Ej. Mantenimiento preventivo"
                    className="h-12 pl-11 rounded-2xl bg-card focus-visible:ring-2 focus-visible:ring-primary/20"
                    value={formData.timaNombre}
                    onChange={(e) => setFormData({ ...formData, timaNombre: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Descripción */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-muted-foreground tracking-widest pl-1">
                  Descripción
                </label>
                <div className="relative">
                  <FileText className="absolute left-4 top-4 h-4 w-4 text-primary" />
                  <textarea
                    placeholder="Describe brevemente el tipo de mantenimiento..."
                    rows={4}
                    className="w-full pl-11 pr-4 py-3 rounded-2xl bg-card border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                    value={formData.timaDescrip}
                    onChange={(e) => setFormData({ ...formData, timaDescrip: e.target.value })}
                  />
                </div>
              </div>

              {/* Estado (solo en edición) */}
              {editingItem && (
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-400/5 border border-emerald-400/10 select-none">
                  <input
                    type="checkbox"
                    id="timaEstado"
                    className="h-5 w-5 rounded-md"
                    checked={formData.timaEstado === "A"}
                    onChange={(e) =>
                      setFormData({ ...formData, timaEstado: e.target.checked ? "A" : "I" })
                    }
                  />
                  <label htmlFor="timaEstado" className="text-sm font-bold text-emerald-500 cursor-pointer">
                    Tipo de mantenimiento activo
                  </label>
                </div>
              )}
            </div>

            {/* Footer */}
            <DialogFooter className="w-full bg-muted/20 p-4 pt-6 border-t border-border/30">
              <div className="flex justify-between w-full gap-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsDialogOpen(false)}
                  className="h-12 px-10 rounded-2xl bg-card border"
                >
                  Cancelar
                </Button>
                <Button type="submit" className="h-12 px-10 font-black rounded-2xl bg-primary flex-1">
                  {editingItem ? "Guardar Cambios" : "Crear Tipo"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}