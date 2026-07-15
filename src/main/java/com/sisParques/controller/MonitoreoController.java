package com.sisParques.controller;

import com.sisParques.entity.MantAmpliacion;
import com.sisParques.entity.MantTipoProgress;
import com.sisParques.entity.Mantenimiento;
import com.sisParques.repository.MantAmpliacionRepository;
import com.sisParques.repository.MantTipoProgressRepository;
import com.sisParques.repository.MantenimientoRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/monitoreo")
@CrossOrigin(origins = "http://localhost:3000")
public class MonitoreoController {

    private final MantenimientoRepository mantRepo;
    private final MantTipoProgressRepository progressRepo;
    private final MantAmpliacionRepository amplRepo;

    public MonitoreoController(MantenimientoRepository mantRepo,
            MantTipoProgressRepository progressRepo,
            MantAmpliacionRepository amplRepo) {
        this.mantRepo = mantRepo;
        this.progressRepo = progressRepo;
        this.amplRepo = amplRepo;
    }

    // ── GET: progreso de tipos de un mantenimiento ─────────────────────────────
    @GetMapping("/{mantId}/progress")
    public ResponseEntity<List<Map<String, Object>>> getProgress(@PathVariable Integer mantId) {
        List<MantTipoProgress> list = progressRepo.findByMantId(mantId);
        List<Map<String, Object>> result = new ArrayList<>();
        for (MantTipoProgress p : list) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("mtpId", p.getMtpId());
            m.put("mantId", p.getMantId());
            m.put("timaId", p.getTimaId());
            m.put("mtpCompletado", p.getMtpCompletado());
            m.put("mtpFechaCheck", p.getMtpFechaCheck());
            result.add(m);
        }
        return ResponseEntity.ok(result);
    }

    // ── PATCH: marcar/desmarcar un tipo como completado ────────────────────────
    @Transactional
    @PatchMapping("/{mantId}/progress/{timaId}")
    public ResponseEntity<?> toggleProgress(
            @PathVariable Integer mantId,
            @PathVariable Integer timaId,
            @RequestBody Map<String, Object> body) {
        try {
            boolean completado = Boolean.TRUE.equals(body.get("completado"));
            Integer usuarioId = body.get("usuarioId") != null
                    ? ((Number) body.get("usuarioId")).intValue()
                    : null;

            // Upsert: buscar o crear
            MantTipoProgress progress = progressRepo
                    .findByMantIdAndTimaId(mantId, timaId)
                    .orElseGet(() -> {
                        MantTipoProgress np = new MantTipoProgress();
                        np.setMantId(mantId);
                        np.setTimaId(timaId);
                        return np;
                    });

            progress.setMtpCompletado(completado);
            progress.setMtpFechaCheck(completado ? LocalDateTime.now() : null);
            progress.setMtpUsuarioId(usuarioId);
            progressRepo.save(progress);

            // Verificar si TODOS los tipos del mantenimiento están completados
            Mantenimiento mant = mantRepo.findById(mantId)
                    .orElseThrow(() -> new RuntimeException("Mantenimiento no encontrado"));

            Integer[] timaIds = mant.getTimaIds();
            if (timaIds != null && timaIds.length > 0) {
                List<MantTipoProgress> todosLosProgress = progressRepo.findByMantId(mantId);
                long completados = todosLosProgress.stream()
                        .filter(p -> Boolean.TRUE.equals(p.getMtpCompletado()))
                        .count();

                // Si todos los tipos están completados → cambiar estado a COMPLETADO
                if (completados >= timaIds.length) {
                    mant.setMantEstado("COMPLETADO");
                    mantRepo.save(mant);
                    return ResponseEntity.ok(Map.of(
                            "message", "Tipo marcado. ¡Mantenimiento completado al 100%!",
                            "estadoActualizado", true,
                            "nuevoEstado", "COMPLETADO"));
                }
            }

            return ResponseEntity.ok(Map.of(
                    "message", "Progreso actualizado",
                    "estadoActualizado", false));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ── GET: ampliaciones de un mantenimiento ──────────────────────────────────
    @GetMapping("/{mantId}/ampliaciones")
    public ResponseEntity<List<Map<String, Object>>> getAmpliaciones(@PathVariable Integer mantId) {
        List<MantAmpliacion> list = amplRepo.findByMantIdOrderByAmplFechaCreaDesc(mantId);
        List<Map<String, Object>> result = new ArrayList<>();
        for (MantAmpliacion a : list) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("amplId", a.getAmplId());
            m.put("mantId", a.getMantId());
            m.put("amplMotivo", a.getAmplMotivo());
            m.put("amplFechaNva", a.getAmplFechaNva());
            m.put("amplEstado", a.getAmplEstado());
            m.put("amplFechaCrea", a.getAmplFechaCrea());
            m.put("amplResolucion", a.getAmplResolucion());
            result.add(m);
        }
        return ResponseEntity.ok(result);
    }

    // ── POST: solicitar ampliación de plazo ────────────────────────────────────
    @PostMapping("/{mantId}/ampliaciones")
    public ResponseEntity<?> solicitarAmpliacion(
            @PathVariable Integer mantId,
            @RequestBody Map<String, Object> body) {
        try {
            MantAmpliacion ampl = new MantAmpliacion();
            ampl.setMantId(mantId);
            ampl.setAmplMotivo((String) body.get("motivo"));
            ampl.setAmplFechaNva(LocalDate.parse((String) body.get("fechaNueva")));
            if (body.get("usuarioId") != null)
                ampl.setAmplUsuarioId(((Number) body.get("usuarioId")).intValue());

            amplRepo.save(ampl);
            return ResponseEntity.ok(Map.of("message", "Solicitud de ampliación registrada exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ── GET: todas las ampliaciones pendientes (para admin) ────────────────────
    @GetMapping("/ampliaciones/pendientes")
    public ResponseEntity<List<Map<String, Object>>> getAmpliacionesPendientes() {
        List<MantAmpliacion> list = amplRepo.findByAmplEstadoOrderByAmplFechaCreaDesc("PENDIENTE");
        List<Map<String, Object>> result = new ArrayList<>();
        for (MantAmpliacion a : list) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("amplId", a.getAmplId());
            m.put("mantId", a.getMantId());
            m.put("amplMotivo", a.getAmplMotivo());
            m.put("amplFechaNva", a.getAmplFechaNva());
            m.put("amplEstado", a.getAmplEstado());
            m.put("amplFechaCrea", a.getAmplFechaCrea());
            result.add(m);
        }
        return ResponseEntity.ok(result);
    }
}
