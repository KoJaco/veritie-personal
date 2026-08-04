export class AuthError extends Error {
    readonly code: string;

    constructor(message: string, code: string) {
        super(message);
        this.name = "AuthError";
        this.code = code;
    }
}

export class UnauthorizedError extends AuthError {
    constructor(message = "Authentication required") {
        super(message, "unauthorized");
        this.name = "UnauthorizedError";
    }
}

export class ForbiddenError extends AuthError {
    constructor(message = "Permission denied") {
        super(message, "forbidden");
        this.name = "ForbiddenError";
    }
}

export class DeletedAccountError extends AuthError {
    constructor(message = "This account was previously deleted") {
        super(message, "account_deleted");
        this.name = "DeletedAccountError";
    }
}

export class DuplicateUserError extends AuthError {
    constructor(message = "User already exists") {
        super(message, "duplicate_user");
        this.name = "DuplicateUserError";
    }
}

export class InitAccountError extends AuthError {
    constructor(message: string, code = "init_account_failed") {
        super(message, code);
        this.name = "InitAccountError";
    }
}
