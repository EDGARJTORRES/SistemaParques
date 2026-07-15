package com.sisParques.controller;

import com.sisParques.dto.MantenimientoDTO;
import com.sisParques.dto.ObreroDTO;
import com.sisParques.service.MantenimientoService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/mantenimiento")
@CrossOrigin(origins = "http://localhost:3000")
public class MantenimientoController {

    private final MantenimientoService service;

    public MantenimientoController(MantenimientoService service) {
        this.service = service;
    }

    // ── Catálogos ─────────────────────────────────────────────────────────────

    @GetMapping("/supervisores")
    public ResponseEntity<List<Map<String, Object>>> getSupervisores() {
        return ResponseEntity.ok(service.getSupervisores());
    }

    @GetMapping("/obreros")
    public ResponseEntity<List<ObreroDTO>> getObreros() {
        return ResponseEntity.ok(service.getObreros());
    }

    @GetMapping("/tipos-mantenimiento")
    public ResponseEntity<List<Map<String, Object>>> getTipos() {
        return ResponseEntity.ok(service.getTiposMantenimiento());
    }

    @GetMapping("/parques")
    public ResponseEntity<List<Map<String, Object>>> getParques() {
        return ResponseEntity.ok(service.getParques());
    }

    @GetMapping("/incidencias-en-progreso")
    public ResponseEntity<List<Map<String, Object>>> getIncidencias() {
        return ResponseEntity.ok(service.getIncidenciasEnProgreso());
    }

    // ── CRUD ──────────────────────────────────────────────────────────────────

    @GetMapping
    public ResponseEntity<List<MantenimientoDTO>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Integer id) {
        try {
            return ResponseEntity.ok(service.getById(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody MantenimientoDTO dto) {
        try {
            return ResponseEntity.ok(service.create(dto));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Integer id, @RequestBody MantenimientoDTO dto) {
        try {
            return ResponseEntity.ok(service.update(id, dto));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/estado")
    public ResponseEntity<?> cambiarEstado(@PathVariable Integer id, @RequestBody Map<String, String> body) {
        try {
            service.cambiarEstado(id, body.get("estado"));
            return ResponseEntity.ok(Map.of("message", "Estado actualizado"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
