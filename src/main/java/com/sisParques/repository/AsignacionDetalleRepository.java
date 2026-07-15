package com.sisParques.repository;

import com.sisParques.entity.AsignacionDetalle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AsignacionDetalleRepository extends JpaRepository<AsignacionDetalle, Long> {
    List<AsignacionDetalle> findByAsignacion_AsigId(Long asigId);
}
