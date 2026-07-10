package com.sisParques.controller;

import com.sisParques.dto.IncidenciaDTO;
import com.sisParques.dto.RegistrarIncidenciaRequest;
import com.sisParques.service.IncidenciaService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/incidencias")
@CrossOrigin(origins = "http://localhost:3000")
public class IncidenciaController {

    private final IncidenciaService incidenciaService;

    public IncidenciaController(IncidenciaService incidenciaService) {
        this.incidenciaService = incidenciaService;
    }

    @GetMapping
    public ResponseEntity<List<IncidenciaDTO>> getAll() {
        return ResponseEntity.ok(incidenciaService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Integer id) {
        try {
            return ResponseEntity.ok(incidenciaService.getById(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/ciudadano/{ciudId}")
    public ResponseEntity<List<IncidenciaDTO>> getByCiudadano(@PathVariable Integer ciudId) {
        return ResponseEntity.ok(incidenciaService.getByCiudadano(ciudId));
    }

    @GetMapping("/estado/{estado}")
    public ResponseEntity<List<IncidenciaDTO>> getByEstado(@PathVariable String estado) {
        return ResponseEntity.ok(incidenciaService.getByEstado(estado));
    }

    /**
     * Registra una incidencia para un ciudadano YA EXISTENTE (solo se envía ciudId).
     */
    @PostMapping
    public ResponseEntity<?> create(@RequestBody IncidenciaDTO dto) {
        try {
            return ResponseEntity.ok(incidenciaService.create(dto));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * Registra una incidencia JUNTO con los datos del ciudadano.
     * Si el ciudadano ya existe (por número de documento), lo reutiliza;
     * si no existe, lo crea automáticamente.
     */
    @PostMapping("/registrar")
    public ResponseEntity<?> registrar(@RequestBody RegistrarIncidenciaRequest request) {
        try {
            return ResponseEntity.ok(incidenciaService.registrar(request.getIncidencia(), request.getCiudadano()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Integer id, @RequestBody IncidenciaDTO dto) {
        try {
            return ResponseEntity.ok(incidenciaService.update(id, dto));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/estado")
    public ResponseEntity<?> cambiarEstado(@PathVariable Integer id, @RequestBody Map<String, String> body) {
        try {
            String nuevoEstado = body.get("estado");
            return ResponseEntity.ok(incidenciaService.cambiarEstado(id, nuevoEstado));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Integer id) {
        try {
            incidenciaService.delete(id);
            return ResponseEntity.ok(Map.of("message", "Incidencia cancelada correctamente"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}