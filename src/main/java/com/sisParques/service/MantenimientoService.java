package com.sisParques.service;

import com.sisParques.dto.MantenimientoDTO;
import com.sisParques.dto.ObreroDTO;
import com.sisParques.entity.Mantenimiento;
import com.sisParques.entity.MantenimientoObrero;
import com.sisParques.repository.MantenimientoObreroRepository;
import com.sisParques.repository.MantenimientoRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Servicio para la gestión de actividades de mantenimiento de parques.
 * Proporciona catálogos de supervisores, obreros, tipos de mantenimiento, parques e incidencias.
 * Permite crear, actualizar, consultar y cambiar el estado de mantenimientos,
 * así como asignar obreros a las actividades de mantenimiento.
 */
@Service
public class MantenimientoService {

    private final MantenimientoRepository      mantRepo;
    private final MantenimientoObreroRepository mantObrRepo;

    @PersistenceContext
    private EntityManager em;

    public MantenimientoService(MantenimientoRepository mantRepo,
                                 MantenimientoObreroRepository mantObrRepo) {
        this.mantRepo    = mantRepo;
        this.mantObrRepo = mantObrRepo;
    }

    // ── Catálogos ─────────────────────────────────────────────────────────────

    /** Supervisores: usuarios con rol 'supervisor' (id_rol = 3) */
    public List<java.util.Map<String, Object>> getSupervisores() {
        String sql =
            "SELECT u.id_usuario, u.nombres, u.email " +
            "FROM sc_sistema.usuarios u " +
            "JOIN sc_sistema.roles r ON r.id_rol = u.id_rol " +
            "WHERE LOWER(r.nombre_rol) = 'supervisor' AND u.activo = true " +
            "ORDER BY u.nombres";
        @SuppressWarnings("unchecked")
        List<Object[]> rows = em.createNativeQuery(sql).getResultList();
        return rows.stream().map(r -> {
            java.util.Map<String, Object> m = new java.util.LinkedHashMap<>();
            m.put("idUsuario", r[0]);
            m.put("nombres",   r[1]);
            m.put("email",     r[2]);
            return m;
        }).collect(Collectors.toList());
    }

    /** Obreros registrados en tb_obrero con datos de persona */
    public List<ObreroDTO> getObreros() {
        String sql =
            "SELECT o.obr_id, o.pers_id, o.obr_estado, " +
            "  p.pers_nombre, p.pers_apelpat, p.pers_apelmat, p.pers_dni, p.pers_celu01 " +
            "FROM sc_sistema.tb_obrero o " +
            "JOIN sc_escalafon.tb_persona p ON p.pers_id = o.pers_id " +
            "WHERE o.obr_estado = 'A' " +
            "ORDER BY o.obr_id";
        @SuppressWarnings("unchecked")
        List<Object[]> rows = em.createNativeQuery(sql).getResultList();
        return rows.stream().map(r -> {
            ObreroDTO d = new ObreroDTO();
            d.setObrId(toInt(r[0]));
            d.setPersId(toInt(r[1]));
            d.setObrEstado(str(r[2]));
            d.setPersNombre(str(r[3]));
            d.setPersApelPat(str(r[4]));
            d.setPersApelMat(str(r[5]));
            d.setPersDni(str(r[6]));
            d.setPersCelu01(str(r[7]));
            d.setNombreCompleto((str(r[4]) + " " + str(r[5]) + " " + str(r[3])).trim());
            return d;
        }).collect(Collectors.toList());
    }

    /** Tipos de mantenimiento activos */
    public List<java.util.Map<String, Object>> getTiposMantenimiento() {
        String sql =
            "SELECT tima_id, tima_nombre, tima_descrip " +
            "FROM sc_sistema.tb_tipo_mantenimiento " +
            "WHERE tima_estado = 'A' ORDER BY tima_nombre";
        @SuppressWarnings("unchecked")
        List<Object[]> rows = em.createNativeQuery(sql).getResultList();
        return rows.stream().map(r -> {
            java.util.Map<String, Object> m = new java.util.LinkedHashMap<>();
            m.put("timaId",     r[0]);
            m.put("timaNombre", r[1]);
            m.put("timaDescrip",r[2]);
            return m;
        }).collect(Collectors.toList());
    }

    /** Parques activos */
    public List<java.util.Map<String, Object>> getParques() {
        String sql =
            "SELECT parq_id, parq_nombre, parq_direccion " +
            "FROM sc_sistema.tb_parque " +
            "WHERE parq_estado = 'A' ORDER BY parq_nombre";
        @SuppressWarnings("unchecked")
        List<Object[]> rows = em.createNativeQuery(sql).getResultList();
        return rows.stream().map(r -> {
            java.util.Map<String, Object> m = new java.util.LinkedHashMap<>();
            m.put("parqId",       r[0]);
            m.put("parqNombre",   r[1]);
            m.put("parqDireccion",r[2]);
            return m;
        }).collect(Collectors.toList());
    }

    /** Incidencias EN PROGRESO para asociar al mantenimiento */
    public List<java.util.Map<String, Object>> getIncidenciasEnProgreso() {
        String sql =
            "SELECT inci_id, inci_titulo, inci_descripcion, inci_prioridad " +
            "FROM sc_sistema.tb_incidencia " +
            "WHERE UPPER(inci_estado) IN ('EN_PROCESO') " +
            "ORDER BY inci_fech_crea DESC";
        @SuppressWarnings("unchecked")
        List<Object[]> rows = em.createNativeQuery(sql).getResultList();
        return rows.stream().map(r -> {
            java.util.Map<String, Object> m = new java.util.LinkedHashMap<>();
            m.put("inciId",          r[0]);
            m.put("inciTitulo",      r[1]);
            m.put("inciDescripcion", r[2]);
            m.put("inciPrioridad",   r[3]);
            return m;
        }).collect(Collectors.toList());
    }

    // ── CRUD Mantenimiento ────────────────────────────────────────────────────

    /** Obtiene la lista completa de todos los mantenimientos */
    public List<MantenimientoDTO> getAll() {
        return mantRepo.findAll().stream().map(this::toDTO).collect(Collectors.toList());
    }

    /** Obtiene un mantenimiento específico por su ID */
    public MantenimientoDTO getById(Integer id) {
        return toDTO(mantRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Mantenimiento no encontrado: " + id)));
    }

    /** Crea un nuevo mantenimiento y asigna los obreros especificados */
    @Transactional
    public MantenimientoDTO create(MantenimientoDTO dto) {
        Mantenimiento m = new Mantenimiento();
        mapToEntity(dto, m);
        Mantenimiento saved = mantRepo.save(m);
        saveObreros(saved.getMantId(), dto.getObreroIds());
        return toDTO(saved);
    }

    /** Actualiza un mantenimiento existente y reemplaza los obreros asignados si se especifican */
    @Transactional
    public MantenimientoDTO update(Integer id, MantenimientoDTO dto) {
        Mantenimiento m = mantRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Mantenimiento no encontrado: " + id));
        mapToEntity(dto, m);
        Mantenimiento saved = mantRepo.save(m);
        if (dto.getObreroIds() != null) {
            mantObrRepo.deleteByMantId(id);
            saveObreros(id, dto.getObreroIds());
        }
        return toDTO(saved);
    }

    /** Cambia el estado de un mantenimiento (ej: PENDIENTE, EN_PROCESO, COMPLETADO) */
    @Transactional
    public void cambiarEstado(Integer id, String estado) {
        Mantenimiento m = mantRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Mantenimiento no encontrado: " + id));
        m.setMantEstado(estado);
        mantRepo.save(m);
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private void saveObreros(Integer mantId, List<Integer> obreroIds) {
        if (obreroIds == null || obreroIds.isEmpty()) return;
        for (Integer obrId : obreroIds) {
            MantenimientoObrero mo = new MantenimientoObrero();
            mo.setMantId(mantId);
            mo.setObrId(obrId);
            mo.setMantObrEstado("A");
            mantObrRepo.save(mo);
        }
    }

    private MantenimientoDTO toDTO(Mantenimiento m) {
        MantenimientoDTO dto = new MantenimientoDTO();
        dto.setMantId(m.getMantId());
        dto.setMantTitulo(m.getMantTitulo());
        dto.setMantFechaIni(m.getMantFechaIni());
        dto.setMantFechaFin(m.getMantFechaFin());
        dto.setMantObservacion(m.getMantObservacion());
        dto.setPersResponsable(m.getPersResponsable());
        dto.setMantDoc(m.getMantDoc());
        dto.setMantFechaCrea(m.getMantFechaCrea());
        dto.setMantEstado(m.getMantEstado());
        dto.setParqId(m.getParqId());
        dto.setPersId(m.getPersId());
        dto.setMantFotoAntes(m.getMantFotoAntes());
        dto.setMantFotoDespues(m.getMantFotoDespues());
        dto.setIdUsuario(m.getIdUsuario());
        dto.setTimaIds(m.getTimaIds());
        dto.setInciId(m.getInciId());

        // Nombre responsable
        if (m.getPersResponsable() != null) {
            try {

                Object row = em.createNativeQuery(
                    "SELECT nombres " +
                    "FROM sc_sistema.usuarios " +
                    "WHERE id_usuario = " + m.getPersResponsable()
                ).getSingleResult();

                dto.setResponsableNombre(str(row));

            } catch (Exception e) {
                System.out.println("Error responsable: " + e.getMessage());
            }
        }

        // Nombre parque
        if (m.getParqId() != null) {
            try {
                Object row = em.createNativeQuery(
                    "SELECT parq_nombre FROM sc_sistema.tb_parque WHERE parq_id = " + m.getParqId()
                ).getSingleResult();
                dto.setParqNombre(str(row));
            } catch (Exception ignored) {}
        }

        // Nombres de tipos de mantenimiento
        if (m.getTimaIds() != null && m.getTimaIds().length > 0) {
            List<String> nombres = new ArrayList<>();
            for (Integer timaId : m.getTimaIds()) {
                try {
                    Object row = em.createNativeQuery(
                        "SELECT tima_nombre FROM sc_sistema.tb_tipo_mantenimiento WHERE tima_id = " + timaId
                    ).getSingleResult();
                    nombres.add(str(row));
                } catch (Exception ignored) {}
            }
            dto.setTimaNombres(nombres);
        }

        // Nombre incidencia
        if (m.getInciId() != null) {
            try {
                Object row = em.createNativeQuery(
                    "SELECT inci_titulo FROM sc_sistema.tb_incidencia WHERE inci_id = " + m.getInciId()
                ).getSingleResult();
                dto.setInciTitulo(str(row));
            } catch (Exception ignored) {}
        }

        // Obreros asignados
        List<MantenimientoObrero> mos = mantObrRepo.findByMantId(m.getMantId());
        List<Integer> obrIds = mos.stream().map(MantenimientoObrero::getObrId).collect(Collectors.toList());
        dto.setObreroIds(obrIds);

        List<ObreroDTO> obrs = new ArrayList<>();
        for (Integer obrId : obrIds) {
            try {
                @SuppressWarnings("unchecked")
                Object[] r = (Object[]) em.createNativeQuery(
                    "SELECT o.obr_id, o.pers_id, p.pers_nombre, p.pers_apelpat, p.pers_apelmat, p.pers_dni " +
                    "FROM sc_sistema.tb_obrero o " +
                    "JOIN sc_escalafon.tb_persona p ON p.pers_id = o.pers_id " +
                    "WHERE o.obr_id = " + obrId
                ).getSingleResult();
                ObreroDTO od = new ObreroDTO();
                od.setObrId(toInt(r[0]));
                od.setPersId(toInt(r[1]));
                od.setPersNombre(str(r[2]));
                od.setPersApelPat(str(r[3]));
                od.setPersApelMat(str(r[4]));
                od.setPersDni(str(r[5]));
                od.setNombreCompleto((str(r[3]) + " " + str(r[4]) + " " + str(r[2])).trim());
                obrs.add(od);
            } catch (Exception ignored) {}
        }
        dto.setObreros(obrs);

        return dto;
    }

    private void mapToEntity(MantenimientoDTO dto, Mantenimiento m) {
        if (dto.getMantTitulo()      != null) m.setMantTitulo(dto.getMantTitulo());
        if (dto.getMantFechaIni()    != null) m.setMantFechaIni(dto.getMantFechaIni());
        if (dto.getMantFechaFin()    != null) m.setMantFechaFin(dto.getMantFechaFin());
        if (dto.getMantObservacion() != null) m.setMantObservacion(dto.getMantObservacion());
        if (dto.getPersResponsable() != null) m.setPersResponsable(dto.getPersResponsable());
        if (dto.getMantDoc()         != null) m.setMantDoc(dto.getMantDoc());
        if (dto.getMantEstado()      != null) m.setMantEstado(dto.getMantEstado());
        if (dto.getParqId()          != null) m.setParqId(dto.getParqId());
        if (dto.getPersId()          != null) m.setPersId(dto.getPersId());
        if (dto.getMantFotoAntes()   != null) m.setMantFotoAntes(dto.getMantFotoAntes());
        if (dto.getMantFotoDespues() != null) m.setMantFotoDespues(dto.getMantFotoDespues());
        if (dto.getIdUsuario()       != null) m.setIdUsuario(dto.getIdUsuario());
        if (dto.getTimaIds()         != null) m.setTimaIds(dto.getTimaIds());
        m.setInciId(dto.getInciId()); // puede ser null
    }

    private static String str(Object o)  { return o == null ? "" : o.toString(); }
    private static Integer toInt(Object o){ return o == null ? null : ((Number) o).intValue(); }
}
