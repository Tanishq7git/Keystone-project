package com.zidio.keystone.exception;

public class IllegalWorkOrderTransitionException extends RuntimeException {
    public IllegalWorkOrderTransitionException(String message) {
        super(message);
    }
}
