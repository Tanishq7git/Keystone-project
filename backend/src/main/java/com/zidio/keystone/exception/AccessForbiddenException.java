package com.zidio.keystone.exception;

/** Thrown when an authenticated user tries to act outside the scope their role permits. */
public class AccessForbiddenException extends RuntimeException {
    public AccessForbiddenException(String message) {
        super(message);
    }
}
