"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react"
import {
Sparkles, CalendarDays, Wrench, Building2, AlertTriangle,
CheckCircle2, Clock, Activity, FileText, RefreshCw,
ChevronRight, Inbox, ShieldCheck, BarChart3, PieChart,
TrendingUp, ArrowUpRight, ArrowDownRight, Users,
MapPin, CalendarClock, CircleDot
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import Highcharts from "highcharts"
import HighchartsReact from "highcharts-react-official"

const API_BASE = "http://localhost:8081/api"

type Mantenimiento = {
mantId: number
mantTitulo?: string
mantEstado?: string
mantFechaCrea?: string
mantFechaFin?: string
parqNombre?: string
estadoReal?: string
diasVencido?: number
}

type Ampliacion = {
amplId: number
mantId?: number
amplMotivo?: string
}

type Stats = {
parques: number
mantenimientos: number
activos: number
completados: number
vencidos: number
incidencias: number
usuarios: number
pendientes: number
ampliaciones: number
}

type DashboardData = {
stats: Stats
incompletos: Mantenimiento[]
recientes: Mantenimiento[]
ampliaciones: Ampliacion[]
mantenimientos: Mantenimiento[]
}

const toArray = (value: any): any[] => {
if (Array.isArray(value)) return value
if (Array.isArray(value?.data)) return value.data
if (Array.isArray(value?.content)) return value.content
return []
}

const saludo = () => {
const h = new Date().getHours()
return h < 12 ? "Buenos días" : h < 18 ? "Buenas tardes" : "Buenas noches"
}

const fmtDate = (d?: string | null) =>
d
? new Date(d).toLocaleDateString("es-PE", {
day: "2-digit",
month: "short",
})
: "—"

const badgeColor = (e?: string) => {
const m: Record<string, string> = {
COMPLETADO: "bg-emerald-500/10 text-emerald-600 border-emerald-300/40",
EN_PROGRESO: "bg-sky-500/10 text-sky-600 border-sky-300/40",
EN_PROCESO: "bg-sky-500/10 text-sky-600 border-sky-300/40",
PENDIENTE: "bg-amber-500/10 text-amber-600 border-amber-300/40",
VENCIDO: "bg-rose-500/10 text-rose-600 border-rose-300/40",
ATRASADO: "bg-orange-500/10 text-orange-600 border-orange-300/40",
CANCELADO: "bg-zinc-500/10 text-zinc-600 border-zinc-300/40",
}

return (
m[e || ""] ||
"bg-zinc-500/10 text-zinc-600 border-zinc-300/40"
)
}

Highcharts.setOptions({
chart: {
backgroundColor: "transparent",
style: {
fontFamily: "Inter, sans-serif",
},
},
credits: {
enabled: false,
},
})

export default function AdminDashboard() {
const { user } = useAuth()
const router = useRouter()

const [data, setData] = useState<DashboardData | null>(null)
const [loading, setLoading] = useState(true)

const fetchAll = useCallback(async () => {
setLoading(true)


try {
  const responses = await Promise.all([
    fetch(`${API_BASE}/mantenimiento`),
    fetch(`${API_BASE}/parques`),
    fetch(`${API_BASE}/usuarios`),
    fetch(`${API_BASE}/incidencias`),
    fetch(`${API_BASE}/mantenimiento/reportes/incompletos`),
    fetch(`${API_BASE}/monitoreo/ampliaciones/pendientes`),
  ])

  const [mR, pR, uR, iR, incR, amR] = responses

  const [
    mantsRaw,
    parksRaw,
    usersRaw,
    inciRaw,
    incompRaw,
    amplRaw,
  ] = await Promise.all([
    mR.ok ? mR.json() : [],
    pR.ok ? pR.json() : [],
    uR.ok ? uR.json() : [],
    iR.ok ? iR.json() : [],
    incR.ok ? incR.json() : [],
    amR.ok ? amR.json() : [],
  ])

  const mants = toArray(mantsRaw) as Mantenimiento[]
  const parks = toArray(parksRaw)
  const users = toArray(usersRaw)
  const incidencias = toArray(inciRaw)
  const incompletos = toArray(incompRaw) as Mantenimiento[]
  const ampliaciones = toArray(amplRaw) as Ampliacion[]

  const activos = mants.filter((m) =>
    ["EN_PROGRESO", "EN_PROCESO"].includes(m.mantEstado || "")
  ).length

  const completados = mants.filter(
    (m) => m.mantEstado === "COMPLETADO"
  ).length

  const pendientes = mants.filter(
    (m) => m.mantEstado === "PENDIENTE"
  ).length

  const vencidos = incompletos.filter((m) =>
    ["VENCIDO", "ATRASADO"].includes(m.estadoReal || "")
  ).length

  const recientes = [...mants]
    .sort(
      (a, b) =>
        new Date(b.mantFechaCrea || 0).getTime() -
        new Date(a.mantFechaCrea || 0).getTime()
    )
    .slice(0, 6)

  setData({
    stats: {
      parques: parks.length,
      mantenimientos: mants.length,
      activos,
      completados,
      vencidos,
      incidencias: incidencias.length,
      usuarios: users.length,
      pendientes,
      ampliaciones: ampliaciones.length,
    },
    incompletos: incompletos.slice(0, 5),
    recientes,
    ampliaciones: ampliaciones.slice(0, 5),
    mantenimientos: mants,
  })
} catch (error) {
  console.error(error)
  toast.error("Error al cargar el dashboard")
  setData(null)
} finally {
  setLoading(false)
}


}, [])

useEffect(() => {
fetchAll()
}, [fetchAll])

const tendencia = useMemo(() => {
if (!data) return []


const meses = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
]

const actual = new Date().getMonth()

return Array.from({ length: 6 }, (_, index) => {
  const mesIndex = (actual - 5 + index + 12) % 12

  const total = data.mantenimientos.filter((m) => {
    if (!m.mantFechaCrea) return false

    const fecha = new Date(m.mantFechaCrea)

    return fecha.getMonth() === mesIndex
  }).length

  const completados = data.mantenimientos.filter((m) => {
    if (!m.mantFechaCrea) return false

    const fecha = new Date(m.mantFechaCrea)

    return (
      fecha.getMonth() === mesIndex &&
      m.mantEstado === "COMPLETADO"
    )
  }).length

  return {
    mes: meses[mesIndex],
    total,
    completados,
  }
})


}, [data])

                                                                   
                                                             

const lineOptions = useMemo<Highcharts.Options>(() => {
    return {
      chart: {
        type: "spline",
        height: 280,
        spacing: [10, 10, 5, 10],
      },

      title: {
        text: undefined,
      },

      xAxis: {
        categories: tendencia.map((x) => x.mes),
        lineWidth: 0,
        tickWidth: 0,
        labels: {
          style: {
            fontSize: "10px",
          },
        },
      },

      yAxis: {
        title: {
          text: undefined,
        },
        gridLineColor: "rgba(100,116,139,.12)",
        allowDecimals: false,
      },

      legend: {
        enabled: true,
        itemStyle: {
          fontSize: "10px",
          fontWeight: "600",
        },
      },

      tooltip: {
        shared: true,
        borderWidth: 0,
        borderRadius: 10,
        backgroundColor: "rgba(15,23,42,.95)",
        style: {
          color: "#fff",
        },
      },

      plotOptions: {
        spline: {
          lineWidth: 3,
          marker: {
            radius: 4,
            lineWidth: 2,
          },
        },
      },

      series: [
        {
          type: "spline",
          name: "Mantenimientos",
          data: tendencia.map((x) => x.total),
          color: "#0ea5e9",
        },
        {
          type: "spline",
          name: "Completados",
          data: tendencia.map((x) => x.completados),
          color: "#10b981",
        },
      ],
    }
  }, [tendencia]) // ← ESTE CIERRE ES IMPORTANTE


  const donutOptions = useMemo<Highcharts.Options>(() => {
    if (!data) return {}

    return {
      chart: {
        type: "pie",
        height: 280,
      },

      title: {
        text: `${data.stats.mantenimientos}`,
        align: "center",
        verticalAlign: "middle",
        y: 12,
        style: {
          fontSize: "26px",
          fontWeight: "900",
        },
      },

      subtitle: {
        text: "Mantenimientos",
        align: "center",
        verticalAlign: "middle",
        y: 38,
        style: {
          fontSize: "10px",
        },
      },

      tooltip: {
        pointFormat: "<b>{point.y}</b> ({point.percentage:.1f}%)",
      },

      plotOptions: {
        pie: {
          innerSize: "72%",
          borderWidth: 3,
          borderColor: "transparent",
          dataLabels: {
            enabled: false,
          },
          showInLegend: true,
        },
      },

      legend: {
        align: "right",
        verticalAlign: "middle",
        layout: "vertical",
        itemStyle: {
          fontSize: "10px",
        },
      },

      series: [
        {
          type: "pie",
          name: "Estado",
          data: [
            {
              name: "Completados",
              y: data.stats.completados,
              color: "#10b981",
            },
            {
              name: "En progreso",
              y: data.stats.activos,
              color: "#0ea5e9",
            },
            {
              name: "Pendientes",
              y: data.stats.pendientes,
              color: "#f59e0b",
            },
            {
              name: "Vencidos",
              y: data.stats.vencidos,
              color: "#f43f5e",
            },
          ],
        },
      ],
    }
  }, [data])
  
if (loading) {
return ( <div className="space-y-6 animate-pulse"> <div className="h-28 rounded-3xl bg-muted/20" />
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="h-32 rounded-2xl bg-muted/20"
        />
      ))}
    </div>

    <div className="grid lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2 h-80 rounded-3xl bg-muted/20" />
      <div className="h-80 rounded-3xl bg-muted/20" />
    </div>
  </div>
)


}

if (!data) {
return ( <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4"> <AlertTriangle className="h-12 w-12 text-rose-500" />

    <p className="font-bold">
      No se pudo cargar el dashboard
    </p>

    <Button onClick={fetchAll} variant="outline">
      <RefreshCw className="mr-2 h-4 w-4" />
      Reintentar
    </Button>
  </div>
)

}

const { stats, incompletos, recientes, ampliaciones } = data

const cumplimiento =
stats.mantenimientos > 0
? Math.round(
(stats.completados / stats.mantenimientos) * 100
)
: 0

const cards = [
{
label: "Mantenimientos",
value: stats.mantenimientos,
icon: Wrench,
gradient: "from-sky-500 to-blue-600",
iconBg: "bg-sky-500",
},
{
label: "Completados",
value: stats.completados,
icon: CheckCircle2,
gradient: "from-green-500 to-emerald-600",
iconBg: "bg-green-500",
},
{
label: "Vencidos",
value: stats.vencidos,
icon: AlertTriangle,
gradient: "from-rose-500 to-red-600",
iconBg: "bg-rose-500",
},
{
label: "Pendientes",
value: stats.pendientes,
icon: Clock,
gradient: "from-amber-500 to-orange-600",
iconBg: "bg-amber-500",
},

]

return ( 

<div className="space-y-6 animate-in fade-in duration-300">
  <div className="relative overflow-hidden rounded-xl text-dark">
    <div className="relative flex flex-col justify-between gap-5 md:flex-row md:items-center">
      <div>
        <div className="mb-2 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-emerald-400" />

          <h1 className="text-2xl font-black md:text-3xl">
            {saludo()}, {user?.nombre ?? "Administrador"} 👋
          </h1>
        </div>

        <p className="mt-2 text-sm text-slate-400">
          Monitorea el estado operativo de todos los parques y mantenimientos.
        </p>
      </div>

      <div className="flex items-center gap-3 rounded-2xl border bg-white/5 px-4 py-3 backdrop-blur-xl">

        <CalendarDays className="h-5 w-5 text-emerald-400" />

        <div>
          <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
            Hoy
          </p>

          <p className="text-sm font-bold">
            {new Date().toLocaleDateString("es-PE", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
        </div>

      </div>

    </div>
  </div>

  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">

    {cards.map((card) => {

      const Icon = card.icon

      return (
        <Card
          key={card.label}
          className="group relative overflow-hidden rounded-2xl border-0 shadow-md transition-all hover:shadow-xl"
        >

          <div
            className={cn(
              "absolute inset-0 bg-gradient-to-br opacity-[.08]"
            )}
          />

          <CardContent className="relative p-4">

            <div className="flex items-start justify-between">

              <div>

                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  {card.label}
                </p>

                <p className="mt-2 text-3xl font-black tabular-nums">
                  {card.value}
                </p>

              </div>

              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-lg",
                  card.iconBg
                )}
              >
                <Icon className="h-5 w-5" />
              </div>

            </div>
          </CardContent>

        </Card>
      )
    })}

  </div>


  <div className="grid gap-5 lg:grid-cols-3">

    <Card className="overflow-hidden rounded-3xl border-0 shadow-md lg:col-span-2">

      <CardHeader className="flex flex-row items-center justify-between">

        <div>

          <CardTitle className="flex items-center gap-2 text-sm font-black">
            <TrendingUp className="h-4 w-4 text-sky-500" />
            Evolución de mantenimientos
          </CardTitle>

          <p className="mt-1 text-xs text-muted-foreground">
            Actividad registrada durante los últimos meses
          </p>

        </div>

        <Badge className="rounded-full bg-sky-500/10 text-sky-600">
          Tendencia
        </Badge>

      </CardHeader>

      <CardContent className="p-2">

        <HighchartsReact
          highcharts={Highcharts}
          options={lineOptions}
        />

      </CardContent>

    </Card>


    <Card className="overflow-hidden rounded-3xl border-0 shadow-md">

      <CardHeader>

        <CardTitle className="flex items-center gap-2 text-sm font-black">
          <PieChart className="h-4 w-4 text-emerald-500" />
          Estado operativo
        </CardTitle>

        <p className="mt-1 text-xs text-muted-foreground">
          Distribución actual de mantenimientos
        </p>

      </CardHeader>

      <CardContent className="p-2">

        <HighchartsReact
          highcharts={Highcharts}
          options={donutOptions}
        />

      </CardContent>

    </Card>

  </div>


  <div className="grid gap-5 lg:grid-cols-3">

    <Card className="overflow-hidden rounded-3xl border-0 bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-xl lg:col-span-2">

      <CardContent className="p-6">

        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">

          <div>

            <p className="text-xs font-bold uppercase tracking-widest text-emerald-100">
              Indicador de gestión
            </p>

            <h2 className="mt-2 text-3xl font-black">
              {cumplimiento}%
            </h2>

            <p className="mt-1 text-sm text-emerald-100">
              Cumplimiento de mantenimientos
            </p>

          </div>

          <div className="relative h-32 w-32">

            <svg
              className="h-full w-full -rotate-90"
              viewBox="0 0 120 120"
            >

              <circle
                cx="60"
                cy="60"
                r="48"
                fill="none"
                stroke="rgba(255,255,255,.2)"
                strokeWidth="12"
              />

              <circle
                cx="60"
                cy="60"
                r="48"
                fill="none"
                stroke="white"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={`${cumplimiento * 3.01} 301`}
              />

            </svg>

            <div className="absolute inset-0 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8" />
            </div>

          </div>

        </div>

        <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/20">

          <div
            className="h-full rounded-full bg-white transition-all"
            style={{ width: `${cumplimiento}%` }}
          />

        </div>

        <div className="mt-3 flex justify-between text-xs text-emerald-100">

          <span>
            {stats.completados} completados
          </span>

          <span>
            {stats.mantenimientos} total
          </span>

        </div>

      </CardContent>

    </Card>


    <Card className="rounded-3xl border-0 shadow-md">

      <CardHeader>

        <CardTitle className="flex items-center gap-2 text-sm font-black">
          <AlertTriangle className="h-4 w-4 text-rose-500" />
          Atención requerida
        </CardTitle>

      </CardHeader>

      <CardContent className="space-y-3">

        <div className="flex items-center justify-between rounded-2xl bg-rose-500/10 p-3">

          <div className="flex items-center gap-3">

            <div className="rounded-xl bg-rose-500/10 p-2">
              <AlertTriangle className="h-4 w-4 text-rose-500" />
            </div>

            <span className="text-xs font-bold">
              Mantenimientos vencidos
            </span>

          </div>

          <span className="text-lg font-black text-rose-500">
            {stats.vencidos}
          </span>

        </div>

        <div className="flex items-center justify-between rounded-2xl bg-amber-500/10 p-3">

          <div className="flex items-center gap-3">

            <div className="rounded-xl bg-amber-500/10 p-2">
              <Clock className="h-4 w-4 text-amber-500" />
            </div>

            <span className="text-xs font-bold">
              Pendientes
            </span>

          </div>

          <span className="text-lg font-black text-amber-500">
            {stats.pendientes}
          </span>

        </div>

        <div className="flex items-center justify-between rounded-2xl bg-violet-500/10 p-3">

          <div className="flex items-center gap-3">

            <div className="rounded-xl bg-violet-500/10 p-2">
              <ShieldCheck className="h-4 w-4 text-violet-500" />
            </div>

            <span className="text-xs font-bold">
              Ampliaciones
            </span>

          </div>

          <span className="text-lg font-black text-violet-500">
            {stats.ampliaciones}
          </span>

        </div>

      </CardContent>

    </Card>

  </div>



  <div className="grid gap-5 lg:grid-cols-2">


    <Card className="overflow-hidden rounded-3xl border-0 shadow-md">

      <CardHeader className="flex flex-row items-center justify-between">

        <CardTitle className="flex items-center gap-2 text-sm font-black">
          <Activity className="h-4 w-4 text-sky-500" />
          Actividad reciente
        </CardTitle>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/admin/mantenimientos")}
        >
          Ver todos
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>

      </CardHeader>

      <CardContent className="space-y-3">

        {recientes.length === 0 ? (

          <div className="py-8 text-center">
            <Inbox className="mx-auto h-8 w-8 text-muted-foreground/40" />
            <p className="mt-2 text-xs text-muted-foreground">
              No hay actividad reciente
            </p>
          </div>

        ) : (

          recientes.map((m) => (

            <div
              key={m.mantId}
              onClick={() => router.push("/admin/mantenimientos")}
              className="group flex cursor-pointer items-center gap-3 rounded-2xl border border-border/40 p-3 transition-all hover:bg-muted/30 hover:shadow-sm"
            >

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10">
                <Wrench className="h-5 w-5 text-sky-500" />
              </div>

              <div className="min-w-0 flex-1">

                <p className="truncate text-xs font-black">
                  {m.mantTitulo || "Sin título"}
                </p>

                <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">

                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {m.parqNombre || "Sin parque"}
                  </span>

                  <span>•</span>

                  <span>
                    {fmtDate(m.mantFechaCrea)}
                  </span>

                </div>

              </div>

              <Badge
                className={cn(
                  "rounded-full border text-[9px] font-black",
                  badgeColor(m.mantEstado)
                )}
              >
                {m.mantEstado || "SIN ESTADO"}
              </Badge>

            </div>

          ))

        )}

      </CardContent>

    </Card>


    <Card className="overflow-hidden rounded-3xl border-0 shadow-md">

      <CardHeader className="flex flex-row items-center justify-between">

        <CardTitle className="flex items-center gap-2 text-sm font-black">
          <CalendarClock className="h-4 w-4 text-amber-500" />
          Alertas y pendientes
        </CardTitle>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/admin/aprobaciones")}
        >
          Gestionar
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>

      </CardHeader>

      <CardContent className="space-y-3">

        {incompletos.length === 0 && ampliaciones.length === 0 ? (

          <div className="py-8 text-center">

            <CheckCircle2 className="mx-auto h-9 w-9 text-emerald-500/50" />

            <p className="mt-2 text-xs font-bold text-muted-foreground">
              Todo está bajo control 🎉
            </p>

          </div>

        ) : (

          <>

            {incompletos.slice(0, 3).map((m) => (

              <div
                key={m.mantId}
                className="flex items-center gap-3 rounded-2xl bg-rose-500/5 p-3"
              >

                <div className="rounded-xl bg-rose-500/10 p-2">
                  <AlertTriangle className="h-4 w-4 text-rose-500" />
                </div>

                <div className="min-w-0 flex-1">

                  <p className="truncate text-xs font-bold">
                    {m.mantTitulo || "Mantenimiento pendiente"}
                  </p>

                  <p className="text-[10px] text-muted-foreground">
                    {m.parqNombre || "Sin parque"}
                  </p>

                </div>

                <Badge
                  className={cn(
                    "rounded-full border text-[8px]",
                    badgeColor(m.estadoReal || m.mantEstado)
                  )}
                >
                  {m.estadoReal || "REVISAR"}
                </Badge>

              </div>

            ))}

            {ampliaciones.slice(0, 2).map((a) => (

              <div
                key={a.amplId}
                className="flex items-center gap-3 rounded-2xl bg-amber-500/5 p-3"
              >

                <div className="rounded-xl bg-amber-500/10 p-2">
                  <Clock className="h-4 w-4 text-amber-500" />
                </div>

                <div className="min-w-0 flex-1">

                  <p className="text-xs font-bold">
                    Ampliación #{a.amplId}
                  </p>

                  <p className="truncate text-[10px] text-muted-foreground">
                    {a.amplMotivo || "Sin motivo registrado"}
                  </p>

                </div>

                <Badge className="rounded-full bg-amber-500/10 text-[8px] text-amber-600">
                  PENDIENTE
                </Badge>

              </div>

            ))}

          </>

        )}

      </CardContent>

    </Card>

  </div>

</div>


)
}
