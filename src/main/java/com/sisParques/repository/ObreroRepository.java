package com.sisParques.repository;

import com.sisParques.entity.Obrero;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ObreroRepository extends JpaRepository<Obrero, Integer> {

    Optional<Obrero> findByPersId(Integer persId);

    List<Obrero> findByObrEstado(String estado);

    boolean existsByPersId(Integer persId);
}
