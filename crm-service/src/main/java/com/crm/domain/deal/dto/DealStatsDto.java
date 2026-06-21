package com.crm.domain.deal.dto;

import com.crm.domain.deal.DealStage;

import java.math.BigDecimal;
import java.util.List;

public record DealStatsDto(List<StageStats> stages) {

    public record StageStats(DealStage stage, long count, BigDecimal totalValue) {
    }
}
