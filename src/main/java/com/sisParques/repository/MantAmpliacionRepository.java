package com.sisParques.repository;

import com.sisParques.entity.MantAmpliacion;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MantAmpliacionRepository extends JpaRepository<MantAmpliacion, Integer> {

    List<MantAmpliacion> findByMantIdOrderByAmplFechaCreaDesc(Integer mantId);

    List<MantAmpliacion> findByAmplEstadoOrderByAmplFechaCreaDesc(String estado);
}
