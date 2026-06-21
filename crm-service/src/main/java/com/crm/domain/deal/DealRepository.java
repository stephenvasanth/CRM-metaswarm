package com.crm.domain.deal;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface DealRepository extends JpaRepository<Deal, Long> {

    List<Deal> findByStage(DealStage stage);

    @Query("SELECT d.stage as stage, COUNT(d) as count, COALESCE(SUM(d.value), 0) as totalValue " +
           "FROM Deal d GROUP BY d.stage")
    List<Object[]> getStatsByStage();
}
