package com.sisParques.controller;

import com.sisParques.dto.ParqueServicioDTO;
import com.sisParques.service.ParqueServicioService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/parque-servicios")
@CrossOrigin(origins = "http://localhost:3000")
public class ParqueServicioController {

    private final ParqueServicioService parqueServicioService;

    public ParqueServicioController(ParqueServicioService parqueServicioService) {
        this.parqueServicioService = parqueServicioService;
    }

    @GetMapping
    public ResponseEntity<List<ParqueServicioDTO>> getAll() {
        return ResponseEntity.ok(parqueServicioService.getAll());
    }

    @GetMapping("/parque/{parqId}")
    public ResponseEntity<?> getByParque(@PathVariable Integer parqId) {
        try {
            return ResponseEntity.ok(
                    parqueServicioService.getByParque(parqId)
            );
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> create(
            @RequestBody ParqueServicioDTO dto
    ) {
        try {
            return ResponseEntity.ok(
                    parqueServicioService.create(dto)
            );
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/{paseId}")
    public ResponseEntity<?> delete(
            @PathVariable Integer paseId
    ) {
        try {
            parqueServicioService.delete(paseId);

            return ResponseEntity.ok(
                    Map.of(
                            "message",
                            "Servicio desasignado correctamente del parque"
                    )
            );

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", e.getMessage()));
        }
    }

    @PatchMapping("/{paseId}/reactivar")
    public ResponseEntity<?> reactivate(
            @PathVariable Integer paseId
    ) {
        try {
            return ResponseEntity.ok(
                    parqueServicioService.reactivate(paseId)
            );
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", e.getMessage()));
        }
    }
}