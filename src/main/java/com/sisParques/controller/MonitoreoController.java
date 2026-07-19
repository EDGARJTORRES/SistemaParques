package com.sisParques.controller;

import com.sisParques.service.MonitoreoService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/monitoreo")
@CrossOrigin(origins = "http://localhost:3000")
public class MonitoreoController {

    private final MonitoreoService monitoreoService;

    public MonitoreoController(MonitoreoService monitoreoService) {
        this.monitoreoService = monitoreoService;
    }

    // ── GET: progreso de tipos de un mantenimiento ─────────────────────────────
    @GetMapping("/{mantId}/progress")
    public ResponseEntity<?> getProgress(@PathVariable Integer mantId) {
        try {
            return ResponseEntity.ok(monitoreoService.getProgress(mantId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ── PATCH: marcar/desmarcar un tipo como completado ────────────────────────
    @PatchMapping("/{mantId}/progress/{timaId}")
    public ResponseEntity<?> toggleProgress(
            @PathVariable Integer mantId,
            @PathVariable Integer timaId,
            @RequestBody Map<String, Object> body) {
        try {
            return ResponseEntity.ok(monitoreoService.toggleProgress(mantId, timaId, body));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ── GET: ampliaciones de un mantenimiento ──────────────────────────────────
    @GetMapping("/{mantId}/ampliaciones")
    public ResponseEntity<?> getAmpliaciones(@PathVariable Integer mantId) {
        try {
            return ResponseEntity.ok(monitoreoService.getAmpliaciones(mantId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ── POST: solicitar ampliación de plazo ────────────────────────────────────
    @PostMapping("/{mantId}/ampliaciones")
    public ResponseEntity<?> solicitarAmpliacion(
            @PathVariable Integer mantId,
            @RequestBody Map<String, Object> body) {
        try {
            return ResponseEntity.ok(monitoreoService.solicitarAmpliacion(mantId, body));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ── GET: todas las ampliaciones pendientes (para admin) ────────────────────
    @GetMapping("/ampliaciones/pendientes")
    public ResponseEntity<?> getAmpliacionesPendientes() {
        try {
            return ResponseEntity.ok(monitoreoService.getAmpliacionesPendientes());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}