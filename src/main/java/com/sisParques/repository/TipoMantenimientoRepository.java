package com.sisParques.repository;

import com.sisParques.entity.TipoMantenimiento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TipoMantenimientoRepository extends JpaRepository<TipoMantenimiento, Integer> {

    List<TipoMantenimiento> findByTimaEstado(String timaEstado);

    boolean existsByTimaNombreIgnoreCase(String timaNombre);
}