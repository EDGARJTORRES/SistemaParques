"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  ShieldCheck, 
  ShieldOff, 
  Fingerprint, 
  QrCode, 
  Smartphone, 
  ChevronRight, 
  Loader2,
  CheckCircle2,
  XCircle
} from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import Image from "next/image"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"

interface Props {
  idUsuario: number
  totpActivo: boolean
  onUpdate?: () => void
}

export function TotpSetup({ idUsuario, totpActivo, onUpdate }: Props) {
  const { user, setUser } = useAuth()
  const [step, setStep] = useState<"idle" | "qr" | "verify">("idle")
  const [qrUri, setQrUri] = useState("")
  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const startSetup = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`http://localhost:8081/api/auth/2fa/setup/${idUsuario}`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Error al iniciar configuración")
      setQrUri(data.qrDataUri)
      setStep("qr")
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setIsLoading(false)
    }
  }

  const verifyAndActivate = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setError(null)
    if (code.length !== 6) {
      setError("Ingresa el código de 6 dígitos.")
      return
    }
    setIsLoading(true)
    try {
      const res = await fetch(`http://localhost:8081/api/auth/2fa/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idUsuario, code })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Código incorrecto")
      
      toast.success("¡Seguridad reforzada!", {
        description: "La autenticación de dos factores ha sido activada."
      })
      
      // Actualizar estado global y almacenamiento
      if (user) {
        const updatedUser = { ...user, totpActivo: true }
        setUser(updatedUser)
        sessionStorage.setItem("user", JSON.stringify(updatedUser))
      }
      
      setStep("idle")
      setCode("")
      onUpdate?.()
    } catch (e: any) {
      setError(e.message)
      toast.error("Error de verificación")
    } finally {
      setIsLoading(false)
    }
  }

  const disable2FA = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`http://localhost:8081/api/auth/2fa/disable/${idUsuario}`, { method: "POST" })
      if (!res.ok) throw new Error("No se pudo desactivar el 2FA")
      
      toast.success("Seguridad actualizada", {
        description: "Se ha desactivado la autenticación de dos factores."
      })

      // Actualizar estado global y almacenamiento
      if (user) {
        const updatedUser = { ...user, totpActivo: false }
        setUser(updatedUser)
        sessionStorage.setItem("user", JSON.stringify(updatedUser))
      }
      
      onUpdate?.()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggle = (checked: boolean) => {
    if (checked) {
      startSetup()
    } else {
      disable2FA()
    }
  }

  // --- UI RENDER ---

  // Vista de Configuración (QR o Verificación)
  if (step !== "idle") {
    return (
      <div className="space-y-6 mt-4 p-6 rounded-3xl bg-muted/30 border border-border/50 animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              {step === "qr" ? <QrCode className="h-5 w-5" /> : <Smartphone className="h-5 w-5" />}
            </div>
            <div>
              <h5 className="font-bold text-sm">
                {step === "qr" ? "Paso 1: Escanear QR" : "Paso 2: Verificar Código"}
              </h5>
              <p className="text-xs text-muted-foreground">Configuración de seguridad</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setStep("idle")}
            className="text-muted-foreground hover:text-foreground"
          >
            Cancelar
          </Button>
        </div>

        {step === "qr" ? (
          <div className="space-y-6">
            <div className="flex flex-col items-center gap-6 p-6 bg-background rounded-2xl border border-border/50 shadow-sm">
              {qrUri ? (
                <div className="relative p-3 bg-white rounded-xl shadow-inner group">
                  <Image src={qrUri} alt="QR 2FA" width={180} height={180} unoptimized className="rounded-lg group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 border-2 border-primary/5 rounded-xl pointer-events-none" />
                </div>
              ) : (
                <div className="h-[180px] w-[180px] flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}
              <div className="text-center space-y-2">
                <p className="text-sm font-medium">Usa Google Authenticator para escanear</p>
                <p className="text-xs text-muted-foreground max-w-[240px]">
                  Abre la app en tu celular, pulsa en el botón "+" y selecciona "Escanear código QR".
                </p>
              </div>
            </div>
            <Button className="w-full h-12 rounded-2xl font-bold gap-2" onClick={() => setStep("verify")}>
              Ya lo escaneé, continuar <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <form onSubmit={verifyAndActivate} className="space-y-6">
              <div className="space-y-3">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground pl-1">
                  Código de 6 dígitos
                </Label>
                <div className="relative">
                  <Input 
                    placeholder="000000" 
                    value={code} 
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    className="h-16 rounded-2xl bg-background border-border/50 text-center text-3xl font-black tracking-[0.4em] focus-visible:ring-primary/20 placeholder:opacity-20"
                    maxLength={6} 
                    autoFocus 
                  />
                  {code.length === 6 && !isLoading && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <CheckCircle2 className="h-6 w-6 text-emerald-500 animate-in fade-in zoom-in" />
                    </div>
                  )}
                </div>
                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 text-destructive text-xs font-bold animate-in slide-in-from-top-2">
                    <XCircle className="h-4 w-4" />
                    {error}
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <Button 
                   type="button"
                   variant="outline" 
                   className="h-12 flex-1 rounded-2xl font-bold" 
                   onClick={() => setStep("qr")}
                >
                  Volver al QR
                </Button>
                <Button 
                  disabled={isLoading || code.length !== 6} 
                  className="h-12 flex-[2] rounded-2xl font-black gap-2 shadow-lg shadow-primary/20"
                >
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
                  Finalizar Activación
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    )
  }

  // Vista Principal (Idle)
  return (
    <div className={cn(
      "relative overflow-hidden transition-all duration-500 rounded-2xl border p-6 group",
      totpActivo 
        ? "bg-emerald-500/5 border-emerald-500/20 shadow-[0_0_20px_-5px_rgba(16,185,129,0.1)]" 
        : "bg-secondary/20 border-border/50"
    )}>
      <div className="flex items-center gap-4 relative z-10">
        <div className={cn(
          "h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-500 rotate-0 group-hover:rotate-12",
          totpActivo ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "bg-muted text-muted-foreground"
        )}>
          {totpActivo ? <ShieldCheck className="h-7 w-7" /> : <ShieldOff className="h-7 w-7" />}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-black text-lg">Autenticación 2FA</h4>
            {totpActivo && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 animate-pulse">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-black uppercase tracking-wider">Protegido</span>
              </div>
            )}
          </div>
          <p className="text-sm text-muted-foreground font-medium  mt-1">
            {totpActivo 
              ? "Tu cuenta está blindada con seguridad avanzada de Google." 
              : "Agrega una capa extra de seguridad para proteger tus datos sensibles."}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-center mt-4">
        <div className="flex items-center gap-4 bg-background/50 backdrop-blur-sm p-3 rounded-2xl border border-border/40 shadow-sm w-full sm:w-auto justify-between sm:justify-start mt-4 ">
          <span className={cn(
            "text-xs font-black uppercase tracking-widest px-2",
            totpActivo ? "text-emerald-500" : "text-muted-foreground"
          )}>
            {totpActivo ? "Activado" : "Desactivado"}
          </span>
          <Switch
            checked={totpActivo}
            onCheckedChange={handleToggle}
            disabled={isLoading}
            className="data-[state=checked]:bg-emerald-500"
          />
        </div>
      </div>
      
      {/* Subtle background decoration */}
      <div className={cn(
        "absolute -right-4 -bottom-4 h-32 w-32 rounded-full blur-3xl transition-opacity duration-1000",
        totpActivo ? "bg-emerald-500/10 opacity-100" : "bg-primary/5 opacity-0"
      )} />
    </div>
  )
}