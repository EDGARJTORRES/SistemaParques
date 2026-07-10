"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

type AllowedRole = "admin" | "administrador" | "subgerente" | "supervisor"


interface RouteGuardProps {
  allowedRoles: AllowedRole[]
  redirectIfUnauthenticated?: string
  redirectIfUnauthorized?: string
  children: React.ReactNode
}

/** Normaliza el rol: minúsculas, sin acentos, sin espacios */
function normalizeRol(rol: string): string {
  return rol
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
}

/** Ruta home según el rol */
function getRolHome(rol: string): string {
  switch (normalizeRol(rol)) {
    case "admin":
    case "administrador":
      return "/admin"
    default:
      return "/"
  }
}

export function RouteGuard({
  allowedRoles,
  redirectIfUnauthenticated = "/",
  redirectIfUnauthorized,
  children,
}: RouteGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const redirected = useRef(false)

  useEffect(() => {
    if (loading || redirected.current) return

    if (!user) {
      redirected.current = true
      router.replace(redirectIfUnauthenticated)
      return
    }

    const rol = normalizeRol(user.rol ?? "") as AllowedRole
    const normalizedAllowed = allowedRoles.map(normalizeRol)

    if (!normalizedAllowed.includes(rol)) {
      redirected.current = true
      router.replace(redirectIfUnauthorized ?? getRolHome(rol))
    }
  }, [user, loading])

  // Solo bloquea mientras carga la sesión por primera vez
  if (loading) return <LoadingScreen />

  // Sin sesión: no renderiza nada (el useEffect redirige)
  if (!user) return null

  const rol = normalizeRol(user.rol ?? "") as AllowedRole
  const normalizedAllowed = allowedRoles.map(normalizeRol)

  // Rol incorrecto: no renderiza nada (el useEffect redirige)
  if (!normalizedAllowed.includes(rol)) return null

  // Autorizado: renderiza inmediatamente sin pantalla de carga
  return <>{children}</>
}
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6">
        
        {/* Spinner minimalista */}
        <div className="relative h-12 w-12">
          <div className="absolute inset-0 rounded-full border-2 border-border" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin" />
        </div>

        {/* Texto */}
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">
            Verificando acceso
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Espere un momento...
          </p>
        </div>

      </div>
    </div>
  );
}