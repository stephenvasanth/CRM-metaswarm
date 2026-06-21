package com.crm.domain.tag;

import org.junit.jupiter.api.Test;

import java.lang.reflect.Method;

import static org.assertj.core.api.Assertions.assertThat;

class TagEntityTest {

    @Test
    void onCreate_setsCreatedAtAndDefaultColour() throws Exception {
        Tag tag = new Tag();
        tag.setName("VIP");
        Method onCreate = Tag.class.getDeclaredMethod("onCreate");
        onCreate.setAccessible(true);
        onCreate.invoke(tag);

        assertThat(tag.getCreatedAt()).isNotNull();
        assertThat(tag.getColour()).isEqualTo("#6366F1");
    }

    @Test
    void onCreate_withExistingColour_doesNotOverrideColour() throws Exception {
        Tag tag = new Tag();
        tag.setName("VIP");
        tag.setColour("#FF5733");
        Method onCreate = Tag.class.getDeclaredMethod("onCreate");
        onCreate.setAccessible(true);
        onCreate.invoke(tag);

        assertThat(tag.getColour()).isEqualTo("#FF5733");
    }
}
