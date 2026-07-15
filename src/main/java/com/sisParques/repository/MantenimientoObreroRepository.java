package com.sisParques.repository;

import com.sisParques.entity.MantenimientoObrero;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MantenimientoObreroRepository extends JpaRepository<MantenimientoObrero, Integer> {
    List<MantenimientoObrero> findByMantId(Integer mantId);
    void deleteByMantId(Integer mantId);
}
