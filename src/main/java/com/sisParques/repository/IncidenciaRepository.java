package com.sisParques.repository;

import com.sisParques.entity.Incidencia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IncidenciaRepository extends JpaRepository<Incidencia, Integer> {

    List<Incidencia> findByInciEstado(String inciEstado);

    List<Incidencia> findByInciPrioridad(String inciPrioridad);

    List<Incidencia> findByCiudadanoCiudId(Integer ciudId);

    List<Incidencia> findByIdUsuario(Integer idUsuario);

    List<Incidencia> findByInciEstadoAndInciPrioridad(String inciEstado, String inciPrioridad);
}