package com.sisParques.controller;

import com.sisParques.dto.ParqueDTO;
import com.sisParques.service.ParqueService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/parques")
@CrossOrigin(origins = "http://localhost:3000")
public class ParqueController {

    private final ParqueService parqueService;

    public ParqueController(ParqueService parqueService) {
        this.parqueService = parqueService;
    }

    @GetMapping
    public ResponseEntity<List<ParqueDTO>> getAll() {
        return ResponseEntity.ok(parqueService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Integer id) {
        try {
            return ResponseEntity.ok(parqueService.getById(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody ParqueDTO dto) {
        try {
            return ResponseEntity.ok(parqueService.create(dto));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Integer id, @RequestBody ParqueDTO dto) {
        try {
            return ResponseEntity.ok(parqueService.update(id, dto));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Integer id) {
        try {
            parqueService.delete(id);
            return ResponseEntity.ok(Map.of("message", "Parque desactivado correctamente"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/reactivar")
    public ResponseEntity<?> reactivate(@PathVariable Integer id) {
        try {
            return ResponseEntity.ok(parqueService.reactivate(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
