"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Mail, Lock, AlertCircle, ShieldCheck } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"

type ViewMode = "login" | "totp" | "forgot" | "reset"

// Guarda temporalmente los datos del login para reusarlos en la pantalla TOTP
let pendingLoginData = { email: "", password: "" }

export function LoginForm() {
  const [view, setView] = useState<ViewMode>("login")
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [totpCode, setTotpCode] = useState("")
  const [recoveryToken, setRecoveryToken] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { setUser } = useAuth()

  const doLogin = async (emailVal: string, passwordVal: string, totpCodeVal?: string) => {
    const body: any = {
      email: emailVal,
      password: passwordVal
    }

    if (totpCodeVal) {
      body.totpCode = totpCodeVal
    }

    const response = await fetch("http://localhost:8081/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    })

    const data = await response.json()
    if (!response.ok) throw new Error(data.message || "Credenciales incorrectas.")
    return data
  }

  const applyLogin = (data: any, emailVal: string) => {
    const userData = {
      id: data.idUsuario ?? "",
      email: data.email || emailVal,
      nombre: data.nombre || "Usuario",
      rol: data.nombreRol || "Sin rol",
      avatar: data.avatar || undefined,
      totpActivo: data.totpActivo ?? false, //  AGREGAR ESTO
    }
    sessionStorage.setItem("user", JSON.stringify(userData))
    if (data.token) localStorage.setItem("token", data.token)
    setUser(userData)

    setTimeout(() => {
      const rol = (data.nombreRol || "").toLowerCase()
      if (rol === "admin" || rol === "administrador") window.location.href = "/admin"
      else if (rol === "docente") window.location.href = "/docente"
      else if (rol === "estudiante") window.location.href = "/mis-clases/"
      else window.location.href = "/"
    }, 800)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!email || !password) { setError("Completa todos los campos."); return }
    setIsLoading(true)
    try {
      const data = await doLogin(email, password)
      if (data.token === "2FA_REQUIRED") {
        pendingLoginData = { email, password }
        setTotpCode("")
        setView("totp")
        return
      }
      applyLogin(data, email)
    } catch (err: any) {
      if (err.message.includes("2FA_REQUIRED")) {
        pendingLoginData = { email, password }
        setTotpCode("")
        setView("totp")
      } else {
        setError(err.message)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleTotpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!totpCode || totpCode.length !== 6) { setError("Ingresa el código de 6 dígitos."); return }
    setIsLoading(true)
    try {
      const data = await doLogin(pendingLoginData.email, pendingLoginData.password, totpCode)
      applyLogin(data, pendingLoginData.email)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) { setError("Ingresa tu correo electrónico."); return }
    setIsLoading(true); setError(null)
    try {
      const res = await fetch(`http://localhost:8081/api/auth/forgot-password?email=${email}`, { method: "POST" })
      const data = await res.json()
      if (res.ok) {
        toast.info(`Código enviado (Simulación): ${data.token}`, { duration: 10000 })
        setView("reset")
      } else { setError(data.message) }
    } catch { setError("Error al solicitar recuperación.") }
    finally { setIsLoading(false) }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!recoveryToken || !newPassword) { setError("Completa todos los campos."); return }
    setIsLoading(true); setError(null)
    try {
      const res = await fetch("http://localhost:8081/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: recoveryToken, newPassword })
      })
      const data = await res.json()
      if (res.ok) { toast.success("Contraseña actualizada."); setView("login") }
      else { setError(data.message) }
    } catch { setError("Error al actualizar contraseña.") }
    finally { setIsLoading(false) }
  }

  // ── Vista: Código TOTP ──────────────────────────────────────
  if (view === "totp") {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="text-center lg:text-left">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-7 h-7 text-primary" />
            <h2 className="text-3xl font-bold text-foreground">Verificación 2FA</h2>
          </div>
          <p className="mt-1 text-muted-foreground">
            Abre Google Authenticator e ingresa el código de 6 dígitos.
          </p>
        </div>
        <form onSubmit={handleTotpSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="totp-code">Código de autenticación</Label>
            <Input
              id="totp-code"
              placeholder="000000"
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
              className="h-14 bg-secondary/50 font-mono text-center text-2xl tracking-[0.5em] dark:border-foreground"
              maxLength={6}
              autoFocus
              required
            />
          </div>
          <Button disabled={isLoading} className="w-full h-12 font-bold">
            {isLoading ? "Verificando..." : "Verificar y Entrar"}
          </Button>
          <button
            type="button"
            onClick={() => { setView("login"); setError(null) }}
            className="w-full text-sm text-muted-foreground hover:text-primary transition-colors font-medium"
          >
            ← Volver
          </button>
        </form>
      </div>
    )
  }

  // ── Vista: Olvidé contraseña ────────────────────────────────
  if (view === "forgot") {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="text-center lg:text-left">
          <h2 className="text-3xl font-bold text-foreground">Recuperar Acceso</h2>
          <p className="mt-2 text-muted-foreground">Ingresa tu correo para recibir un código de seguridad.</p>
        </div>
        <form onSubmit={handleForgotPassword} className="space-y-6">
          {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}
          <div className="space-y-2">
            <Label htmlFor="forgot-email">Correo electrónico</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="forgot-email" type="email" placeholder="tu@email.com" value={email}
                onChange={(e) => setEmail(e.target.value)} className="pl-10 h-12 bg-secondary/50 dark:border-foreground" required />
            </div>
          </div>
          <Button disabled={isLoading} className="w-full h-12 font-bold">{isLoading ? "Enviando..." : "Enviar Código"}</Button>
          <button type="button" onClick={() => { setView("login"); setError(null) }}
            className="w-full text-sm text-muted-foreground hover:text-primary transition-colors font-medium">
            Volver al inicio de sesión
          </button>
        </form>
      </div>
    )
  }

  // ── Vista: Reset password ───────────────────────────────────
  if (view === "reset") {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="text-center lg:text-left">
          <h2 className="text-3xl font-bold text-foreground">Nueva Contraseña</h2>
          <p className="mt-2 text-muted-foreground">Ingresa el código enviado y tu nueva clave.</p>
        </div>
        <form onSubmit={handleResetPassword} className="space-y-6">
          {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}
          <div className="space-y-2">
            <Label htmlFor="token">Código de 6 dígitos</Label>
            <Input id="token" placeholder="000000" value={recoveryToken} onChange={(e) => setRecoveryToken(e.target.value)}
              className="h-12 bg-secondary/50 font-mono text-center text-lg tracking-widest dark:border-foreground" maxLength={6} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">Nueva Contraseña</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="new-password" type={showPassword ? "text" : "password"} placeholder="••••••••"
                value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                className="pl-10 h-12 bg-secondary/50 dark:border-foreground" required />
            </div>
          </div>
          <Button disabled={isLoading} className="w-full h-12 font-black text-white">{isLoading ? "Actualizando..." : "Restablecer Contraseña"}</Button>
          <button type="button" onClick={() => { setView("login"); setError(null) }}
            className="w-full text-sm text-muted-foreground hover:text-primary transition-colors font-medium">Cancelar</button>
        </form>
      </div>
    )
  }

  // ── Vista: Login principal ──────────────────────────────────
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="text-center lg:text-left">
        <h2 className="text-3xl font-bold text-foreground dark:text-primary-2">Iniciar Sesión</h2>
        <p className="mt-2 text-muted-foreground">Ingresa tus credenciales para acceder a tu cuenta</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}
        <div className="space-y-2">
          <Label htmlFor="email">Correo electrónico</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="email" type="email" placeholder="tu@email.com" value={email}
              onChange={(e) => { setEmail(e.target.value); if (error) setError(null) }}
              className="pl-10 h-12 bg-secondary/50 border-border dark:border-foreground"
              autoComplete="email" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password}
              onChange={(e) => { setPassword(e.target.value); if (error) setError(null) }}
              className="pl-10 pr-10 h-12 bg-secondary/50 border-border dark:border-foreground"
              autoComplete="current-password" />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 rounded border-border text-primary focus:ring-primary" />
            <span className="text-muted-foreground">Recordarme</span>
          </label>
          <button type="button" onClick={() => { setView("forgot"); setError(null) }}
            className="text-primary hover:text-primary/80 font-medium transition-colors">
            ¿Olvidaste tu contraseña?
          </button>
        </div>
        <Button type="submit" disabled={isLoading} className="w-full h-12 font-semibold text-base">
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Ingresando...
            </span>
          ) : "Ingresar"}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          ¿No tienes una cuenta?{" "}
          <a href="#" className="text-primary hover:text-primary/80 font-medium transition-colors">Contacta con administración</a>
        </p>
      </form>
    </div>
  )
}