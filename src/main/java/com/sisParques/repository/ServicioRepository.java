package com.sisParques.repository;

import com.sisParques.entity.Servicio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ServicioRepository extends JpaRepository<Servicio, Integer> {

    List<Servicio> findByServEstado(String servEstado);

    boolean existsByServNombreIgnoreCase(String servNombre);
}
