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

    // ── REPORTES ──────────────────────────────────────────────────────────────

    /**
     * Generar reporte de mantenimiento incompleto
     * Obtiene mantenimientos vencidos, atrasados o con progreso incompleto
     */
    public List<java.util.Map<String, Object>> getReporteIncompletos() {
        String sql = 
            "WITH mantenimientos_con_estado AS (" +
            "  SELECT m.mant_id, m.mant_titulo, m.mant_fecha_ini, m.mant_fecha_fin, " +
            "         m.mant_estado, p.parq_nombre, u.nombres as responsable_nombre, " +
            "         CASE " +
            "           WHEN m.mant_fecha_fin < CURRENT_DATE AND m.mant_estado NOT IN ('COMPLETADO', 'CANCELADO') " +
            "           THEN 'VENCIDO' " +
            "           WHEN m.mant_estado = 'PENDIENTE' AND m.mant_fecha_ini < CURRENT_DATE " +
            "           THEN 'ATRASADO' " +
            "           ELSE m.mant_estado " +
            "         END as estado_real, " +
            "         CASE " +
            "           WHEN m.mant_fecha_fin < CURRENT_DATE " +
            "           THEN CURRENT_DATE - m.mant_fecha_fin " +
            "           ELSE 0 " +
            "         END as dias_vencido " +
            "  FROM sc_sistema.tb_mantenimiento m " +
            "  LEFT JOIN sc_sistema.tb_parque p ON p.parq_id = m.parq_id " +
            "  LEFT JOIN sc_sistema.usuarios u ON u.id_usuario = m.pers_responsable " +
            "  WHERE m.mant_estado NOT IN ('COMPLETADO', 'CANCELADO') " +
            ") " +
            "SELECT * FROM mantenimientos_con_estado " +
            "WHERE estado_real IN ('VENCIDO', 'ATRASADO', 'PENDIENTE', 'EN_PROGRESO') " +
            "ORDER BY dias_vencido DESC, mant_fecha_fin ASC";

        @SuppressWarnings("unchecked")
        List<Object[]> rows = em.createNativeQuery(sql).getResultList();
        
        return rows.stream().map(r -> {
            java.util.Map<String, Object> m = new java.util.LinkedHashMap<>();
            m.put("mantId", r[0]);
            m.put("mantTitulo", str(r[1]));
            m.put("mantFechaIni", r[2]);
            m.put("mantFechaFin", r[3]);
            m.put("mantEstado", str(r[4]));
            m.put("parqNombre", str(r[5]));
            m.put("responsableNombre", str(r[6]));
            m.put("estadoReal", str(r[7]));
            m.put("diasVencido", toInt(r[8]));
            return m;
        }).collect(Collectors.toList());
    }

    /**
     * Generar reporte de mantenimiento completado
     * Obtiene estadísticas de mantenimientos completados por período
     */
    public java.util.Map<String, Object> getReporteCompletados(String fechaInicio, String fechaFin) {
        // Mantenimientos completados en el período
        String sqlCompletados = 
            "SELECT m.mant_id, m.mant_titulo, m.mant_fecha_ini, m.mant_fecha_fin, " +
            "       p.parq_nombre, u.nombres as responsable_nombre, " +
            "       (m.mant_fecha_fin - m.mant_fecha_ini) as duracion_dias " +
            "FROM sc_sistema.tb_mantenimiento m " +
            "LEFT JOIN sc_sistema.tb_parque p ON p.parq_id = m.parq_id " +
            "LEFT JOIN sc_sistema.usuarios u ON u.id_usuario = m.pers_responsable " +
            "WHERE m.mant_estado = 'COMPLETADO' ";
        
        if (fechaInicio != null && fechaFin != null) {
            sqlCompletados += "AND DATE(m.mant_fecha_crea) BETWEEN '" + fechaInicio + "' AND '" + fechaFin + "' ";
        }
        sqlCompletados += "ORDER BY m.mant_fecha_fin DESC";

        @SuppressWarnings("unchecked")
        List<Object[]> completados = em.createNativeQuery(sqlCompletados).getResultList();

        // Estadísticas generales
        String sqlEstadisticas = 
            "SELECT " +
            "  COUNT(*) as total_completados, " +
            "  AVG(EXTRACT(EPOCH FROM (m.mant_fecha_fin - m.mant_fecha_ini))/86400) as duracion_promedio, " +
            "  COUNT(CASE WHEN m.mant_fecha_fin <= m.mant_fecha_fin THEN 1 END) as completados_a_tiempo, " +
            "  COUNT(CASE WHEN m.mant_fecha_fin > m.mant_fecha_ini THEN 1 END) as completados_tarde " +
            "FROM sc_sistema.tb_mantenimiento m " +
            "WHERE m.mant_estado = 'COMPLETADO' ";
        
        if (fechaInicio != null && fechaFin != null) {
            sqlEstadisticas += "AND DATE(m.mant_fecha_crea) BETWEEN '" + fechaInicio + "' AND '" + fechaFin + "'";
        }

        Object[] stats = (Object[]) em.createNativeQuery(sqlEstadisticas).getSingleResult();

        java.util.Map<String, Object> reporte = new java.util.LinkedHashMap<>();
        reporte.put("fechaInicio", fechaInicio);
        reporte.put("fechaFin", fechaFin);
        reporte.put("totalCompletados", toInt(stats[0]));
        reporte.put("duracionPromedio", stats[1]);
        reporte.put("completadosATiempo", toInt(stats[2]));
        reporte.put("completadosTarde", toInt(stats[3]));
        
        reporte.put("mantenimientos", completados.stream().map(r -> {
            java.util.Map<String, Object> m = new java.util.LinkedHashMap<>();
            m.put("mantId", r[0]);
            m.put("mantTitulo", str(r[1]));
            m.put("mantFechaIni", r[2]);
            m.put("mantFechaFin", r[3]);
            m.put("parqNombre", str(r[4]));
            m.put("responsableNombre", str(r[5]));
            m.put("duracionDias", r[6]);
            return m;
        }).collect(Collectors.toList()));

        return reporte;
    }

    /**
     * Programar tareas de mantenimiento masivamente
     * Permite crear múltiples mantenimientos con plantilla base
     */
    @Transactional
    public List<MantenimientoDTO> programarTareas(java.util.Map<String, Object> programacion) {
        List<Integer> parqueIds = (List<Integer>) programacion.get("parqueIds");
        List<Integer> tipoIds = (List<Integer>) programacion.get("tipoIds");
        String fechaInicio = (String) programacion.get("fechaInicio");
        Integer diasDuracion = (Integer) programacion.get("diasDuracion");
        Integer responsableId = (Integer) programacion.get("responsableId");
        String tituloTemplate = (String) programacion.get("tituloTemplate");
        Integer usuarioId = (Integer) programacion.get("usuarioId");

        List<MantenimientoDTO> creados = new ArrayList<>();

        for (Integer parqueId : parqueIds) {
            // Obtener nombre del parque para el título
            String nombreParque = "";
            try {
                Object row = em.createNativeQuery(
                    "SELECT parq_nombre FROM sc_sistema.tb_parque WHERE parq_id = " + parqueId
                ).getSingleResult();
                nombreParque = str(row);
            } catch (Exception ignored) {}

            // Crear mantenimiento programado
            Mantenimiento m = new Mantenimiento();
            m.setMantTitulo(tituloTemplate.replace("{parque}", nombreParque));
            m.setMantFechaIni(java.time.LocalDate.parse(fechaInicio));
            m.setMantFechaFin(java.time.LocalDate.parse(fechaInicio).plusDays(diasDuracion));
            m.setParqId(parqueId);
            m.setPersResponsable(responsableId);
            m.setMantEstado("PENDIENTE");
            m.setIdUsuario(usuarioId);
            m.setTimaIds(tipoIds.toArray(new Integer[0]));
            m.setMantObservacion("Mantenimiento programado automáticamente");

            Mantenimiento saved = mantRepo.save(m);
            creados.add(toDTO(saved));
        }

        return creados;
    }

    private static String str(Object o)  { return o == null ? "" : o.toString(); }
    private static Integer toInt(Object o){ return o == null ? null : ((Number) o).intValue(); }
}
