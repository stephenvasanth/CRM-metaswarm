package com.crm.domain.activity;

import org.junit.jupiter.api.Test;

import java.lang.reflect.Method;
import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;

class ActivityEntityTest {

    @Test
    void onCreate_withNullOccurredAt_setsOccurredAtToCreatedAt() throws Exception {
        Activity activity = new Activity();
        Method onCreate = Activity.class.getDeclaredMethod("onCreate");
        onCreate.setAccessible(true);
        onCreate.invoke(activity);

        assertThat(activity.getCreatedAt()).isNotNull();
        assertThat(activity.getOccurredAt()).isEqualTo(activity.getCreatedAt());
    }

    @Test
    void onCreate_withExistingOccurredAt_doesNotOverride() throws Exception {
        Activity activity = new Activity();
        Instant occurredAt = Instant.parse("2026-01-01T10:00:00Z");
        activity.setOccurredAt(occurredAt);
        Method onCreate = Activity.class.getDeclaredMethod("onCreate");
        onCreate.setAccessible(true);
        onCreate.invoke(activity);

        assertThat(activity.getOccurredAt()).isEqualTo(occurredAt);
        assertThat(activity.getCreatedAt()).isNotNull();
    }
}
