package com.sisParques.repository;

import com.sisParques.entity.ParqueServicio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ParqueServicioRepository extends JpaRepository<ParqueServicio, Integer> {

    List<ParqueServicio> findByParqueParqId(Integer parqId);

    List<ParqueServicio> findByParqueParqIdAndPaseEstado(Integer parqId, String paseEstado);
    
    List<ParqueServicio> findByPaseEstado(String paseEstado);

    boolean existsByParqueParqIdAndServicioServId(
            Integer parqId,
            Integer servId
    );
}