package com.sisParques.controller;

import com.sisParques.entity.Auditoria;
import com.sisParques.service.AuditoriaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auditoria")
@CrossOrigin(origins = "*")
public class AuditoriaController {

    @Autowired
    private AuditoriaService auditoriaService;

    /**
     * Crea un nuevo registro de auditoría
     * POST /api/auditoria
     */
    @PostMapping
    public ResponseEntity<Map<String, Object>> crearAuditoria(@RequestBody Auditoria auditoria) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            Auditoria nuevoRegistro = auditoriaService.guardarAuditoria(auditoria);
            
            response.put("mensaje", "Registro de auditoría creado exitosamente");
            response.put("auditoria", nuevoRegistro);
            response.put("exito", true);
            
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
            
        } catch (IllegalArgumentException e) {
            response.put("mensaje", "Error de validación: " + e.getMessage());
            response.put("exito", false);
            return ResponseEntity.badRequest().body(response);
            
        } catch (Exception e) {
            response.put("mensaje", "Error al crear registro de auditoría: " + e.getMessage());
            response.put("exito", false);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Crea un nuevo registro de auditoría con parámetros individuales
     * POST /api/auditoria/crear
     */
    @PostMapping("/crear")
    public ResponseEntity<Map<String, Object>> crearAuditoriaConParametros(
            @RequestParam Integer idUsuario,
            @RequestParam String accion,
            @RequestParam String modulo,
            @RequestParam String detalle) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            Auditoria nuevoRegistro = auditoriaService.crearAuditoria(idUsuario, accion, modulo, detalle);
            
            response.put("mensaje", "Registro de auditoría creado exitosamente");
            response.put("auditoria", nuevoRegistro);
            response.put("exito", true);
            
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
            
        } catch (Exception e) {
            response.put("mensaje", "Error al crear registro de auditoría: " + e.getMessage());
            response.put("exito", false);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Obtiene todos los registros de auditoría ordenados por id_log ASC
     * GET /api/auditoria
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> obtenerTodos() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            List<Map<String, Object>> auditorias = auditoriaService.obtenerTodosConNombres();
            
            // Debug logging para verificar los datos
            System.out.println("=== AUDITORÍAS ENVIADAS AL FRONTEND ===");
            auditorias.forEach(aud -> {
                System.out.println("ID: " + aud.get("idLog"));
                System.out.println("Usuario ID: " + aud.get("idUsuario"));
                System.out.println("Nombre Usuario: " + aud.get("nombreUsuario"));
                System.out.println("Fecha: " + aud.get("fechaHora"));
                System.out.println("Módulo: " + aud.get("modulo"));
                System.out.println("Acción: " + aud.get("accion"));
                System.out.println("---");
            });
            
            response.put("auditorias", auditorias);
            response.put("total", auditorias.size());
            response.put("exito", true);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("mensaje", "Error al obtener registros de auditoría: " + e.getMessage());
            response.put("exito", false);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Obtiene un registro de auditoría por su ID
     * GET /api/auditoria/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> obtenerPorId(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            Optional<Auditoria> auditoria = auditoriaService.obtenerPorId(id);
            
            if (auditoria.isPresent()) {
                response.put("auditoria", auditoria.get());
                response.put("exito", true);
                return ResponseEntity.ok(response);
            } else {
                response.put("mensaje", "Registro de auditoría no encontrado");
                response.put("exito", false);
                return ResponseEntity.notFound().build();
            }
            
        } catch (Exception e) {
            response.put("mensaje", "Error al obtener registro de auditoría: " + e.getMessage());
            response.put("exito", false);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Obtiene registros de auditoría por ID de usuario
     * GET /api/auditoria/usuario/{idUsuario}
     */
    @GetMapping("/usuario/{idUsuario}")
    public ResponseEntity<Map<String, Object>> obtenerPorIdUsuario(@PathVariable Integer idUsuario) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            List<Auditoria> auditorias = auditoriaService.obtenerPorIdUsuario(idUsuario);
            
            response.put("auditorias", auditorias);
            response.put("total", auditorias.size());
            response.put("exito", true);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("mensaje", "Error al obtener registros de auditoría: " + e.getMessage());
            response.put("exito", false);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Obtiene registros de auditoría por módulo
     * GET /api/auditoria/modulo/{modulo}
     */
    @GetMapping("/modulo/{modulo}")
    public ResponseEntity<Map<String, Object>> obtenerPorModulo(@PathVariable String modulo) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            List<Auditoria> auditorias = auditoriaService.obtenerPorModulo(modulo);
            
            response.put("auditorias", auditorias);
            response.put("total", auditorias.size());
            response.put("exito", true);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("mensaje", "Error al obtener registros de auditoría: " + e.getMessage());
            response.put("exito", false);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Obtiene registros de auditoría por acción
     * GET /api/auditoria/accion/{accion}
     */
    @GetMapping("/accion/{accion}")
    public ResponseEntity<Map<String, Object>> obtenerPorAccion(@PathVariable String accion) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            List<Auditoria> auditorias = auditoriaService.obtenerPorAccion(accion);
            
            response.put("auditorias", auditorias);
            response.put("total", auditorias.size());
            response.put("exito", true);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("mensaje", "Error al obtener registros de auditoría: " + e.getMessage());
            response.put("exito", false);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Obtiene registros de auditoría en un rango de fechas
     * GET /api/auditoria/fechas?fechaInicio=...&fechaFin=...
     */
    @GetMapping("/fechas")
    public ResponseEntity<Map<String, Object>> obtenerPorRangoFechas(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fechaInicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fechaFin) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            List<Auditoria> auditorias = auditoriaService.obtenerPorRangoFechas(fechaInicio, fechaFin);
            
            response.put("auditorias", auditorias);
            response.put("total", auditorias.size());
            response.put("exito", true);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("mensaje", "Error al obtener registros de auditoría: " + e.getMessage());
            response.put("exito", false);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Obtiene los registros más recientes
     * GET /api/auditoria/recientes?limite=10
     */
    @GetMapping("/recientes")
    public ResponseEntity<Map<String, Object>> obtenerRecientes(@RequestParam(defaultValue = "10") int limite) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            List<Auditoria> auditorias = auditoriaService.obtenerRecientes(limite);
            
            response.put("auditorias", auditorias);
            response.put("total", auditorias.size());
            response.put("exito", true);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("mensaje", "Error al obtener registros de auditoría: " + e.getMessage());
            response.put("exito", false);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Elimina un registro de auditoría por su ID
     * DELETE /api/auditoria/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> eliminarPorId(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            boolean eliminado = auditoriaService.eliminarPorId(id);
            
            if (eliminado) {
                response.put("mensaje", "Registro de auditoría eliminado exitosamente");
                response.put("exito", true);
                return ResponseEntity.ok(response);
            } else {
                response.put("mensaje", "Registro de auditoría no encontrado");
                response.put("exito", false);
                return ResponseEntity.notFound().build();
            }
            
        } catch (Exception e) {
            response.put("mensaje", "Error al eliminar registro de auditoría: " + e.getMessage());
            response.put("exito", false);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Obtiene estadísticas de auditoría
     * GET /api/auditoria/estadisticas
     */
    @GetMapping("/estadisticas")
    public ResponseEntity<Map<String, Object>> obtenerEstadisticas() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            Map<String, Object> estadisticas = new HashMap<>();
            
            // Total de registros
            List<Auditoria> todos = auditoriaService.obtenerTodos();
            estadisticas.put("totalRegistros", todos.size());
            
            // Registros por módulo
            Map<String, Long> porModulo = new HashMap<>();
            porModulo.put("Usuarios", auditoriaService.contarPorModulo("Usuarios"));
            porModulo.put("Pagos", auditoriaService.contarPorModulo("Pagos"));
            porModulo.put("Cursos", auditoriaService.contarPorModulo("Cursos"));
            porModulo.put("Matrículas", auditoriaService.contarPorModulo("Matrículas"));
            porModulo.put("Sistema", auditoriaService.contarPorModulo("Sistema"));
            estadisticas.put("porModulo", porModulo);
            
            response.put("estadisticas", estadisticas);
            response.put("exito", true);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("mensaje", "Error al obtener estadísticas: " + e.getMessage());
            response.put("exito", false);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}
