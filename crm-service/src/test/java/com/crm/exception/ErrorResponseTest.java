package com.crm.exception;

import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class ErrorResponseTest {

    @Test
    void of_codeAndMessage_createsErrorResponse() {
        ErrorResponse response = ErrorResponse.of("NOT_FOUND", "Resource not found");

        assertThat(response.error().code()).isEqualTo("NOT_FOUND");
        assertThat(response.error().message()).isEqualTo("Resource not found");
        assertThat(response.error().fields()).isNull();
    }

    @Test
    void of_codeMessageAndFields_createsErrorResponseWithFields() {
        Map<String, String> fields = Map.of("email", "must not be blank");
        ErrorResponse response = ErrorResponse.of("VALIDATION_ERROR", "Validation failed", fields);

        assertThat(response.error().code()).isEqualTo("VALIDATION_ERROR");
        assertThat(response.error().message()).isEqualTo("Validation failed");
        assertThat(response.error().fields()).containsEntry("email", "must not be blank");
    }

    @Test
    void errorDetail_twoArgConstructor_hasNullFields() {
        ErrorResponse.ErrorDetail detail = new ErrorResponse.ErrorDetail("CODE", "msg");

        assertThat(detail.fields()).isNull();
    }
}
