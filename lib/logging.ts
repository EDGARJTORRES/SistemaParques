// Logging utility for system actions
export interface LogEntry {
  id_usuario: number
  accion: string
  modulo: string
  detalle: string
  fecha_hora: string
}

export const logAction = async (accion: string, modulo: string, detalle: string, idUsuario?: number) => {
  try {
    // Get current user from sessionStorage if no idUsuario provided
    let userId = idUsuario
    if (!userId) {
      const userStr = sessionStorage.getItem('user')
      const user = userStr ? JSON.parse(userStr) : null
      userId = user?.id || 0
    }
    
    if (!userId) {
      console.error('No user found for logging')
      return false
    }
    
    const logData: LogEntry = {
      id_usuario: userId,
      accion,
      modulo,
      detalle,
      fecha_hora: new Date().toISOString()
    }

    const response = await fetch('http://localhost:8081/api/auditoria/crear', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        idUsuario: userId.toString(),
        accion,
        modulo,
        detalle
      })
    })
    
    if (!response.ok) {
      console.error('Error al registrar en auditoría:', response.statusText)
    }
    
    return response.ok
  } catch (error) {
    console.error('Error al registrar en auditoría:', error)
    return false
  }
}

// Predefined action types
export const LOG_ACTIONS = {
  // Usuarios
  USUARIO_CREADO: (nombre: string, dni: string) => ({
    accion: 'Creación',
    modulo: 'Usuarios',
    detalle: `Nuevo usuario: ${nombre} (DNI: ${dni})`
  }),
  USUARIO_ACTUALIZADO: (nombre: string) => ({
    accion: 'Actualización',
    modulo: 'Usuarios',
    detalle: `Usuario actualizado: ${nombre}`
  }),
  USUARIO_ELIMINADO: (nombre: string) => ({
    accion: 'Eliminación',
    modulo: 'Usuarios',
    detalle: `Usuario eliminado: ${nombre}`
  }),
  
  // Pagos
  PAGO_REGISTRADO: (monto: string, estudiante: string) => ({
    accion: 'Registro',
    modulo: 'Pagos',
    detalle: `Pago registrado: S/ ${monto} - Estudiante: ${estudiante}`
  }),
  PAGO_ACTUALIZADO: (id: string) => ({
    accion: 'Actualización',
    modulo: 'Pagos',
    detalle: `Pago actualizado - ID: ${id}`
  }),
  PAGO_ELIMINADO: (id: string) => ({
    accion: 'Eliminación',
    modulo: 'Pagos',
    detalle: `Pago eliminado - ID: ${id}`
  }),
  
  // Egresos
  EGRESO_REGISTRADO: (monto: string, docenteCurso: string) => ({
    accion: 'Registro',
    modulo: 'Egresos',
    detalle: `Egreso registrado: S/ ${monto} - Docente: ${docenteCurso}`
  }),
  EGRESO_ACTUALIZADO: (id: string) => ({
    accion: 'Actualización',
    modulo: 'Egresos',
    detalle: `Egreso actualizado - ID: ${id}`
  }),
  EGRESO_ELIMINADO: (monto: string, docenteCurso: string) => ({
    accion: 'Eliminación',
    modulo: 'Egresos',
    detalle: `Egreso eliminado: S/ ${monto} - Docente: ${docenteCurso}`
  }),
  
  // Cursos
  CURSO_CREADO: (titulo: string) => ({
    accion: 'Creación',
    modulo: 'Cursos',
    detalle: `Curso creado: ${titulo}`
  }),
  CURSO_ACTUALIZADO: (titulo: string) => ({
    accion: 'Actualización',
    modulo: 'Cursos',
    detalle: `Curso actualizado: ${titulo}`
  }),
  CURSO_ELIMINADO: (titulo: string) => ({
    accion: 'Eliminación',
    modulo: 'Cursos',
    detalle: `Curso eliminado: ${titulo}`
  }),
  
  // Categorías
  CATEGORIA_CREADA: (nombre: string) => ({
    accion: 'Creación',
    modulo: 'Categorías',
    detalle: `Categoría creada: ${nombre}`
  }),
  CATEGORIA_ACTUALIZADA: (nombre: string) => ({
    accion: 'Actualización',
    modulo: 'Categorías',
    detalle: `Categoría actualizada: ${nombre}`
  }),
  CATEGORIA_ELIMINADA: (nombre: string) => ({
    accion: 'Eliminación',
    modulo: 'Categorías',
    detalle: `Categoría eliminada: ${nombre}`
  }),
  
  // Matrículas
  MATRICULA_REGISTRADA: (estudiante: string, curso: string) => ({
    accion: 'Registro',
    modulo: 'Matrículas',
    detalle: `Matrícula registrada: ${estudiante} - ${curso}`
  }),
  MATRICULA_ACTUALIZADA: (id: string) => ({
    accion: 'Actualización',
    modulo: 'Matrículas',
    detalle: `Matrícula actualizada - ID: ${id}`
  }),
  MATRICULA_ELIMINADA: (id: string) => ({
    accion: 'Eliminación',
    modulo: 'Matrículas',
    detalle: `Matrícula eliminada - ID: ${id}`
  }),
  
  // Sistema
  SISTEMA_LOGIN: (usuario: string, idUsuario: number) => ({
    accion: 'Acceso',
    modulo: 'Sistema',
    detalle: `Inicio de sesión: ${usuario}`
  }),
  SISTEMA_LOGOUT: (usuario: string, idUsuario: number) => ({
    accion: 'Cierre',
    modulo: 'Sistema',
    detalle: `Cierre de sesión: ${usuario}`
  }),
  SISTEMA_ERROR: (error: string) => ({
    accion: 'Error',
    modulo: 'Sistema',
    detalle: `Error del sistema: ${error}`
  })
}

// Helper function to log actions using predefined types
export const logSystemAction = async (actionType: keyof typeof LOG_ACTIONS, params: any[] = [], idUsuario?: number) => {
  const action = LOG_ACTIONS[actionType]
  if (typeof action === 'function') {
    const result = (action as any)(...params)
    const { accion, modulo, detalle } = result
    return await logAction(accion, modulo, detalle, idUsuario)
  }
  return false
}
