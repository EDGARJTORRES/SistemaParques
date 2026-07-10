package com.sisParques.repository;

import com.sisParques.entity.Auditoria;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Repository
public interface AuditoriaRepository extends JpaRepository<Auditoria, Long> {

    // Find all auditoria records ordered by id_log ASC
    @Query("SELECT a FROM Auditoria a ORDER BY a.idLog ASC")
    List<Auditoria> findAllOrderByIdAsc();

    // Find all auditoria records with user names
    @Query("SELECT a.idLog as idLog, a.idUsuario as idUsuario, a.accion as accion, " +
           "a.modulo as modulo, a.detalle as detalle, a.fechaHora as fechaHora " +
           "FROM Auditoria a ORDER BY a.idLog ASC")
    List<Map<String, Object>> findAllWithUserNames();

    // Find by user ID
    @Query("SELECT a FROM Auditoria a WHERE a.idUsuario = :idUsuario ORDER BY a.fechaHora DESC")
    List<Auditoria> findByIdUsuarioOrderByFechaHoraDesc(@Param("idUsuario") Integer idUsuario);

    // Find by module
    @Query("SELECT a FROM Auditoria a WHERE a.modulo = :modulo ORDER BY a.fechaHora DESC")
    List<Auditoria> findByModuloOrderByFechaHoraDesc(@Param("modulo") String modulo);

    // Find by action
    @Query("SELECT a FROM Auditoria a WHERE a.accion = :accion ORDER BY a.fechaHora DESC")
    List<Auditoria> findByAccionOrderByFechaHoraDesc(@Param("accion") String accion);

    // Find by date range
    @Query("SELECT a FROM Auditoria a WHERE a.fechaHora BETWEEN :fechaInicio AND :fechaFin ORDER BY a.fechaHora DESC")
    List<Auditoria> findByFechaHoraBetweenOrderByFechaHoraDesc(
            @Param("fechaInicio") LocalDateTime fechaInicio,
            @Param("fechaFin") LocalDateTime fechaFin
    );

    // Find by user and module
    @Query("SELECT a FROM Auditoria a WHERE a.idUsuario = :idUsuario AND a.modulo = :modulo ORDER BY a.fechaHora DESC")
    List<Auditoria> findByIdUsuarioAndModuloOrderByFechaHoraDesc(
            @Param("idUsuario") Integer idUsuario,
            @Param("modulo") String modulo
    );

    // Count by user
    @Query("SELECT COUNT(a) FROM Auditoria a WHERE a.idUsuario = :idUsuario")
    Long countByIdUsuario(@Param("idUsuario") Integer idUsuario);

    // Count by module
    @Query("SELECT COUNT(a) FROM Auditoria a WHERE a.modulo = :modulo")
    Long countByModulo(@Param("modulo") String modulo);

    // Find recent records (last N records)
    @Query("SELECT a FROM Auditoria a ORDER BY a.fechaHora DESC")
    List<Auditoria> findTopNByOrderByFechaHoraDesc(org.springframework.data.domain.Pageable pageable);
}
