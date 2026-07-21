package com.sisParques.controller;

import com.sisParques.dto.*;
import com.sisParques.service.AbastecimientoService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/abastecimiento")
@CrossOrigin(origins = "http://localhost:3000")
public class AbastecimientoController {

    private final AbastecimientoService service;

    public AbastecimientoController(AbastecimientoService service) {
        this.service = service;
    }

    // ── RECURSOS DE MATERIALES ────────────────────────────────────────────────

    /** Consultar todos los recursos de materiales */
    @GetMapping("/consultar-recursos-materiales")
    public ResponseEntity<List<BienDTO>> consultarRecursosMateriales() {
        return ResponseEntity.ok(service.consultarRecursosMateriales());
    }

    /** Verificar disponibilidad de materiales */
    @GetMapping("/verificar-disponibilidad-materiales")
    public ResponseEntity<List<BienDTO>> verificarDisponibilidadMateriales() {
        return ResponseEntity.ok(service.verificarDisponibilidadMateriales());
    }

    /** Asignar recurso de materiales (crea o actualiza asignación) */
    @PostMapping("/asignar-recurso-materiales")
    public ResponseEntity<?> asignarRecursoMateriales(@RequestBody AsignacionDTO dto) {
        try {
            return ResponseEntity.ok(service.crearAsignacion(dto));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ── Personal de Mantenimiento ─────────────────────────────────────────────

    /** Consultar personal del mantenimiento */
    @GetMapping("/consultar-personal-mantenimiento")
    public ResponseEntity<List<PersonaDTO>> consultarPersonalMantenimiento() {
        return ResponseEntity.ok(service.getPersonal());
    }

    /** Verificar disponibilidad del personal */
    @GetMapping("/verificar-disponibilidad-personal")
    public ResponseEntity<List<ObreroDTO>> verificarDisponibilidadPersonal() {
        return ResponseEntity.ok(service.verificarDisponibilidadPersonal());
    }

    /** Asignar rol de mantenimiento a un obrero */
    @PatchMapping("/obreros/{obrId}/rol")
    public ResponseEntity<?> asignarRol(@PathVariable Integer obrId, @RequestBody Map<String, String> body) {
        try {
            String rol = body.get("rol");
            return ResponseEntity.ok(service.asignarRol(obrId, rol));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /** Asignar recurso del personal (registra obrero si no existe) */
    @PostMapping("/asignar-recurso-personal/{persId}")
    public ResponseEntity<?> asignarRecursoPersonal(@PathVariable Integer persId) {
        try {
            return ResponseEntity.ok(service.registrarObrero(persId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ── Asignaciones completas ────────────────────────────────────────────────

    @GetMapping("/asignaciones")
    public ResponseEntity<List<AsignacionDTO>> getAsignaciones() {
        return ResponseEntity.ok(service.getAsignaciones());
    }

    @GetMapping("/asignaciones/{id}")
    public ResponseEntity<?> getAsignacion(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(service.getAsignacionById(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/asignaciones/{id}")
    public ResponseEntity<?> actualizar(@PathVariable Long id, @RequestBody AsignacionDTO dto) {
        try {
            return ResponseEntity.ok(service.actualizarAsignacion(id, dto));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/asignaciones/{id}")
    public ResponseEntity<?> desactivar(@PathVariable Long id) {
        try {
            service.desactivarAsignacion(id);
            return ResponseEntity.ok(Map.of("message", "Asignación desactivada"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PatchMapping("/asignaciones/{id}/reactivar")
    public ResponseEntity<?> reactivar(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(service.reactivarAsignacion(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ── Detalle: registrar fecha de retiro ────────────────────────────────────

    /** Registra la fecha de retiro de un bien en el detalle de asignación */
    @PatchMapping("/detalle/{detalleId}/retirar")
    public ResponseEntity<?> registrarRetiro(@PathVariable Long detalleId) {
        try {
            return ResponseEntity.ok(service.registrarRetiro(detalleId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /** Anula el retiro de un bien (limpia fecha_retiro) */
    @PatchMapping("/detalle/{detalleId}/anular-retiro")
    public ResponseEntity<?> anularRetiro(@PathVariable Long detalleId) {
        try {
            return ResponseEntity.ok(service.anularRetiro(detalleId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
