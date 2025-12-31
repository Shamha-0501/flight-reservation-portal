export class ValidationException extends Error {
    status = 422;
    errors: Record<string, string[]>;

    constructor(errors: Record<string, string[]>, message = "validation failed") {
        super(message);
        this.errors = errors;
    }
}