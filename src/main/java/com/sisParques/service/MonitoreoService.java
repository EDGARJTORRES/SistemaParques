package com.sisParques.service;

import com.sisParques.entity.MantAmpliacion;
import com.sisParques.entity.MantTipoProgress;
import com.sisParques.entity.Mantenimiento;
import com.sisParques.repository.MantAmpliacionRepository;
import com.sisParques.repository.MantTipoProgressRepository;
import com.sisParques.repository.MantenimientoRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Servicio para el monitoreo de mantenimientos: progreso por tipo
 * y solicitudes de ampliación de plazo.
 */
@Service
public class MonitoreoService {

    private final MantenimientoRepository mantRepo;
    private final MantTipoProgressRepository progressRepo;
    private final MantAmpliacionRepository amplRepo;

    @PersistenceContext
    private EntityManager em;

    public MonitoreoService(MantenimientoRepository mantRepo,
            MantTipoProgressRepository progressRepo,
            MantAmpliacionRepository amplRepo) {
        this.mantRepo = mantRepo;
        this.progressRepo = progressRepo;
        this.amplRepo = amplRepo;
    }

    // ── Progreso de tipos de un mantenimiento ───────────────────────────────

    /** Verificar cumplimiento de mantenimiento */
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
     * Registrar incumplimiento de Mantenimiento
     */
    public Map<String, Object> getEstadoReal(Integer mantId) {

        Mantenimiento mant = mantRepo.findById(mantId)
                .orElseThrow(() ->
                    new RuntimeException(
                        "Mantenimiento no encontrado"
                    )
                );

        LocalDate hoy = LocalDate.now();

        boolean vencido =
                mant.getMantFechaFin() != null
                && hoy.isAfter(mant.getMantFechaFin())
                && !"COMPLETADO".equals(mant.getMantEstado())
                && !"CANCELADO".equals(mant.getMantEstado());

        long diasVencido = 0;

        if (vencido) {
            diasVencido = java.time.temporal.ChronoUnit.DAYS.between(
                    mant.getMantFechaFin(),
                    hoy
            );
        }

        return Map.of(
            "mantId", mantId,
            "estadoActual", mant.getMantEstado(),
            "vencido", vencido,
            "diasVencido", diasVencido,
            "estadoReal", vencido
                    ? "INCUMPLIDO"
                    : mant.getMantEstado()
        );
    }

    /**
     * Registra cierre de Mantenimiento(Completado)
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

    /** Obtiene ampliaciones resueltas (APROBADO o RECHAZADO) */
    public List<Map<String, Object>> getAmpliacionesResueltas() {
        List<MantAmpliacion> aprobadas = amplRepo.findByAmplEstadoOrderByAmplFechaCreaDesc("APROBADO");
        List<MantAmpliacion> rechazadas = amplRepo.findByAmplEstadoOrderByAmplFechaCreaDesc("RECHAZADO");
        List<MantAmpliacion> todas = new ArrayList<>();
        todas.addAll(aprobadas);
        todas.addAll(rechazadas);
        return todas.stream().map(a -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("amplId", a.getAmplId());
            m.put("mantId", a.getMantId());
            m.put("amplMotivo", a.getAmplMotivo());
            m.put("amplFechaNva", a.getAmplFechaNva());
            m.put("amplEstado", a.getAmplEstado());
            m.put("amplFechaCrea", a.getAmplFechaCrea());
            m.put("amplResolucion", a.getAmplResolucion());
            // Enriquecer con datos del mantenimiento
            try {
                Object[] row = (Object[]) em.createNativeQuery(
                    "SELECT m.mant_titulo, m.mant_estado, m.mant_fecha_fin, p.parq_nombre " +
                    "FROM sc_sistema.tb_mantenimiento m " +
                    "LEFT JOIN sc_sistema.tb_parque p ON p.parq_id = m.parq_id " +
                    "WHERE m.mant_id = " + a.getMantId()
                ).getSingleResult();
                m.put("mantTitulo", str(row[0]));
                m.put("mantEstado", str(row[1]));
                m.put("mantFechaFin", row[2]);
                m.put("parqNombre", str(row[3]));
            } catch (Exception ignored) {}
            return m;
        }).collect(Collectors.toList());
    }

    /** Evalua ampliaciones de plazo (Estado:Pendiente) */
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

    /**
     * Procesar evaluación de ampliación de plazo
     * Aprueba o rechaza solicitudes de ampliación
     */
    @Transactional
    public Map<String, Object> procesarAmpliacion(Integer amplId, Map<String, Object> decision) {
        MantAmpliacion ampl = amplRepo.findById(amplId)
                .orElseThrow(() -> new RuntimeException("Ampliación no encontrada"));

        String accion = (String) decision.get("accion"); // "APROBAR" o "RECHAZAR"
        String resolucion = (String) decision.get("resolucion");
        Integer evaluadorId = decision.get("evaluadorId") != null 
                ? ((Number) decision.get("evaluadorId")).intValue() 
                : null;

        if ("APROBAR".equals(accion)) {
            ampl.setAmplEstado("APROBADO");
            ampl.setAmplResolucion(resolucion);
            ampl.setAmplEvaluadorId(evaluadorId);
            
            // Actualizar fecha fin del mantenimiento
            Mantenimiento mant = mantRepo.findById(ampl.getMantId())
                    .orElseThrow(() -> new RuntimeException("Mantenimiento no encontrado"));
            mant.setMantFechaFin(ampl.getAmplFechaNva());
            mantRepo.save(mant);
            
            amplRepo.save(ampl);
            return Map.of("message", "Ampliación aprobada y cronograma actualizado");
            
        } else if ("RECHAZAR".equals(accion)) {
            ampl.setAmplEstado("RECHAZADO");
            ampl.setAmplResolucion(resolucion);
            ampl.setAmplEvaluadorId(evaluadorId);
            amplRepo.save(ampl);
            return Map.of("message", "Ampliación rechazada");
            
        } else {
            throw new RuntimeException("Acción no válida. Use: APROBAR o RECHAZAR");
        }
    }

    private static String str(Object o) { return o == null ? "" : o.toString(); }
}
