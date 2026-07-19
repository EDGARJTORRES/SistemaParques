package com.sisParques.service;

import com.sisParques.entity.MantAmpliacion;
import com.sisParques.entity.MantTipoProgress;
import com.sisParques.entity.Mantenimiento;
import com.sisParques.repository.MantAmpliacionRepository;
import com.sisParques.repository.MantTipoProgressRepository;
import com.sisParques.repository.MantenimientoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Servicio para el monitoreo de mantenimientos: progreso por tipo
 * y solicitudes de ampliación de plazo.
 */
@Service
public class MonitoreoService {

    private final MantenimientoRepository mantRepo;
    private final MantTipoProgressRepository progressRepo;
    private final MantAmpliacionRepository amplRepo;

    public MonitoreoService(MantenimientoRepository mantRepo,
            MantTipoProgressRepository progressRepo,
            MantAmpliacionRepository amplRepo) {
        this.mantRepo = mantRepo;
        this.progressRepo = progressRepo;
        this.amplRepo = amplRepo;
    }

    // ── Progreso de tipos de un mantenimiento ───────────────────────────────

    /** Obtiene el progreso de todos los tipos asociados a un mantenimiento */
    public List<Map<String, Object>> getProgress(Integer mantId) {
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
        return result;
    }

    /**
     * Marca/desmarca un tipo como completado (upsert) y verifica si con este
     * cambio el mantenimiento queda completado al 100%.
     */
    @Transactional
    public Map<String, Object> toggleProgress(Integer mantId, Integer timaId, Map<String, Object> body) {
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
                return Map.of(
                        "message", "Tipo marcado. ¡Mantenimiento completado al 100%!",
                        "estadoActualizado", true,
                        "nuevoEstado", "COMPLETADO");
            }
        }

        return Map.of(
                "message", "Progreso actualizado",
                "estadoActualizado", false);
    }

    // ── Ampliaciones de plazo ────────────────────────────────────────────────

    /** Obtiene las ampliaciones de un mantenimiento, más recientes primero */
    public List<Map<String, Object>> getAmpliaciones(Integer mantId) {
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
        return result;
    }

    /** Registra una solicitud de ampliación de plazo para un mantenimiento */
    public Map<String, Object> solicitarAmpliacion(Integer mantId, Map<String, Object> body) {
        MantAmpliacion ampl = new MantAmpliacion();
        ampl.setMantId(mantId);
        ampl.setAmplMotivo((String) body.get("motivo"));
        ampl.setAmplFechaNva(LocalDate.parse((String) body.get("fechaNueva")));
        if (body.get("usuarioId") != null)
            ampl.setAmplUsuarioId(((Number) body.get("usuarioId")).intValue());

        amplRepo.save(ampl);
        return Map.of("message", "Solicitud de ampliación registrada exitosamente");
    }

    /** Obtiene todas las ampliaciones pendientes de resolución (para admin) */
    public List<Map<String, Object>> getAmpliacionesPendientes() {
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
        return result;
    }
}