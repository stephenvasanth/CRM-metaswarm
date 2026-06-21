package com.crm.domain.task;

import org.junit.jupiter.api.Test;

import java.lang.reflect.Method;

import static org.assertj.core.api.Assertions.assertThat;

class TaskEntityTest {

    @Test
    void onCreate_setsTimestamps() throws Exception {
        Task task = new Task();
        Method onCreate = Task.class.getDeclaredMethod("onCreate");
        onCreate.setAccessible(true);
        onCreate.invoke(task);

        assertThat(task.getCreatedAt()).isNotNull();
        assertThat(task.getUpdatedAt()).isNotNull();
    }

    @Test
    void onUpdate_setsUpdatedAt() throws Exception {
        Task task = new Task();
        Method onUpdate = Task.class.getDeclaredMethod("onUpdate");
        onUpdate.setAccessible(true);
        onUpdate.invoke(task);

        assertThat(task.getUpdatedAt()).isNotNull();
    }
}
