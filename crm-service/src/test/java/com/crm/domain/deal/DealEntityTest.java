package com.crm.domain.deal;

import org.junit.jupiter.api.Test;

import java.lang.reflect.Method;
import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class DealEntityTest {

    @Test
    void onCreate_setsTimestampsAndDefaults() throws Exception {
        Deal deal = new Deal();
        Method onCreate = Deal.class.getDeclaredMethod("onCreate");
        onCreate.setAccessible(true);
        onCreate.invoke(deal);

        assertThat(deal.getCreatedAt()).isNotNull();
        assertThat(deal.getUpdatedAt()).isNotNull();
        assertThat(deal.getStage()).isEqualTo(DealStage.LEAD);
        assertThat(deal.getValue()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    void onCreate_withExistingStageAndValue_doesNotOverride() throws Exception {
        Deal deal = new Deal();
        deal.setStage(DealStage.QUALIFIED);
        deal.setValue(new BigDecimal("1000"));
        Method onCreate = Deal.class.getDeclaredMethod("onCreate");
        onCreate.setAccessible(true);
        onCreate.invoke(deal);

        assertThat(deal.getStage()).isEqualTo(DealStage.QUALIFIED);
        assertThat(deal.getValue()).isEqualByComparingTo(new BigDecimal("1000"));
    }

    @Test
    void onUpdate_setsUpdatedAt() throws Exception {
        Deal deal = new Deal();
        Method onUpdate = Deal.class.getDeclaredMethod("onUpdate");
        onUpdate.setAccessible(true);
        onUpdate.invoke(deal);

        assertThat(deal.getUpdatedAt()).isNotNull();
    }
}
