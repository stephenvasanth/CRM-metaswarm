package com.crm.exception;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ResourceNotFoundExceptionTest {

    @Test
    void constructor_withMessage_setsMessage() {
        ResourceNotFoundException ex = new ResourceNotFoundException("Contact not found");
        assertThat(ex.getMessage()).isEqualTo("Contact not found");
    }

    @Test
    void constructor_withTypeAndId_formatsMessage() {
        ResourceNotFoundException ex = new ResourceNotFoundException("Contact", 42L);
        assertThat(ex.getMessage()).isEqualTo("Contact not found with id: 42");
    }
}
