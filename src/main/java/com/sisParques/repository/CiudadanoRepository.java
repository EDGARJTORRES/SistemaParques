package com.sisParques.repository;

import com.sisParques.entity.Ciudadano;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CiudadanoRepository extends JpaRepository<Ciudadano, Integer> {

    List<Ciudadano> findByCiudEstado(String ciudEstado);

    Optional<Ciudadano> findByCiudNumeroDocumento(String ciudNumeroDocumento);

    boolean existsByCiudNumeroDocumento(String ciudNumeroDocumento);

    boolean existsByCiudEmailIgnoreCase(String ciudEmail);

    List<Ciudadano> findByCiudNombresContainingIgnoreCaseOrCiudApellidosContainingIgnoreCase(
            String ciudNombres, String ciudApellidos);
}