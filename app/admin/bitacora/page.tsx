"use client"



import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Search, History, Clock, Activity, FileText, ChevronLeft, ChevronRight } from "lucide-react"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import { Badge } from "@/components/ui/badge"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { cn } from "@/lib/utils"

import { format } from "date-fns"

import { es } from "date-fns/locale"

import { useAuth } from "@/lib/auth-context"

import { toast } from "sonner"

import { logAction } from "@/lib/logging"



interface LogEntry {

  idLog: number

  idUsuario: number

  nombreUsuario: string

  accion: string

  modulo: string

  detalle: string

  fechaHora: string

}



export default function BitacoraPage() {

  const { user } = useAuth()

  const [logs, setLogs] = useState<LogEntry[]>([])

  const [users, setUsers] = useState<any[]>([])

  const [isLoading, setIsLoading] = useState(true)

  const [searchTerm, setSearchTerm] = useState("")

  const [moduloFilter, setModuloFilter] = useState("TODOS")

  const [currentPage, setCurrentPage] = useState(1)

  const itemsPerPage = 10



  useEffect(() => {

    fetchLogs()

  }, [])



  const fetchLogs = async () => {

    setIsLoading(true)

    try {

      const [logsResponse, usersResponse] = await Promise.all([

        fetch("http://localhost:8081/api/auditoria"),

        fetch("http://localhost:8081/api/usuarios")

      ])

      

      // Fetch logs

      if (logsResponse.ok) {

        const logsData = await logsResponse.json()

        const auditoriasArray = logsData.auditorias || logsData || []

        setLogs(auditoriasArray.sort((a: LogEntry, b: LogEntry) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime()))

      } else {

        setLogs([])

      }

      

      // Fetch users

      if (usersResponse.ok) {

        const usersData = await usersResponse.json()

        console.log('Users data response:', usersData)

        console.log('Users data length:', usersData.length)

        if (usersData.length > 0) {

          console.log('First user structure:', usersData[0])

          console.log('First user keys:', Object.keys(usersData[0]))

        }

        setUsers(usersData)

      } else {

        console.error('Users API failed:', usersResponse.status)

      }

    } catch (error) {

      console.error("Error fetching data:", error)

      setLogs([])

    } finally {

      setIsLoading(false)

    }

  }



  // Function to get user name by ID

  const getUserName = (userId: number) => {

    console.log(`Looking for user ID: ${userId}`)

    const user = users.find(u => u.id_usuario === userId)

    console.log(`Found user:`, user)

    if (!user) return `Usuario ${userId}`

    

    const nombres = user.nombres || ''

    const apellidos = user.apellidos || ''

    const fullName = `${nombres} ${apellidos}`.trim()

    

    return fullName || `Usuario ${userId}`

  }



  // Refresh logs every 30 seconds for real-time updates

  useEffect(() => {

    const interval = setInterval(fetchLogs, 30000)

    return () => clearInterval(interval)

  }, [])



  const filteredLogs = logs.filter((log) => {

    const matchesSearch = 

      (log.idUsuario?.toString() || '').includes(searchTerm.toLowerCase()) || 

      (log.accion || '').toLowerCase().includes(searchTerm.toLowerCase()) ||

      (log.detalle || '').toLowerCase().includes(searchTerm.toLowerCase())

    

    const matchesModulo = moduloFilter === "TODOS" || (log.modulo || '') === moduloFilter



    return matchesSearch && matchesModulo

  })



  // Pagination logic

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage)

  const startIndex = (currentPage - 1) * itemsPerPage

  const endIndex = startIndex + itemsPerPage

  const paginatedLogs = filteredLogs.slice(startIndex, endIndex)



  // Reset to page 1 when filters change

  useEffect(() => {

    setCurrentPage(1)

  }, [searchTerm, moduloFilter])



  return (

    <div className="space-y-8 animate-in fade-in duration-500">

      {/* HEADER */}

      <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">

        <div>

          <h4 className="text-2xl font-black flex items-center gap-3 tracking-tight">

            <History className="h-6 w-6 text-primary" />

            Bitácora del Sistema

          </h4>

          <p className="text-muted-foreground text-sm font-medium mt-1">

            Registro de actividades, auditoría y eventos importantes.

          </p>

        </div>

      </div>



      {/* TABLE SECTION */}

      <div className="rounded-2xl bg-card shadow-md dark:border border-0">

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/50 px-6 py-4">

          <h2 className="text-lg font-black text-foreground flex items-center gap-2">

            Historial de Actividad

          </h2>

          <div className="flex items-center gap-2">

            <div className="relative group">

              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />

              <input 

                placeholder="Buscar por usuario o acción..." 

                value={searchTerm}

                onChange={(e) => setSearchTerm(e.target.value)}

                className="pl-10 pr-4 py-2 h-10 bg-muted/40 border-0 rounded-xl text-sm font-bold focus:ring-1 focus:ring-primary/20 transition-all outline-none w-64 md:w-80"

              />

            </div>

            <Select value={moduloFilter} onValueChange={setModuloFilter}>

              <SelectTrigger className="w-[150px] bg-muted/40 border-0 rounded-xl text-sm font-bold h-10">

                <SelectValue placeholder="Módulo" />

              </SelectTrigger>

              <SelectContent className="rounded-xl border-border/50 shadow-xl">

                <SelectItem value="TODOS" className="font-bold cursor-pointer">Todos los Módulos</SelectItem>

                <SelectItem value="Usuarios" className="font-bold cursor-pointer">Usuarios</SelectItem>

                <SelectItem value="Pagos" className="font-bold cursor-pointer">Ingresos / Egresos</SelectItem>

                <SelectItem value="Matrículas" className="font-bold cursor-pointer">Matrículas</SelectItem>

                <SelectItem value="Cursos" className="font-bold cursor-pointer">Cursos</SelectItem>

                <SelectItem value="Sistema" className="font-bold cursor-pointer">Sistema</SelectItem>

              </SelectContent>

            </Select>

          </div>

        </div>

        

        <div className="p-0">

          <Table>

            <TableHeader className="bg-muted/50">

              <TableRow className="border-b border-border/40 hover:bg-transparent">

                <TableHead className="px-3 py-2 font-black text-[9px] uppercase tracking-widest text-muted-foreground w-[140px]">Fecha y Hora</TableHead>

                <TableHead className="px-2 py-2 font-black text-[9px] uppercase tracking-widest text-muted-foreground w-[80px]">Usuario</TableHead>

                <TableHead className="px-2 py-2 font-black text-[9px] uppercase tracking-widest text-muted-foreground w-[90px]">Módulo</TableHead>

                <TableHead className="px-2 py-2 font-black text-[9px] uppercase tracking-widest text-muted-foreground w-[80px]">Acción</TableHead>

                <TableHead className="px-3 py-2 font-black text-[9px] uppercase tracking-widest text-muted-foreground">Detalle</TableHead>

              </TableRow>

            </TableHeader>

            <TableBody>

              {isLoading ? (

                Array.from({ length: 5 }).map((_, i) => (

                  <TableRow key={i}>

                    <TableCell colSpan={5} className="h-16 animate-pulse bg-muted/20" />

                  </TableRow>

                ))

              ) : paginatedLogs.length === 0 ? (

                <TableRow>

                  <TableCell colSpan={5} className="h-40 text-center text-muted-foreground font-bold italic">

                    {logs.length === 0 

                      ? "No hay registros en la bitácora." 

                      : "Ningún registro coincide con los filtros."}

                  </TableCell>

                </TableRow>

              ) : paginatedLogs.map((log, index) => (

                <TableRow key={log.idLog || `log-${index}-${log.idUsuario}-${log.fechaHora}`} className="border-b border-border/30 hover:bg-muted/30 transition-colors group">

                  <TableCell className="px-6 py-4 whitespace-nowrap">

                    <div className="flex items-center gap-2">

                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />

                      <div className="flex flex-col">

                        <span className="font-bold text-sm text-foreground">

                          {log.fechaHora ? format(new Date(log.fechaHora), "dd MMM yyyy", { locale: es }) : "N/A"}

                        </span>

                        <span className="text-[11px] font-medium text-muted-foreground">

                          {log.fechaHora ? format(new Date(log.fechaHora), "HH:mm:ss a") : "N/A"}

                        </span>

                      </div>

                    </div>

                  </TableCell>

                  <TableCell className="py-4 font-bold text-sm text-foreground">

                    {log.nombreUsuario || `Usuario ${log.idUsuario}`}

                  </TableCell>

                  <TableCell className="py-4">

                    <Badge className="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider border-0 bg-primary/10 text-primary hover:bg-primary/20">

                      {log.modulo}

                    </Badge>

                  </TableCell>

                  <TableCell className="py-4 font-black text-sm text-muted-foreground">

                    <div className="flex items-center gap-2">

                      <Activity className="h-3.5 w-3.5 opacity-70 " />

                      {log.accion}

                    </div>

                  </TableCell>

                  <TableCell className="px-3 py-2 text-sm font-medium text-muted-foreground">

                    <div className="flex items-start gap-2">

                      <FileText className="h-4 w-4 opacity-50 flex-shrink-0 mt-0.5" />

                      <div className="flex flex-col">

                        <span className="text-xs leading-tight whitespace-normal break-words">{log.detalle}</span>

                      </div>

                    </div>

                  </TableCell>

                </TableRow>

              ))}

            </TableBody>

          </Table>

         {/* Pagination Controls */}

        {!isLoading && filteredLogs.length > 0 && totalPages > 1 && (

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-8 py-6 border-t border-border/30">

            <div className="text-sm text-muted-foreground font-medium">

              Mostrando{" "}

              <span className="font-bold text-foreground">{startIndex + 1}</span>

              {" "}–{" "}

              <span className="font-bold text-foreground">{Math.min(endIndex, filteredLogs.length)}</span>

              {" "}de{" "}

              <span className="font-bold text-foreground">{filteredLogs.length}</span>

              {" "}registros

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

        )}

      </div>

      </div>

    </div>

  )

}

