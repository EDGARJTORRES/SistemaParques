package com.sisParques.repository;

import com.sisParques.entity.Asignacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AsignacionRepository extends JpaRepository<Asignacion, Long> {

    List<Asignacion> findByAsigEstado(String estado);

    @Query("SELECT a FROM Asignacion a WHERE a.obrId = :obrId ORDER BY a.asigFecha DESC")
    List<Asignacion> findByObrId(Long obrId);
}
