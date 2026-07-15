package com.sisParques.repository;

import com.sisParques.entity.Mantenimiento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MantenimientoRepository extends JpaRepository<Mantenimiento, Integer> {
    List<Mantenimiento> findByMantEstadoNot(String estado);
    List<Mantenimiento> findByParqId(Integer parqId);
}
