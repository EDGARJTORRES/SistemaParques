package com.sisParques.repository;

import com.sisParques.entity.MantTipoProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;

public interface MantTipoProgressRepository extends JpaRepository<MantTipoProgress, Integer> {

    List<MantTipoProgress> findByMantId(Integer mantId);

    Optional<MantTipoProgress> findByMantIdAndTimaId(Integer mantId, Integer timaId);

    @Modifying
    @Transactional
    @Query("DELETE FROM MantTipoProgress m WHERE m.mantId = :mantId")
    void deleteByMantId(Integer mantId);
}
