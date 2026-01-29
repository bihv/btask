/**
 * Plugin SDK Error Classes
 * Provides structured error handling for plugin development
 */

export enum PluginErrorCode {
  // Initialization errors
  NOT_INITIALIZED = 'NOT_INITIALIZED',
  INITIALIZATION_FAILED = 'INITIALIZATION_FAILED',
  CONTEXT_UNAVAILABLE = 'CONTEXT_UNAVAILABLE',

  // Permission errors
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  MISSING_PERMISSION = 'MISSING_PERMISSION',
  MISSING_CAPABILITY = 'MISSING_CAPABILITY',

  // Data errors
  DATA_NOT_FOUND = 'DATA_NOT_FOUND',
  DATA_SAVE_FAILED = 'DATA_SAVE_FAILED',
  DATA_LOAD_FAILED = 'DATA_LOAD_FAILED',
  DATA_DELETE_FAILED = 'DATA_DELETE_FAILED',

  // API errors
  API_ERROR = 'API_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  INVALID_REQUEST = 'INVALID_REQUEST',

  // Hook errors
  HOOK_NOT_FOUND = 'HOOK_NOT_FOUND',
  HOOK_EXECUTION_FAILED = 'HOOK_EXECUTION_FAILED',

  // Unknown
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export class PluginError extends Error {
  public readonly code: PluginErrorCode;
  public readonly details?: any;
  public readonly timestamp: Date;

  constructor(
    code: PluginErrorCode,
    message: string,
    details?: any
  ) {
    super(message);
    this.name = 'PluginError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date();

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, PluginError);
    }
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp,
      stack: this.stack,
    };
  }
}

// Specific error classes
export class InitializationError extends PluginError {
  constructor(message: string, details?: any) {
    super(PluginErrorCode.INITIALIZATION_FAILED, message, details);
    this.name = 'InitializationError';
  }
}

export class PermissionError extends PluginError {
  constructor(permission: string, details?: any) {
    super(
      PluginErrorCode.PERMISSION_DENIED,
      `Missing permission: ${permission}`,
      details
    );
    this.name = 'PermissionError';
  }
}

export class DataError extends PluginError {
  constructor(operation: string, message: string, details?: any) {
    super(
      PluginErrorCode[`DATA_${operation.toUpperCase()}_FAILED` as keyof typeof PluginErrorCode] || PluginErrorCode.UNKNOWN_ERROR,
      message,
      details
    );
    this.name = 'DataError';
  }
}

export class APIError extends PluginError {
  constructor(message: string, details?: any) {
    super(PluginErrorCode.API_ERROR, message, details);
    this.name = 'APIError';
  }
}

export class NetworkError extends PluginError {
  constructor(message: string, details?: any) {
    super(PluginErrorCode.NETWORK_ERROR, message, details);
    this.name = 'NetworkError';
  }
}

export class TimeoutError extends PluginError {
  constructor(operation: string, timeout: number) {
    super(
      PluginErrorCode.TIMEOUT,
      `Operation '${operation}' timed out after ${timeout}ms`,
      { operation, timeout }
    );
    this.name = 'TimeoutError';
  }
}

// Error helper functions
export function isPluginError(error: any): error is PluginError {
  return error instanceof PluginError;
}

export function getErrorCode(error: any): PluginErrorCode {
  if (isPluginError(error)) {
    return error.code;
  }
  return PluginErrorCode.UNKNOWN_ERROR;
}

export function formatError(error: any): string {
  if (isPluginError(error)) {
    return `[${error.code}] ${error.message}`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
