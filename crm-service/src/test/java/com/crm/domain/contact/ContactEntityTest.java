package com.crm.domain.contact;

import org.junit.jupiter.api.Test;

import java.lang.reflect.Method;

import static org.assertj.core.api.Assertions.assertThat;

class ContactEntityTest {

    @Test
    void onCreate_setsTimestamps() throws Exception {
        Contact contact = new Contact();
        Method onCreate = Contact.class.getDeclaredMethod("onCreate");
        onCreate.setAccessible(true);
        onCreate.invoke(contact);

        assertThat(contact.getCreatedAt()).isNotNull();
        assertThat(contact.getUpdatedAt()).isNotNull();
    }

    @Test
    void onUpdate_setsUpdatedAt() throws Exception {
        Contact contact = new Contact();
        Method onUpdate = Contact.class.getDeclaredMethod("onUpdate");
        onUpdate.setAccessible(true);
        onUpdate.invoke(contact);

        assertThat(contact.getUpdatedAt()).isNotNull();
    }

    @Test
    void defaultTags_initializedToEmptySet() {
        Contact contact = new Contact();
        assertThat(contact.getTags()).isNotNull().isEmpty();
    }
}
