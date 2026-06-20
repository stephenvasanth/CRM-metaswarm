package com.crm.exception;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.Map;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ErrorResponse(ErrorDetail error) {

    public record ErrorDetail(String code, String message, Map<String, String> fields) {

        public ErrorDetail(String code, String message) {
            this(code, message, null);
        }
    }

    public static ErrorResponse of(String code, String message) {
        return new ErrorResponse(new ErrorDetail(code, message));
    }

    public static ErrorResponse of(String code, String message, Map<String, String> fields) {
        return new ErrorResponse(new ErrorDetail(code, message, fields));
    }
}
