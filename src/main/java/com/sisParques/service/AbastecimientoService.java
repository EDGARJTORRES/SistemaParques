package com.sisParques.service;

import com.sisParques.dto.*;
import com.sisParques.entity.*;
import com.sisParques.repository.*;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Servicio para la gestión de abastecimiento de materiales y bienes del área de parques.
 * Permite consultar bienes disponibles, gestionar personal activo, registrar obreros,
 * crear y administrar asignaciones de materiales a obreros, y controlar el retiro de bienes.
 */
@Service
public class AbastecimientoService {

    // depe_id fijos del área de parques
    private static final List<Long> DEPE_IDS = List.of(156L, 158L);

    private final AsignacionRepository       asignacionRepo;
    private final AsignacionDetalleRepository detalleRepo;
    private final ObreroRepository            obreroRepo;

    @PersistenceContext
    private EntityManager em;

    public AbastecimientoService(AsignacionRepository asignacionRepo,
                                  AsignacionDetalleRepository detalleRepo,
                                  ObreroRepository obreroRepo) {
        this.asignacionRepo = asignacionRepo;
        this.detalleRepo    = detalleRepo;
        this.obreroRepo     = obreroRepo;
    }
    // ── BIENES ────────────────────────────────────────────────────────────────

    /**
     * Consultar todos los recursos de materiales
     * Bienes pertenecientes a las dependencias 156 y 158.
     */
    public List<BienDTO> consultarRecursosMateriales() {

        String sql =
            "SELECT " +
            "  bd.bien_id, " +
            "  bd.biendepe_id, " +
            "  o.obj_nombre, " +
            "  b.bien_numserie, " +
            "  b.bien_placa, " +
            "  bd.biendepe_obs, " +
            "  CAST(b.bien_est AS VARCHAR) " +
            "FROM sc_inventario.tb_bien_dependencia bd " +
            "JOIN sc_inventario.tb_bien b " +
            "  ON b.bien_id = bd.bien_id " +
            "JOIN sc_inventario.tb_objeto o " +
            "  ON o.obj_id = b.obj_id " +
            "WHERE bd.depe_id IN (156, 158) " +
            "ORDER BY o.obj_nombre";

        @SuppressWarnings("unchecked")
        List<Object[]> rows = em.createNativeQuery(sql).getResultList();

        return rows.stream().map(this::mapBienDTO)
                    .collect(Collectors.toList());
    }


    /**
     * Verificar disponibilidad de materiales.
     */
    public List<BienDTO> verificarDisponibilidadMateriales() {

        String sql =
            "SELECT " +
            "  bd.bien_id, " +
            "  bd.biendepe_id, " +
            "  o.obj_nombre, " +
            "  b.bien_numserie, " +
            "  b.bien_placa, " +
            "  bd.biendepe_obs, " +
            "  CAST(b.bien_est AS VARCHAR) " +
            "FROM sc_inventario.tb_bien_dependencia bd " +
            "JOIN sc_inventario.tb_bien b " +
            "  ON b.bien_id = bd.bien_id " +
            "JOIN sc_inventario.tb_objeto o " +
            "  ON o.obj_id = b.obj_id " +
            "WHERE bd.depe_id IN (156, 158) " +
            "AND NOT EXISTS ( " +
            "    SELECT 1 " +
            "    FROM sc_sistema.tb_asignacion_detalle am  " +
            "    WHERE am.bien_id = bd.bien_id " +
            "    AND am.estado = 'ASIGNADO' " +
            ") " +
            "ORDER BY o.obj_nombre";

        @SuppressWarnings("unchecked")
        List<Object[]> rows = em.createNativeQuery(sql).getResultList();

        return rows.stream().map(this::mapBienDTO)
                    .collect(Collectors.toList());
    }

    /** Consultar personal del mantenimiento */
    public List<PersonaDTO> getPersonal() {
        String sql =
            "SELECT " +
            "  p.pers_id, " +
            "  p.pers_dni, " +
            "  p.pers_nombre, " +
            "  p.pers_apelpat, " +
            "  p.pers_apelmat, " +
            "  p.pers_celu01, " +
            "  p.pers_estado " +
            "FROM sc_escalafon.tb_persona p " +
            "WHERE p.pers_estado = 'A' " +
            "ORDER BY p.pers_apelpat, p.pers_nombre";

        @SuppressWarnings("unchecked")
        List<Object[]> rows = em.createNativeQuery(sql).getResultList();

        return rows.stream().map(r -> {
            PersonaDTO d = new PersonaDTO();
            d.setPersId(toLong(r[0]));
            d.setPersDni(str(r[1]));
            d.setPersNombre(str(r[2]));
            d.setPersApelPat(str(r[3]));
            d.setPersApelMat(str(r[4]));
            d.setPersCelu01(str(r[5]));
            d.setPersEstado(str(r[6]));
            d.setNombreCompleto(
                    (str(r[3]) + " " + str(r[4]) + " " + str(r[2])).trim()
            );
            return d;
        }).collect(Collectors.toList());
    }

    /** Lista obreros registrados con datos de persona */
    public List<ObreroDTO> getObreros() {
        List<Obrero> obreros = obreroRepo.findAll();
        return obreros.stream().map(this::enrichObrero).collect(Collectors.toList());
    }
    
    /** Asignar recurso del personal (registra obrero si no existe) */

    @Transactional
    public ObreroDTO registrarObrero(Integer persId) {
        return obreroRepo.findByPersId(persId)
                .map(this::enrichObrero)
                .orElseGet(() -> {
                    Obrero o = new Obrero();
                    o.setPersId(persId);
                    o.setObrEstado("A");
                    return enrichObrero(obreroRepo.save(o));
                });
    }

    // ── ASIGNACIONES ─────────────────────────────────────────────────────────

    /** Obtiene la lista completa de todas las asignaciones de materiales */
    public List<AsignacionDTO> getAsignaciones() {
        return asignacionRepo.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /** Obtiene una asignación específica por su ID */
    public AsignacionDTO getAsignacionById(Long id) {
        Asignacion a = asignacionRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Asignación no encontrada: " + id));
        return toDTO(a);
    }

    /** Asignar recurso de materiales (crea o actualiza asignación) */
    @Transactional
    public AsignacionDTO crearAsignacion(AsignacionDTO dto) {
        // dto.obrId viene con el pers_id seleccionado en el frontend
        Integer persId = Math.toIntExact(dto.getObrId());

        // Registrar obrero si no existe, o recuperar el existente
        ObreroDTO obrero = registrarObrero(persId);
        Long realObrId   = obrero.getObrId().longValue();

        Asignacion a = new Asignacion();
        a.setObrId(realObrId);
        a.setAsigObservacion(dto.getAsigObservacion());
        a.setAsigEstado("ACTIVO");
        a.setIdUsuario(dto.getIdUsuario());

        // Crear detalles de bienes
        if (dto.getBienIds() != null) {
            for (Long bienId : dto.getBienIds()) {
                AsignacionDetalle det = new AsignacionDetalle();
                det.setAsignacion(a);
                det.setBienId(bienId);
                det.setEstado("ASIGNADO");
                a.getDetalles().add(det);
            }
        }
        return toDTO(asignacionRepo.save(a));
    }

    /**
     * Actualiza una asignación existente.
     * Reutilizable: cambia el obrero y/o los materiales libremente.
     */
    @Transactional
    public AsignacionDTO actualizarAsignacion(Long id, AsignacionDTO dto) {
        Asignacion a = asignacionRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Asignación no encontrada: " + id));

        // Cambiar obrero si viene diferente
        if (dto.getObrId() != null) {
            a.setObrId(dto.getObrId());
        }

        if (dto.getAsigObservacion() != null) a.setAsigObservacion(dto.getAsigObservacion());
        if (dto.getAsigEstado()      != null) a.setAsigEstado(dto.getAsigEstado());

        // Reemplazar detalles de bienes si se envían
        if (dto.getBienIds() != null) {
            a.getDetalles().clear();
            asignacionRepo.save(a);   // flush orphanRemoval

            for (Long bienId : dto.getBienIds()) {
                AsignacionDetalle det = new AsignacionDetalle();
                det.setAsignacion(a);
                det.setBienId(bienId);
                det.setEstado("ASIGNADO");
                a.getDetalles().add(det);
            }
        }

        return toDTO(asignacionRepo.save(a));
    }

    /** Desactiva una asignación cambiando su estado a INACTIVO */
    @Transactional
    public void desactivarAsignacion(Long id) {
        Asignacion a = asignacionRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Asignación no encontrada: " + id));
        a.setAsigEstado("INACTIVO");
        asignacionRepo.save(a);
    }

    /** Reactiva una asignación cambiando su estado a ACTIVO */
    @Transactional
    public AsignacionDTO reactivarAsignacion(Long id) {
        Asignacion a = asignacionRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Asignación no encontrada: " + id));
        a.setAsigEstado("ACTIVO");
        return toDTO(asignacionRepo.save(a));
    }

    // ── Retiro de bienes ──────────────────────────────────────────────────────

    /** Registra la fecha_retiro = ahora y cambia estado a RETIRADO */
    @Transactional
    public AsignacionDetalleDTO registrarRetiro(Long detalleId) {
        AsignacionDetalle det = detalleRepo.findById(detalleId)
                .orElseThrow(() -> new RuntimeException("Detalle no encontrado: " + detalleId));
        det.setFechaRetiro(java.time.LocalDateTime.now());
        det.setEstado("RETIRADO");
        return toDetalleDTO(detalleRepo.save(det));
    }

    /** Limpia fecha_retiro y vuelve a ASIGNADO */
    @Transactional
    public AsignacionDetalleDTO anularRetiro(Long detalleId) {
        AsignacionDetalle det = detalleRepo.findById(detalleId)
                .orElseThrow(() -> new RuntimeException("Detalle no encontrado: " + detalleId));
        det.setFechaRetiro(null);
        det.setEstado("ASIGNADO");
        return toDetalleDTO(detalleRepo.save(det));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    private BienDTO mapBienDTO(Object[] row) {
        BienDTO dto = new BienDTO();
        dto.setBienId(toLong(row[0]));
        dto.setBienDepeId(toLong(row[1]));
        dto.setObjNombre(str(row[2]));
        dto.setBienNumSerie(str(row[3]));
        dto.setBienPlaca(str(row[4]));
        dto.setBienObs(str(row[5]));
        dto.setBienEst(str(row[6]));

        return dto;
    }

    private AsignacionDTO toDTO(Asignacion a) {
        AsignacionDTO dto = new AsignacionDTO();
        dto.setAsigId(a.getAsigId());
        dto.setObrId(a.getObrId());
        dto.setAsigFecha(a.getAsigFecha());
        dto.setAsigObservacion(a.getAsigObservacion());
        dto.setAsigEstado(a.getAsigEstado());
        dto.setIdUsuario(a.getIdUsuario());

        // datos del obrero via query nativa
        try {
            String sql =
                "SELECT p.pers_dni, p.pers_nombre, p.pers_apelpat, p.pers_apelmat, p.pers_celu01 " +
                "FROM sc_sistema.tb_obrero o " +
                "JOIN sc_escalafon.tb_persona p ON p.pers_id = o.pers_id " +
                "WHERE o.obr_id = " + a.getObrId();
            Object[] row = (Object[]) em.createNativeQuery(sql).getSingleResult();
            dto.setObreroDni(str(row[0]));
            dto.setObreroNombre((str(row[2]) + " " + str(row[3]) + " " + str(row[1])).trim());
            dto.setObreroCelular(str(row[4]));
        } catch (Exception ignored) { /* obrero aún no sincronizado */ }

        // detalles con nombre de objeto
        List<AsignacionDetalleDTO> dets = a.getDetalles().stream().map(det -> {
            AsignacionDetalleDTO d = new AsignacionDetalleDTO();
            d.setAsigDetId(det.getAsigDetId());
            d.setAsigId(a.getAsigId());
            d.setBienId(det.getBienId());
            d.setFechaAsignacion(det.getFechaAsignacion());
            d.setFechaRetiro(det.getFechaRetiro());
            d.setEstado(det.getEstado());
            try {
                String sql2 =
                    "SELECT o.obj_nombre, b.bien_placa, b.bien_numserie " +
                    "FROM sc_inventario.tb_bien b " +
                    "JOIN sc_inventario.tb_objeto o ON o.obj_id = b.obj_id " +
                    "WHERE b.bien_id = " + det.getBienId();
                Object[] r = (Object[]) em.createNativeQuery(sql2).getSingleResult();
                d.setObjNombre(str(r[0]));
                d.setBienPlaca(str(r[1]));
                d.setBienNumSerie(str(r[2]));
            } catch (Exception ignored) {}
            return d;
        }).collect(Collectors.toList());
        dto.setDetalles(dets);

        return dto;
    }

    private ObreroDTO enrichObrero(Obrero o) {
        ObreroDTO dto = new ObreroDTO();
        dto.setObrId(o.getObrId());
        dto.setPersId(o.getPersId());
        dto.setObrEstado(o.getObrEstado());
        try {
            String sql =
                "SELECT pers_dni, pers_nombre, pers_apelpat, pers_apelmat, pers_celu01 " +
                "FROM sc_escalafon.tb_persona " +
                "WHERE pers_id = " + o.getPersId();
            Object[] row = (Object[]) em.createNativeQuery(sql).getSingleResult();
            dto.setPersDni(str(row[0]));
            dto.setPersNombre(str(row[1]));
            dto.setPersApelPat(str(row[2]));
            dto.setPersApelMat(str(row[3]));
            dto.setPersCelu01(str(row[4]));
            dto.setNombreCompleto((str(row[2]) + " " + str(row[3]) + " " + str(row[1])).trim());
        } catch (Exception ignored) {}
        return dto;
    }

    private static String str(Object o)  { return o == null ? "" : o.toString(); }
    private static Long   toLong(Object o){ return o == null ? null : ((Number) o).longValue(); }

    private AsignacionDetalleDTO toDetalleDTO(AsignacionDetalle det) {
        AsignacionDetalleDTO d = new AsignacionDetalleDTO();
        d.setAsigDetId(det.getAsigDetId());
        d.setAsigId(det.getAsignacion() != null ? det.getAsignacion().getAsigId() : null);
        d.setBienId(det.getBienId());
        d.setFechaAsignacion(det.getFechaAsignacion());
        d.setFechaRetiro(det.getFechaRetiro());
        d.setEstado(det.getEstado());
        try {
            String sql =
                "SELECT o.obj_nombre, b.bien_placa, b.bien_numserie " +
                "FROM sc_inventario.tb_bien b " +
                "JOIN sc_inventario.tb_objeto o ON o.obj_id = b.obj_id " +
                "WHERE b.bien_id = " + det.getBienId();
            Object[] r = (Object[]) em.createNativeQuery(sql).getSingleResult();
            d.setObjNombre(str(r[0]));
            d.setBienPlaca(str(r[1]));
            d.setBienNumSerie(str(r[2]));
        } catch (Exception ignored) {}
        return d;
    }
}
