"use client"

import { useState, useEffect } from "react"
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  MoreVertical, 
  UserPlus, 
  Mail, 
  Shield, 
  CheckCircle2, 
  XCircle,
  Filter,
  Phone,
  User as UserIcon,
  Fingerprint,
  ChevronLeft,
  ChevronRight,
  Smartphone,
  Settings
} from "lucide-react"
import { logSystemAction } from "@/lib/logging"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface Usuario {
  idUsuario?: number
  dni: string
  nombres: string
  email: string
  password?: string
  activo: boolean
  idRol: number
  nombreRol?: string
  nmrCelular?: string
}

const ROLES = [
  { id: 1, name: "administrador", label: "Administrador", color: "bg-purple-500/10 text-purple-600 border-purple-200" },
  { id: 2, name: "subgerente", label: "Subgerente", color: "bg-blue-500/10 text-blue-600 border-blue-200" },
  { id: 3, name: "supervisor", label: "Supervisor", color: "bg-emerald-500/10 text-emerald-600 border-emerald-200" },
]

export default function UsuariosPage() {
  const { user } = useAuth()
  const [users, setUsers] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<Usuario | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [filterRole, setFilterRole] = useState("all")
  const ITEMS_PER_PAGE = 10
  const [formData, setFormData] = useState<Usuario>({
    dni: "",
    nombres: "",
    email: "",
    password: "",
    activo: true,
    idRol: 3,
    nmrCelular: "",
  })

  const validatePassword = (password: string) => {
    const requirements = {
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      minLength: password.length >= 8
    }
    
    const isValid = Object.values(requirements).every(req => req === true)
    
    return { isValid, requirements }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const res = await fetch("http://localhost:8081/api/usuarios")
      if (res.ok) {
        const data = await res.json()
        setUsers(data)
      }
    } catch (error) {
      toast.error("Error al cargar usuarios")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const esObrero = formData.idRol === 4;

    // Si NO es obrero, la contraseña es obligatoria
    if (!esObrero) {
      if (!formData.password?.trim()) {
        toast.error("La contraseña es obligatoria para este rol");
        return;
      }

      const { isValid } = validatePassword(formData.password);

      if (!isValid) {
        toast.error("La contraseña debe cumplir con todos los requisitos");
        return;
      }
    }

    // Si es obrero y escribió una contraseña, validarla
    if (esObrero && formData.password?.trim()) {
      const { isValid } = validatePassword(formData.password);

      if (!isValid) {
        toast.error("La contraseña debe cumplir con todos los requisitos");
        return;
      }
    }
    
    // Verificar si el email ya existe (solo para nuevos usuarios)
    if (!editingUser) {
      const emailExists = users.some(user => user.email.toLowerCase() === formData.email.toLowerCase())
      if (emailExists) {
        toast.error("El correo electrónico ya está registrado")
        return
      }
    }
    
    const method = editingUser ? "PUT" : "POST"
    const url = editingUser 
      ? `http://localhost:8081/api/usuarios/${editingUser.idUsuario}` 
      : "http://localhost:8081/api/usuarios"

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        // Log the action
        if (editingUser) {
          await logSystemAction('USUARIO_ACTUALIZADO', [formData.nombres], editingUser.idUsuario)
        } else {
          await logSystemAction('USUARIO_CREADO', [formData.nombres, formData.dni], user?.id)
        }
        
        toast.success(editingUser ? "Usuario actualizado" : "Usuario creado")
        setIsDialogOpen(false)
        fetchUsers()
        resetForm()
      } else {
        const errorData = await res.json().catch(() => ({}))
        // Manejar específicamente el error de email duplicado
        if (errorData.message && errorData.message.includes("usuarios_email_key")) {
          toast.error("El correo electrónico ya está registrado")
        } else {
          toast.error(errorData.message || "Error al guardar usuario")
        }
      }
    } catch (error) {
      toast.error("Error de conexión")
    }
  }

  const handleRoleChange = (value: string) => {
    setFilterRole(value)
    setCurrentPage(1)
  }

  const toggleStatus = async (user: Usuario) => {
    const action = user.activo ? "desactivar" : "reactivar"
    try {
      let res;
      if (user.activo) {
        res = await fetch(`http://localhost:8081/api/usuarios/${user.idUsuario}`, {
          method: "DELETE",
        })
      } else {
        res = await fetch(`http://localhost:8081/api/usuarios/${user.idUsuario}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...user, activo: true }),
        })
      }

      if (res.ok) {
        // Log the action
        if (user.activo) {
          await logSystemAction('USUARIO_ELIMINADO', [user.nombres], user.idUsuario)
        } else {
          await logSystemAction('USUARIO_ACTUALIZADO', [user.nombres], user.idUsuario) // Reactivación is considered an update
        }
        
        toast.success(user.activo ? "Personal desactivado" : "Personal reactivado")
        fetchUsers()
      } else {
        toast.error(`Error al ${action}`)
      }
    } catch (error) {
      toast.error(`Error al ${action}`)
    }
  }

  const resetForm = () => {
    setFormData({
      dni: "",
      nombres: "",
      email: "",
      password: "",
      activo: true,
      idRol: 3,
      nmrCelular: "",
    })
    setEditingUser(null)
  }

  const openEditDialog = (user: Usuario) => {
    setEditingUser(user)
    setFormData({
      ...user,
      password: "", // No mostramos el password
    })
    setIsDialogOpen(true)
  }

  const filteredUsers = users.filter(u => {
    const matchesSearch =
      u.nombres.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.dni.includes(search)

    const matchesRole =
      filterRole === "all" || u.idRol.toString() === filterRole

    return matchesSearch && matchesRole
  })

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / ITEMS_PER_PAGE))
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  // Reset to page 1 whenever search changes
  const handleSearchChange = (val: string) => {
    setSearch(val)
    setCurrentPage(1)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h4 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-3">
            <Shield className="h-6 w-6 text-primary" />
            Gestión de Personal
          </h4>
          <p className="text-muted-foreground mt-1 font-medium"> Administra el acceso al Sistema SisParques.</p>
        </div>
        <Button 
          onClick={() => { resetForm(); setIsDialogOpen(true); }}
          className="rounded-xl h-11 px-6 font-bold  transition-all gap-2"
        >
          <UserPlus className="h-5 w-5" />
          Nuevo Personal
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {ROLES.map((role) => (
          <Card key={role.id} className="bg-card shadow-md dark:border border-0">
            <CardContent className="py-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{role.label}: </p>
                  <p className="text-3xl font-black mt-1">
                    {users.filter(u => u.idRol === role.id && u.activo === true).length}
                  </p>
                </div>
                <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center", role.color)}>
                  <UserIcon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="rounded-2xl  bg-card shadow-md dark:border border-0">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/50  px-6 py-4">
          {/* DERECHA: título */}
          <h2 className="text-lg font-black text-foreground text-right md:text-left flex items-center gap-4">
            Listado de Personal
          </h2>
          {/* IZQUIERDA: filtros */}
          <div className="flex flex-col md:flex-row md:items-center gap-3 w-full md:w-auto">
            <Badge variant="outline" className="text-xs font-medium bg-red-500/10 text-red-600 border-red-200 px-4 ms-6">
              {filteredUsers.length} {filteredUsers.length === 1 ? "registro" : "registros"}
            </Badge>
            {/* Select */}
            <Select value={filterRole} onValueChange={handleRoleChange}>
              <SelectTrigger className="w-full md:w-56 bg-background rounded-xl">
                <SelectValue placeholder="Filtrar por rol" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">Todos los roles</SelectItem>
                {ROLES.map((role) => (
                  <SelectItem key={role.id} value={role.id.toString()}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Search */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, email o DNI..."
                className="pl-10 h-10 rounded-xl bg-background border-border/50 focus:ring-primary/20"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>

          </div>


        </div>
        {/* Tabla */}
        <div className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-border/50">
                <TableHead className="font-bold py-4">Nombres y Apellidos / Correo</TableHead>
                <TableHead className="font-bold text-center">DNI</TableHead>
                <TableHead className="font-bold text-center">Rol</TableHead>
                <TableHead className="font-bold ">Celular</TableHead>
                <TableHead className="font-bold ">Estado</TableHead>
                <TableHead className="text-right font-bold pr-8">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={5} className="h-16 animate-pulse bg-muted/10" />
                  </TableRow>
                ))
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground font-medium">
                    No se encontraron usuarios.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedUsers.map((user) => (
                  <TableRow key={user.idUsuario} className="hover:bg-muted/30 transition-colors border-border/40">
                    <TableCell className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black uppercase">
                          {user.nombres.substring(0, 2)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-foreground">{user.nombres}</span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" /> {user.email || "Sin correo"}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                         {user.dni}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={cn(
                          "w-full justify-center rounded-lg px-2.5 py-0.5 border font-bold capitalize",
                          ROLES.find(r => r.id === user.idRol)?.color
                        )}
                      >
                        {user.nombreRol}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-mono text-xs bg-muted px-2 py-1 rounded-md text-muted-foreground border border-border/50 flex items-center gap-1 w-fit">
                        <Smartphone className="h-3 w-3" /> {user.nmrCelular || "Sin número"}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {user.activo ? (
                        <span className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs uppercase tracking-wider">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Activo
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-rose-500 font-bold text-xs uppercase tracking-wider">
                          <XCircle className="h-3.5 w-3.5" /> Inactivo
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl p-4 border-1 border-gray-300">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-55 p-2 rounded-xl shadow-xl">
                          <DropdownMenuLabel className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-2 pb-2">Opciones</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => openEditDialog(user)} className="rounded-lg gap-2 font-bold cursor-pointer">
                            <Edit2 className="h-4 w-4 text-blue-500" /> Editar Datos
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="my-1" />
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="rounded-lg gap-2 font-bold  hover:bg-rose-500/10 cursor-pointer">
                                {user.activo ? (
                                  <>
                                    <Trash2 className="h-4 w-4 text-rose-500" /> Desactivar Personal
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Reactivar Personal
                                  </>
                                )}
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-3xl">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="font-black text-xl">
                                  {user.activo ? "Confirmar Desactivación" : "Confirmar Reactivación"}
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  ¿Seguro que deseas {user.activo ? "quitar el acceso" : "devolver el acceso"} a <b>{user.nombres}</b>?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-xl font-bold">Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => toggleStatus(user)} className="rounded-xl font-black bg-primary">Continuar</AlertDialogAction>
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
          
        {!loading && filteredUsers.length > 0 && totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-8 py-6 border-t border-border/30">
            <div className="text-sm text-muted-foreground font-medium">
              Mostrando{" "}
              <span className="font-bold text-foreground">
                {(currentPage - 1) * ITEMS_PER_PAGE + 1}
              </span>
              {" "}–{" "}
              <span className="font-bold text-foreground">
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredUsers.length)}
              </span>
              {" "}de{" "}
              <span className="font-bold text-foreground">{filteredUsers.length}</span>
              {" "}usuarios
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="rounded-xl font-bold h-10 border-border/50 bg-card hover:bg-muted/50 disabled:opacity-50 transition-all"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) pageNum = i + 1;
                  else if (currentPage <= 3) pageNum = i + 1;
                  else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                  else pageNum = currentPage - 2 + i;
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className={cn(
                        "w-10 h-10 rounded-xl font-bold transition-all",
                        currentPage === pageNum 
                          ? "bg-primary text-primary-foreground shadow-md border-primary" 
                          : "border-border/50 bg-card hover:bg-muted/50"
                      )}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="rounded-xl font-bold h-10 border-border/50 bg-card hover:bg-muted/50 disabled:opacity-50 transition-all"
              >
                Siguiente
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}  </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent 
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="sm:max-w-[900px] p-0 overflow-hidden border-none shadow-2xl rounded-3xl"
        >
          <form onSubmit={handleSubmit} className="bg-card">
            <div className=" bg-card py-4 px-8 text-foreground relative overflow-hidden border-b border-border/50">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
              <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-3 relative z-10 text-foreground">
                {editingUser ? <Edit2 className="h-6 w-6" /> : <UserPlus className="h-6 w-6" />}
                {editingUser ? "Editar Usuario" : "Nuevo Usuario"}
              </DialogTitle>
            </div>
            
            
            <div className="p-8 space-y-5 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Nombre Completo */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-muted-foreground tracking-widest pl-1 flex items-center gap-2">
                    Nombre Completo
                  </label>

                  <div className="relative">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />

                    <Input
                      placeholder="Ej. Luis Alejandro Flores García"
                      className="h-12 pl-11 rounded-2xl  bg-card  focus-visible:ring-2 focus-visible:ring-primary/20 "
                      value={formData.nombres}
                      onChange={(e) =>
                        setFormData({ ...formData, nombres: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                {/* DNI */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-muted-foreground tracking-widest pl-1 flex items-center gap-2">
                    DNI
                  </label>

                  <div className="relative">
                    <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />

                    <Input
                      placeholder="Ej: 73265692"
                      maxLength={8}
                      className="h-12 pl-11 rounded-2xl  bg-card  focus-visible:ring-2 focus-visible:ring-primary/20"
                      value={formData.dni}
                      onChange={(e) => {
                        const soloNumeros = e.target.value.replace(/\D/g, "");
                        setFormData({
                          ...formData,
                          dni: soloNumeros,
                        });
                      }}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">

                {/* Celular */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-muted-foreground tracking-widest pl-1 flex items-center gap-2">
                    Celular
                  </label>

                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />

                    <Input
                      placeholder="Ej: 987 654 321"
                      maxLength={9}
                      className="h-12 pl-11 rounded-2xl  bg-card  focus-visible:ring-2 focus-visible:ring-primary/20"
                      value={formData.nmrCelular || ""}
                      onChange={(e) => {
                        const soloNumeros = e.target.value.replace(/\D/g, "");
                        setFormData({
                          ...formData,
                          nmrCelular: soloNumeros,
                        });
                      }}
                    />
                  </div>
                </div>

                {/* Rol */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-muted-foreground tracking-widest pl-1 flex items-center gap-2">
                    Rol
                  </label>

                  <Select
                    value={formData.idRol.toString()}
                    onValueChange={(v) =>
                      setFormData({ ...formData, idRol: parseInt(v) })
                    }
                  >
                    <SelectTrigger className="w-full h-16 rounded-2xl  bg-card  px-4 focus:ring-primary">
                      <SelectValue placeholder="Seleccione un rol" />
                    </SelectTrigger>

                    <SelectContent className="rounded-2xl border-border/50 shadow-2xl">
                      {ROLES.map((role) => (
                        <SelectItem
                          key={role.id}
                          value={role.id.toString()}
                          className="font-bold py-3"
                        >
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-muted-foreground tracking-widest pl-1 flex items-center gap-2">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                    <Input 
                      type="email"
                      placeholder="Ej: usuario_brusben@gmail.com" 
                      className="h-12 pl-11 rounded-2xl  bg-card  focus-visible:ring-2 focus-visible:ring-primary/20"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2 relative">
                  <label className="text-xs font-black uppercase text-muted-foreground tracking-widest pl-1 flex items-center gap-2">
                    Contraseña
                  </label>
                  
                  <div className="relative">
                    <Shield className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                    <Input 
                      type="password"
                      placeholder="••••••••"
                      className="h-12 pl-11 rounded-2xl  bg-card  focus-visible:ring-2 focus-visible:ring-primary/20"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                    />
                    
                    {/* Tooltip que aparece arriba del input */}
                    {formData.password && !validatePassword(formData.password).isValid && (
                      <div 
                        className="absolute bottom-full left-0 right-0 mb-2 p-3 rounded-xl bg-background border-2 border-border shadow-xl z-50"
                      >
                        <div className="absolute bottom-0 left-6 transform translate-y-1/2 rotate-45 w-3 h-3 bg-background border-r-2 border-b-2 border-border"></div>
                        <p className="text-xs font-black uppercase text-muted-foreground tracking-wider mb-2">Requisitos de contraseña:</p>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs">
                            <span className={cn(
                              "w-3 h-3 rounded-full flex items-center justify-center text-[8px] font-black",
                              validatePassword(formData.password).requirements.minLength 
                                ? "bg-emerald-500 text-white" 
                                : "bg-gray-200 text-gray-500"
                            )}>
                              ✓
                            </span>
                            <span className={cn(
                              "font-medium",
                              validatePassword(formData.password).requirements.minLength 
                                ? "text-emerald-600" 
                                : "text-gray-500"
                            )}>
                              Mínimo 8 caracteres
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className={cn(
                              "w-3 h-3 rounded-full flex items-center justify-center text-[8px] font-black",
                              validatePassword(formData.password).requirements.hasUppercase 
                                ? "bg-emerald-500 text-white" 
                                : "bg-gray-200 text-gray-500"
                            )}>
                              ✓
                            </span>
                            <span className={cn(
                              "font-medium",
                              validatePassword(formData.password).requirements.hasUppercase 
                                ? "text-emerald-600" 
                                : "text-gray-500"
                            )}>
                              Mayúscula (A-Z)
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className={cn(
                              "w-3 h-3 rounded-full flex items-center justify-center text-[8px] font-black",
                              validatePassword(formData.password).requirements.hasLowercase 
                                ? "bg-emerald-500 text-white" 
                                : "bg-gray-200 text-gray-500"
                            )}>
                              ✓
                            </span>
                            <span className={cn(
                              "font-medium",
                              validatePassword(formData.password).requirements.hasLowercase 
                                ? "text-emerald-600" 
                                : "text-gray-500"
                            )}>
                              Minúscula (a-z)
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className={cn(
                              "w-3 h-3 rounded-full flex items-center justify-center text-[8px] font-black",
                              validatePassword(formData.password).requirements.hasNumber 
                                ? "bg-emerald-500 text-white" 
                                : "bg-gray-200 text-gray-500"
                            )}>
                              ✓
                            </span>
                            <span className={cn(
                              "font-medium",
                              validatePassword(formData.password).requirements.hasNumber 
                                ? "text-emerald-600" 
                                : "text-gray-500"
                            )}>
                              Número (0-9)
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className={cn(
                              "w-3 h-3 rounded-full flex items-center justify-center text-[8px] font-black",
                              validatePassword(formData.password).requirements.hasSpecialChar 
                                ? "bg-emerald-500 text-white" 
                                : "bg-gray-200 text-gray-500"
                            )}>
                              ✓
                            </span>
                            <span className={cn(
                              "font-medium",
                              validatePassword(formData.password).requirements.hasSpecialChar 
                                ? "text-emerald-600" 
                                : "text-gray-500"
                            )}>
                              Carácter especial
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-400/5 border border-emerald-400/10 transition-all select-none">
                <input 
                  type="checkbox" 
                  id="activo" 
                  className="h-5 w-5 rounded-md border-emerald-400/20 bg-background checked:bg-emerald-500"
                  checked={formData.activo}
                  onChange={(e) => setFormData({...formData, activo: e.target.checked})}
                />
                <label htmlFor="activo" className="text-sm font-bold text-emerald-500 cursor-pointer">
                  Habilitar acceso inmediato al usuario
                </label>
              </div>
            </div>
            <DialogFooter className="w-full bg-muted/20 p-4 pt-6 border-t border-border/30">
              <div className="flex justify-between w-full gap-4">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setIsDialogOpen(false)} 
                  className="h-12 px-10 rounded-2xl bg-card border"
                >
                  Cancelar Registro
                </Button>
                <Button 
                  type="submit" 
                  className="h-12 px-10 font-black rounded-2xl bg-primary  flex-1"
                >
                  {editingUser ? "Guardar Cambios" : "Crear Usuario"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
