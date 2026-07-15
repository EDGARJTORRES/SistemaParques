"use client"

import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import React, { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import {
  Home,
  LogOut,
  ClipboardList,
  Bell,
  Layers,
  Package,
  Hammer,
  Wrench,
  FerrisWheel,
  Search,
  ChevronLeft,
  ChevronDown,
  User,
  Settings,
  Monitor,
  LayoutGrid,
  TriangleAlert,
  Calendar,
  FileText,
  TreePine
} from "lucide-react"

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
  useSidebar,

} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/lib/auth-context"
import { RouteGuard } from "@/lib/route-guard"

type SingleMenuItem = {
  type: "single"
  icon: any
  label: string
  href: string
  badge?: string | number
}

type GroupMenuItem = {
  type: "group"
  icon: any
  label: string
  children: { icon: any; label: string; href: string }[]
}

type LabelMenuItem = {
  type: "label"
  label: string
}

type MenuItem = SingleMenuItem | GroupMenuItem | LabelMenuItem

const getMenuGroups = (totalMatriculas: number): MenuItem[] => [
  { type: "label", label: "Principal" },
  {
    type: "single",
    icon: LayoutGrid,
    label: "Inicio",
    href: "/admin",
  },
  {
    type: "single",
    icon: Wrench,
    label: "Programación",
    href: "/admin/programacion",
  },
  {
    type: "single",
    icon:  Monitor,
    label: "Control y Monitoreo",
    href: "/admin/controlmonitoreo",
  },
  {
    type: "single",
    icon:  Calendar,
    label: "Consultar Cronograma",
    href: "/admin/cronograma",
  },
  {
    type: "single",
    icon: Package,
    label: "Abastecimiento Mat.",
    href: "/admin/abastecimiento",
  },
  {
    type: "single",
    icon: TriangleAlert,
    label: "Incidencias",
    href: "/admin/incidencia",
  },
  { type: "label", label: "Catálogos" },
  {
    type: "single",
    icon: Layers,
    label: "Asignación de Servicio",
    href: "/admin/asignacion",
  },
  {
    type: "single",
    icon: TreePine,
    label: "Parques y Jardines",
    href: "/admin/parques",
  },
  {
    type: "single",
    icon: FerrisWheel,
    label: "Servicios",
    href: "/admin/servicios",
  },
  {
    type: "single",
    icon: Hammer,
    label: "Tipos Mantenimientos",
    href: "/admin/mantenimientos",
  },
  { type: "label", label: "Gestión" },
  {
    type: "single",
    icon: User,
    label: "Usuarios",
    href: "/admin/usuarios",
  },
  {
    type: "single",
    icon: FileText,
    label: "Reportes",
    href: "/admin/reportes",
  },
  { type: "label", label: "Sistema" },
  {
    type: "single",
    icon: Settings,
    label: "Configuración",
    href: "/admin/configuracion",
  },
  {
    type: "single",
    icon: ClipboardList,
    label: "Bitácora",
    href: "/admin/bitacora",
  }
]

export default function AdminLayout({
  children,
  }: {
    children: React.ReactNode
  }){

  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const [totalMatriculas, setTotalMatriculas] = useState<number>(0)
  const [pendingPayments, setPendingPayments] = useState<any[]>([])
  const [showNotifications, setShowNotifications] = useState(false)


  const getInitials = (nombre?: string) => {
    if (!nombre) return "U"
    const parts = nombre.split(" ")
    return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase()
  }

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  return (
    <RouteGuard allowedRoles={["admin", "administrador","supervisor","subgerente"]}>
      <SidebarProvider style={{ "--sidebar-width-icon": "4rem" } as React.CSSProperties}>
      <AdminSidebar pathname={pathname} user={user} onLogout={handleLogout} totalMatriculas={totalMatriculas} />
      <SidebarInset className="bg-sidebar">
        {/* Modern Header */}
        <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-border/40 bg-sidebar backdrop-blur-md px-8">
          <div className="flex items-center gap-4 flex-1">
            <SidebarTrigger className="md:hidden" />

            <div className="hidden md:flex flex-col gap-1">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink
                      href="/admin"
                      className="flex items-center gap-1.5 text-sm font-bold tracking-wider"
                    >
                      <Home className="h-4 w-4" />
                      Home
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  {pathname !== "/admin" && (
                    <>
                      <BreadcrumbSeparator className="text-muted-foreground" />
                      <BreadcrumbItem>
                        <BreadcrumbPage className="text-sm font-bold text-primary">
                          {pathname.split("/").pop()?.replace(/-/g, " ")}
                        </BreadcrumbPage>
                      </BreadcrumbItem>
                    </>
                  )}
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative hidden lg:block group">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Buscar recursos..."
                className="pl-10 h-10 w-64 bg-muted/50 border-0 focus-visible:bg-background focus-visible:ring-1 focus-visible:ring-primary/20 transition-all rounded-full text-sm"
              />
            </div>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              <DropdownMenu open={showNotifications} onOpenChange={setShowNotifications}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-10 w-10 rounded-xl hover:bg-muted relative p-0"
                  >
                    <Bell className="h-5 w-5" />
                    {pendingPayments.length > 0 && (
                      <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 border-2 border-background ring-1 ring-red-200 text-[10px] font-black text-white flex items-center justify-center">
                        {pendingPayments.length}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
              </DropdownMenu>
              <div className="h-8 w-[1px] bg-border mx-2" />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex h-10 items-center gap-3 px-2 rounded-xl hover:bg-muted transition-all group"
                  >
                    <div className="h-8 w-8 rounded-full ring-2 ring-background shadow-sm overflow-hidden border border-border flex-shrink-0 bg-primary text-white flex items-center justify-center font-bold text-sm">
                      {user?.nombre ? getInitials(user.nombre) : "U"}
                    </div>
                    <div className="hidden sm:flex flex-col items-start leading-none">
                      <span className="text-sm font-bold text-foreground">{user?.nombre || "Usuario"}</span>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
                        {user?.rol || "Sin rol"}
                      </span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px] p-2 rounded-xl shadow-xl border-border">
                  <DropdownMenuItem
                    onClick={() => router.push("/admin/perfil")}
                    className="rounded-lg h-10 px-3 cursor-pointer font-medium hover:bg-muted gap-2"
                  >
                    <User className="h-4 w-4" />
                    Ver Perfil
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="my-1 bg-border" />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="rounded-lg h-10 px-3 cursor-pointer font-bold text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-500/10 gap-2"
                  >
                    <LogOut className="h-4 w-4 text-rose-600" />
                    Cerrar Sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-8 overflow-y-auto bg-background">
          <div className="max-w-7xl mx-auto space-y-8">{children}</div>
        </main>
      </SidebarInset>
    </SidebarProvider>
    </RouteGuard>
  )
}

function AdminSidebar({ 
  pathname, 
  user, 
  onLogout, 
  totalMatriculas 
}: { 
  pathname: string; 
  user: any; 
  onLogout: () => void; 
  totalMatriculas: number 
}) {
  const { state, toggleSidebar } = useSidebar()
  const isCollapsed = state === "collapsed"
  const menuGroups = getMenuGroups(totalMatriculas)

  // Obtener iniciales del nombre para el avatar
  const getInitials = (nombre?: string) => {
    if (!nombre) return "U"
    const parts = nombre.split(" ")
    return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase()
  }

  return (
    <Sidebar collapsible="icon" className="border-r border-border bg-sidebar z-40">
      <SidebarHeader className="h-auto flex flex-col gap-4 px-2 py-3 border-b border-border/60 overflow-visible">
        <div
          className={cn(
            "flex items-center gap-3 transition-all",
            isCollapsed ? "justify-center w-full" : "w-full justify-start"
          )}
        >
          <div className="relative flex-shrink-0">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center ring-2 ring-primary/10">
              <Image
                className="object-contain"
                src="/img/sis_logo.png"
                alt="Profesionales capacitándose en Brusben"
                fill
                priority
              />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col justify-center min-w-0 animate-in fade-in slide-in-from-left-2 duration-300">
              <span className="text-xl font-bold tracking-tight text-sidebar-foreground leading-none">
                SisParques
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary mt-1 leading-none">
                Panel Admin
              </span>
            </div>
          )}
        </div>

        {/* Custom Toggle Button */}
        <button
          onClick={toggleSidebar}
          className={cn(
            "absolute -right-3.5 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-primary text-white flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-all z-40 ring-4 ring-white border border-primary/20",
            isCollapsed && "rotate-180"
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4 overflow-y-auto overflow-x-visible [&::-webkit-scrollbar]:w-0.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-400">
        <SidebarMenu className="gap-1">
          {menuGroups.map((item, index) => {
            if (item.type === "label") {
              if (isCollapsed) return <div key={index} className="h-2" />
              return (
                <div key={index} className="flex items-center gap-2 px-4 pt-2 pb-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 whitespace-nowrap">
                    {item.label}
                  </span>
                  <div className="h-[1px] w-full bg-border/60" />
                </div>
              )
            }

            if (item.type === "single") {
              const isActive = pathname === item.href

              return (
                <SidebarMenuItem key={item.label} className="flex justify-center relative">
                  {isActive && (
                    <div className="absolute -left-0.5 top-1/2 -translate-y-1/2 w-2 h-7 bg-white/50 rounded-2xl shadow-sm" />
                  )}
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    className={cn(
                      "h-10 px-6 rounded-xl transition-all duration-200 font-bold",
                      isCollapsed ? "w-12 h-12 p-0 justify-center items-center" : "w-full",
                      isActive
                        ? "bg-primary text-white hover:bg-primary/90 shadow-lg"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                    tooltip={{
                      children: item.label,
                      className:
                        "z-[210] bg-slate-900 text-white font-bold p-2 px-3 rounded-lg shadow-xl",
                      sideOffset: 12,
                    }}
                  >
                    <Link
                      href={item.href}
                      className={cn("flex items-center gap-4", isCollapsed ? "justify-center gap-0" : "")}
                    >
                      <item.icon
                        className={cn(
                          "h-5 w-5 flex-shrink-0 transition-transform",
                          isActive ? "text-white" : "text-muted-foreground"
                        )}
                      />
                      {!isCollapsed && (
                        <div className="flex items-center justify-between w-full">
                          <span className="text-sm transition-opacity duration-300 whitespace-nowrap">
                            {item.label}
                          </span>
                          {item.badge && (
                            <span className={cn(
                              "flex items-center justify-center px-2 py-0.5 text-[10px] font-black rounded-full transition-all",
                              isActive 
                                ? "bg-white text-primary" 
                                : "bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400"
                            )}>
                              {item.badge}
                            </span>
                          )}
                        </div>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            }

            const hasActiveChild = item.children?.some((child) => pathname === child.href)

            return (
              <SidebarGroupItem
                key={item.label}
                item={item as GroupMenuItem}
                pathname={pathname}
                isCollapsed={isCollapsed}
                hasActiveChild={hasActiveChild}
              />
            )
          })}
        </SidebarMenu>
      </SidebarContent>

      {/* Botón de logout en mobile para Sidebar */}
      <SidebarFooter className="p-4 border-t border-slate-100 md:hidden">
        <Button
          variant="ghost"
          size="sm"
          onClick={onLogout}
          className="w-full justify-start px-3 h-10 rounded-xl text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all flex items-center gap-3 font-medium"
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          <span>Cerrar Sesión</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  )
}

function SidebarGroupItem({
  item,
  pathname,
  isCollapsed,
  hasActiveChild,
}: {
  item: GroupMenuItem
  pathname: string
  isCollapsed: boolean
  hasActiveChild?: boolean
}) {
  const [open, setOpen] = useState(hasActiveChild)
  const [showFloatingMenu, setShowFloatingMenu] = useState(false)

  return (
    <div className="relative space-y-1">
      {hasActiveChild && (
        <div className="absolute -left-2 top-6 -translate-y-1/2 w-1.0 h-8 bg-primary rounded-r-md shadow-sm pointer-events-none" />
      )}
      <button
        onClick={() => {
          if (isCollapsed) {
            setShowFloatingMenu(!showFloatingMenu)
          } else {
            setOpen(!open)
          }
        }}
        className={cn(
          "w-full flex items-center rounded-2xl transition-all duration-200 font-bold relative z-10",
          isCollapsed ? "h-12 w-12 justify-center mx-auto" : "h-12 px-4 justify-between",
          hasActiveChild
            ? "bg-primary/10 text-primary"
            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        )}
        title={isCollapsed ? item.label : undefined}
      >
        <div className={cn("flex items-center gap-4", isCollapsed ? "justify-center" : "")}>
          <item.icon
            className={cn(
              "h-4 w-4 flex-shrink-0",
              hasActiveChild ? "text-primary" : "text-muted-foreground"
            )}
          />
          {!isCollapsed && <span className="text-sm whitespace-nowrap">{item.label}</span>}
        </div>

        {!isCollapsed && (
          <ChevronDown
            className={cn("h-4 w-4 transition-transform duration-200", open && "rotate-180")}
          />
        )}
      </button>

      {/* Submenú normal cuando está expandido */}
      {!isCollapsed && open && (
        <div className="ml-4 space-y-1 border-l border-border pl-3">
          {item.children.map((child) => {
            const isChildActive = pathname === child.href

            return (
              <Link
                key={child.label}
                href={child.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all",
                  isChildActive
                    ? "bg-primary text-white"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <child.icon className={cn("h-4 w-4", isChildActive ? "text-white" : "")} />
                <span>{child.label}</span>
              </Link>
            )
          })}
        </div>
      )}

      {/* Submenú flotante cuando está colapsado */}
      {isCollapsed && showFloatingMenu && (
        <div className="fixed left-[calc(4rem+1rem)] top-[6rem] z-[100] min-w-[220px] rounded-2xl border border-border bg-background shadow-2xl p-2 animate-in fade-in zoom-in-95 duration-200">
          <div className="px-3 py-2 text-xs font-black uppercase tracking-wider text-muted-foreground">
            {item.label}
          </div>

          <div className="space-y-1">
            {item.children.map((child) => {
              const isChildActive = pathname === child.href

              return (
                <Link
                  key={child.label}
                  href={child.href}
                  onClick={() => setShowFloatingMenu(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all",
                    isChildActive
                      ? "bg-primary text-white"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <child.icon className={cn("h-4 w-4", isChildActive ? "text-white" : "")} />
                  <span>{child.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}