"use client"

import { useState, useEffect } from "react"
import {
  User,
  Mail,
  Shield,
  Lock,
  Edit2,
  Save,
  X,
  List,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Fingerprint,
  Calendar,
  FileText,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"

interface PerfilData {
  idUsuario: number
  nombres: string
  email: string
  dni: string
  nombreRol: string
  activo: boolean
  fechaCreacion?: string
}

interface ChangePasswordForm {
  passwordActual: string
  passwordNueva: string
  passwordConfirmar: string
}

const ROLES = [
  { id: 1, name: "administrador", label: "Administrador", color: "bg-purple-500/10 text-purple-600 border-purple-200" },
  { id: 2, name: "subgerente", label: "Subgerente", color: "bg-blue-500/10 text-blue-600 border-blue-200" },
  { id: 3, name: "supervisor", label: "Supervisor", color: "bg-emerald-500/10 text-emerald-600 border-emerald-200" },
]

export default function PerfilPage() {
  const { user } = useAuth()
  const [perfil, setPerfil] = useState<PerfilData | null>(null)
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [editData, setEditData] = useState<PerfilData | null>(null)
  const [changePasswordMode, setChangePasswordMode] = useState(false)
  const [showPasswords, setShowPasswords] = useState({
    actual: false,
    nueva: false,
    confirmar: false,
  })
  const [passwordForm, setPasswordForm] = useState<ChangePasswordForm>({
    passwordActual: "",
    passwordNueva: "",
    passwordConfirmar: "",
  })

  useEffect(() => {
    if (user?.email) {
      fetchPerfil()
    }
  }, [user])

  const fetchPerfil = async () => {
    try {
      if (!user?.email) {
        console.error("No hay email del usuario:", user)
        setLoading(false)
        return
      }

      const token = localStorage.getItem("token")
      if (!token) {
        console.error("No hay token disponible")
        toast.error("Sesión expirada. Por favor inicia sesión nuevamente.")
        setLoading(false)
        return
      }

      const encodedEmail = encodeURIComponent(user.email)
      const url = `http://localhost:8081/api/usuarios/email/${encodedEmail}`
      console.log("Buscando perfil en:", url)

      const res = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      })
      console.log("Response status:", res.status)

      if (res.ok) {
        const data = await res.json()
        console.log("Datos cargados:", data)
        setPerfil(data)
        setEditData(data)
      } else {
        const errorData = await res.text()
        console.error("Error:", res.status, errorData)
        
        // Fallback: intentar obtener todos los usuarios y filtrar
        console.log("Intentando fallback...")
        const allRes = await fetch("http://localhost:8081/api/usuarios", {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        })
        if (allRes.ok) {
          const allUsers = await allRes.json()
          const foundUser = allUsers.find((u: any) => u.email === user.email)
          if (foundUser) {
            setPerfil(foundUser)
            setEditData(foundUser)
          } else {
            toast.error("Usuario no encontrado en la BD")
          }
        } else {
          toast.error(`Error al cargar perfil: ${res.status}`)
        }
      }
    } catch (error) {
      console.error("Error en fetch:", error)
      toast.error("Error de conexión con el servidor")
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!editData || !perfil) return

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        toast.error("Sesión expirada")
        return
      }

      const res = await fetch(`http://localhost:8081/api/usuarios/${perfil.idUsuario}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(editData),
      })

      if (res.ok) {
        setPerfil(editData)
        setEditMode(false)
        toast.success("Perfil actualizado exitosamente")
      } else {
        toast.error("Error al actualizar perfil")
      }
    } catch (error) {
      toast.error("Error de conexión")
    }
  }

  const handleChangePassword = async () => {
    if (!passwordForm.passwordNueva || !passwordForm.passwordActual) {
      toast.error("Completa todos los campos")
      return
    }

    if (passwordForm.passwordNueva !== passwordForm.passwordConfirmar) {
      toast.error("Las contraseñas no coinciden")
      return
    }

    if (passwordForm.passwordNueva.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres")
      return
    }

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        toast.error("Sesión expirada")
        return
      }

      const res = await fetch(`http://localhost:8081/api/usuarios/${perfil?.idUsuario}/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          conelena_Actual: passwordForm.passwordActual,
          passwordNueva: passwordForm.passwordNueva,
        }),
      })

      if (res.ok) {
        setPasswordForm({ passwordActual: "", passwordNueva: "", passwordConfirmar: "" })
        setChangePasswordMode(false)
        toast.success("Contraseña actualizada exitosamente")
      } else {
        toast.error("Error al cambiar contraseña")
      }
    } catch (error) {
      toast.error("Error de conexión")
    }
  }

  const getRoleColor = () => {
    return ROLES.find(r => r.label === perfil?.nombreRol)?.color || ""
  }

  const getInitials = (nombre?: string) => {
    if (!nombre) return "U"
    const parts = nombre.split(" ")
    return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase()
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center gap-4 mb-8">
          <div className="h-12 w-12 rounded-2xl bg-primary/20 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-8 w-48 bg-primary/20 rounded-lg animate-pulse" />
            <div className="h-4 w-32 bg-primary/10 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  if (!perfil) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="border-none shadow-lg">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-rose-500 mx-auto mb-4" />
            <p className="text-foreground font-bold">No se pudo cargar el perfil</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
            <User className="h-8 w-8 text-primary" />
            Mi Perfil
          </h1>
          <p className="text-muted-foreground mt-1 font-medium">Gestiona tu información personal y seguridad</p>
        </div>
        {!editMode && !changePasswordMode && (
          <Button
            onClick={() => setEditMode(true)}
            className="rounded-xl h-11 px-6 font-bold transition-all gap-2"
          >
            <Edit2 className="h-5 w-5" />
            Editar Perfil
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card Principal */}
        <div className="lg:col-span-2  rounded-2xl bg-card shadow-md dark:border border-0">
          <div  className="border-b border-border/50 bg-muted/20 px-4 py-3">
            <h4 className="m-0 flex items-center gap-2 py-1">
              <List className="h-5 w-5 text-green-500" />
              Informacion Personal
            </h4>
          </div >
          <div className="pt-4 m-6 ">
            {!editMode ? (
              <div className="space-y-8">
                {/* Avatar y Rol */}
                <div className="flex items-start gap-6">
                  <div className={cn(
                    "h-24 w-24 rounded-2xl flex items-center justify-center text-2xl font-black flex-shrink-0",
                    "bg-primary text-white"
                  )}>
                    {getInitials(perfil.nombres)}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-black text-foreground mb-1">{perfil.nombres}</h2>
                    <Badge className={cn("rounded-lg px-3 py-1 border font-bold capitalize", getRoleColor())}>
                      {perfil.nombreRol}
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-3 flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-500" />
                      {perfil.activo ? "Cuenta Activa" : "Cuenta Inactiva"}
                    </p>
                  </div>
                </div>

                {/* Datos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-muted-foreground tracking-widest">
                      <Mail className="inline h-4 w-4 mr-1" />
                      Correo Electrónico
                    </label>
                    <p className="text-lg font-bold text-foreground">{perfil.email}</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-muted-foreground tracking-widest">
                      <Fingerprint className="inline h-4 w-4 mr-1" />
                      DNI / Cédula
                    </label>
                    <p className="text-lg font-mono font-bold text-foreground">{perfil.dni}</p>
                  </div>

                  {perfil.fechaCreacion && (
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase text-muted-foreground tracking-widest">
                        <Calendar className="inline h-4 w-4 mr-1" />
                        Fecha de Registro
                      </label>
                      <p className="text-lg font-bold text-foreground">
                        {new Date(perfil.fechaCreacion).toLocaleDateString("es-ES")}
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-muted-foreground tracking-widest">
                      <Shield className="inline h-4 w-4 mr-1" />
                      Estado
                    </label>
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "h-3 w-3 rounded-full",
                        perfil.activo ? "bg-emerald-500" : "bg-rose-500"
                      )} />
                      <p className="font-bold text-foreground">
                        {perfil.activo ? "Activo" : "Inactivo"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-muted-foreground tracking-widest pl-1">
                    Nombre Completo
                  </label>
                  <Input
                    disabled
                    value={editData?.nombres || ""}
                    onChange={(e) => setEditData(editData ? { ...editData, nombres: e.target.value } : null)}
                    className="h-12 rounded-2xl bg-secondary/30 border-none focus:ring-2 focus:ring-primary/20 font-bold opacity-60 cursor-not-allowed"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-muted-foreground tracking-widest pl-1">
                    Correo Electrónico
                  </label>
                  <Input
                    type="email"
                    value={editData?.email || ""}
                    onChange={(e) => setEditData(editData ? { ...editData, email: e.target.value } : null)}
                    className="h-12 rounded-2xl bg-secondary/30 border-none focus:ring-2 focus:ring-primary/20 font-bold"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-muted-foreground tracking-widest pl-1">
                    DNI / Cédula
                  </label>
                  <Input
                    disabled
                    value={editData?.dni || ""}
                    onChange={(e) => setEditData(editData ? { ...editData, dni: e.target.value } : null)}
                    className="h-12 rounded-2xl bg-secondary/30 border-none focus:ring-2 focus:ring-primary/20 font-bold opacity-60 cursor-not-allowed"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleSaveProfile}
                    className="h-12 px-6 font-bold rounded-2xl bg-primary shadow-lg shadow-primary/20"
                  >
                    <Save className="h-5 w-5 mr-2" />
                    Guardar Cambios
                  </Button>
                  <Button
                    onClick={() => {
                      setEditMode(false)
                      setEditData(perfil)
                    }}
                    variant="ghost"
                    className="h-12 px-6  rounded-2xl bg-card border"
                  >
                    <X className="h-5 w-5 mr-2" />
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Card Seguridad */}
        <div  className="rounded-2xl bg-card shadow-md dark:border border-0">
          <div  className="border-b border-border/50 bg-muted/20 px-4 py-3">
            <h4 className="m-0 flex items-center gap-2 py-1">
              <Lock className="h-5 w-5 text-green-500" />
              Seguridad
            </h4>
          </div >
          <div  className="pt-4 space-y-4 m-6">
            {!changePasswordMode ? (
              <>
                <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10">
                  <p className="text-sm text-muted-foreground font-medium">
                    Cambiar tu contraseña regularmente es importante para mantener tu cuenta segura.
                  </p>
                </div>
                <Button
                  onClick={() => setChangePasswordMode(true)}
                  variant="outline"
                  className="w-full h-12 rounded-2xl font-bold border-2 border-primary/20"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Cambiar Contraseña
                </Button>
              </>
            ) : (
              <div className="space-y-4">
                {/* Contraseña Actual */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-muted-foreground tracking-widest pl-1">
                    Contraseña Actual
                  </label>
                  <div className="relative">
                    <Input
                      type={showPasswords.actual ? "text" : "password"}
                      value={passwordForm.passwordActual}
                      onChange={(e) => setPasswordForm({ ...passwordForm, passwordActual: e.target.value })}
                      placeholder="••••••••"
                      className="h-10 rounded-xl bg-secondary/30 border-none focus:ring-2 focus:ring-primary/20 font-bold pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, actual: !showPasswords.actual })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPasswords.actual ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Contraseña Nueva */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-muted-foreground tracking-widest pl-1">
                    Contraseña Nueva
                  </label>
                  <div className="relative">
                    <Input
                      type={showPasswords.nueva ? "text" : "password"}
                      value={passwordForm.passwordNueva}
                      onChange={(e) => setPasswordForm({ ...passwordForm, passwordNueva: e.target.value })}
                      placeholder="••••••••"
                      className="h-10 rounded-xl bg-secondary/30 border-none focus:ring-2 focus:ring-primary/20 font-bold pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, nueva: !showPasswords.nueva })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPasswords.nueva ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirmar Contraseña */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-muted-foreground tracking-widest pl-1">
                    Confirmar Contraseña
                  </label>
                  <div className="relative">
                    <Input
                      type={showPasswords.confirmar ? "text" : "password"}
                      value={passwordForm.passwordConfirmar}
                      onChange={(e) => setPasswordForm({ ...passwordForm, passwordConfirmar: e.target.value })}
                      placeholder="••••••••"
                      className="h-10 rounded-xl bg-secondary/30 border-none focus:ring-2 focus:ring-primary/20 font-bold pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, confirmar: !showPasswords.confirmar })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPasswords.confirmar ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={handleChangePassword}
                    className="flex-1 h-10 px-4 font-bold rounded-xl bg-primary"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Actualizar
                  </Button>
                  <Button
                    onClick={() => {
                      setChangePasswordMode(false)
                      setPasswordForm({ passwordActual: "", passwordNueva: "", passwordConfirmar: "" })
                    }}
                    variant="ghost"
                    className="flex-1 h-10 px-4 rounded-xl bg-card border"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div >
      </div>
    </div>
  )
}
