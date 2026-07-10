package com.sisParques.controller;

import com.sisParques.dto.TipoMantenimientoDTO;
import com.sisParques.service.TipoMantenimientoService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tipos-mantenimiento")
@CrossOrigin(origins = "http://localhost:3000")
public class TipoMantenimientoController {

    private final TipoMantenimientoService tipoMantenimientoService;

    public TipoMantenimientoController(TipoMantenimientoService tipoMantenimientoService) {
        this.tipoMantenimientoService = tipoMantenimientoService;
    }

    @GetMapping
    public ResponseEntity<List<TipoMantenimientoDTO>> getAll() {
        return ResponseEntity.ok(tipoMantenimientoService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Integer id) {
        try {
            return ResponseEntity.ok(tipoMantenimientoService.getById(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody TipoMantenimientoDTO dto) {
        try {
            return ResponseEntity.ok(tipoMantenimientoService.create(dto));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Integer id, @RequestBody TipoMantenimientoDTO dto) {
        try {
            return ResponseEntity.ok(tipoMantenimientoService.update(id, dto));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Integer id) {
        try {
            tipoMantenimientoService.delete(id);
            return ResponseEntity.ok(
                Map.of("message", "Tipo de mantenimiento desactivado correctamente")
            );
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/reactivar")
    public ResponseEntity<?> reactivate(@PathVariable Integer id) {
        try {
            return ResponseEntity.ok(tipoMantenimientoService.reactivate(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}