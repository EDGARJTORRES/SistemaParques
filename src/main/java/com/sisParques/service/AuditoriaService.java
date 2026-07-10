package com.sisParques.service;

import com.sisParques.entity.Auditoria;
import com.sisParques.repository.AuditoriaRepository;
import com.sisParques.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@Transactional
public class AuditoriaService {

    @Autowired
    private AuditoriaRepository auditoriaRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    /**
     * Guarda un registro de auditoría en la base de datos
     */
    public Auditoria guardarAuditoria(Auditoria auditoria) {
        if (auditoria == null) {
            throw new IllegalArgumentException("El objeto auditoria no puede ser nulo");
        }
        
        // Validar campos obligatorios
        if (auditoria.getIdUsuario() == null) {
            throw new IllegalArgumentException("El ID de usuario es obligatorio");
        }
        if (auditoria.getAccion() == null || auditoria.getAccion().trim().isEmpty()) {
            throw new IllegalArgumentException("La acción es obligatoria");
        }
        if (auditoria.getModulo() == null || auditoria.getModulo().trim().isEmpty()) {
            throw new IllegalArgumentException("El módulo es obligatorio");
        }
        if (auditoria.getDetalle() == null || auditoria.getDetalle().trim().isEmpty()) {
            throw new IllegalArgumentException("El detalle es obligatorio");
        }

        return auditoriaRepository.save(auditoria);
    }

    /**
     * Crea y guarda un registro de auditoría con los datos proporcionados
     */
    public Auditoria crearAuditoria(Integer idUsuario, String accion, String modulo, String detalle) {
        Auditoria auditoria = new Auditoria(idUsuario, accion, modulo, detalle);
        return guardarAuditoria(auditoria);
    }

    /**
     * Obtiene todos los registros de auditoría ordenados por id_log ASC
     */
    @Transactional(readOnly = true)
    public List<Auditoria> obtenerTodosOrdenadosPorIdAsc() {
        return auditoriaRepository.findAllOrderByIdAsc();
    }

    /**
     * Obtiene todos los registros de auditoría con nombres de usuarios
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> obtenerTodosConNombres() {
        return auditoriaRepository.findAllWithUserNames().stream().map(row -> {
            Map<String, Object> map = new java.util.HashMap<>();
            map.put("idLog", row.get("idLog"));
            map.put("idUsuario", row.get("idUsuario"));
            
            // Obtener nombre del usuario
            String nombreUsuario = "Usuario " + row.get("idUsuario");
            try {
                if (row.get("idUsuario") != null) {
                    nombreUsuario = usuarioRepository.findById((Integer) row.get("idUsuario"))
                        .map(usuario -> usuario.getNombres())
                        .orElse("Usuario " + row.get("idUsuario"));
                }
            } catch (Exception e) {
                // Mantener valor por defecto si hay error
            }
            
            map.put("nombreUsuario", nombreUsuario);
            map.put("accion", row.get("accion"));
            map.put("modulo", row.get("modulo"));
            map.put("detalle", row.get("detalle"));
            map.put("fechaHora", row.get("fechaHora"));
            return map;
        }).collect(java.util.stream.Collectors.toList());
    }

    /**
     * Obtiene todos los registros de auditoría
     */
    @Transactional(readOnly = true)
    public List<Auditoria> obtenerTodos() {
        return auditoriaRepository.findAll();
    }

    /**
     * Obtiene un registro de auditoría por su ID
     */
    @Transactional(readOnly = true)
    public Optional<Auditoria> obtenerPorId(Long id) {
        return auditoriaRepository.findById(id);
    }

    /**
     * Obtiene registros de auditoría por ID de usuario
     */
    @Transactional(readOnly = true)
    public List<Auditoria> obtenerPorIdUsuario(Integer idUsuario) {
        return auditoriaRepository.findByIdUsuarioOrderByFechaHoraDesc(idUsuario);
    }

    /**
     * Obtiene registros de auditoría por módulo
     */
    @Transactional(readOnly = true)
    public List<Auditoria> obtenerPorModulo(String modulo) {
        return auditoriaRepository.findByModuloOrderByFechaHoraDesc(modulo);
    }

    /**
     * Obtiene registros de auditoría por acción
     */
    @Transactional(readOnly = true)
    public List<Auditoria> obtenerPorAccion(String accion) {
        return auditoriaRepository.findByAccionOrderByFechaHoraDesc(accion);
    }

    /**
     * Obtiene registros de auditoría en un rango de fechas
     */
    @Transactional(readOnly = true)
    public List<Auditoria> obtenerPorRangoFechas(LocalDateTime fechaInicio, LocalDateTime fechaFin) {
        return auditoriaRepository.findByFechaHoraBetweenOrderByFechaHoraDesc(fechaInicio, fechaFin);
    }

    /**
     * Obtiene los registros más recientes (limitado a un número específico)
     */
    @Transactional(readOnly = true)
    public List<Auditoria> obtenerRecientes(int limite) {
        Pageable pageable = PageRequest.of(0, limite);
        return auditoriaRepository.findTopNByOrderByFechaHoraDesc(pageable);
    }

    /**
     * Cuenta el número de registros por usuario
     */
    @Transactional(readOnly = true)
    public Long contarPorIdUsuario(Integer idUsuario) {
        return auditoriaRepository.countByIdUsuario(idUsuario);
    }

    /**
     * Cuenta el número de registros por módulo
     */
    @Transactional(readOnly = true)
    public Long contarPorModulo(String modulo) {
        return auditoriaRepository.countByModulo(modulo);
    }

    /**
     * Elimina un registro de auditoría por su ID
     */
    public boolean eliminarPorId(Long id) {
        if (auditoriaRepository.existsById(id)) {
            auditoriaRepository.deleteById(id);
            return true;
        }
        return false;
    }

    /**
     * Limpia registros antiguos (más antiguos que la fecha especificada)
     */
    public int limpiarRegistrosAntiguos(LocalDateTime fechaLimite) {
        List<Auditoria> registrosAntiguos = auditoriaRepository.findByFechaHoraBetweenOrderByFechaHoraDesc(
            LocalDateTime.of(1900, 1, 1, 0, 0), fechaLimite
        );
        
        auditoriaRepository.deleteAll(registrosAntiguos);
        return registrosAntiguos.size();
    }
}
