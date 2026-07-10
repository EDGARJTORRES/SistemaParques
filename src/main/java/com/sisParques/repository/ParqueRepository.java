package com.sisParques.repository;

import com.sisParques.entity.Parque;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ParqueRepository extends JpaRepository<Parque, Integer> {

    List<Parque> findByParqEstado(String parqEstado);

    boolean existsByParqNombreIgnoreCase(String parqNombre);
}
