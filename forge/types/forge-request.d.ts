declare global {
    interface Request {
        setRouteParams(params: Record<string, string>): this;
        param(key: string): string | undefined;
        header(name: string): string | null;
        cookie(name: string): string | null;
        ip(): string | null;
        jsonBody<T = any>(): Promise<T>;
        formDataBody(): Promise<FormData>;
        all(): Promise<Record<string, any>>;
        input<T = any>(key: string, def?: T): Promise<T>;
        getInput<T = any>(key: string, def?: T): Promise<T>;
        hasInput(key: string): Promise<boolean>;
        only(keys: string[]): Promise<Record<string, any>>;
        except(keys: string[]): Promise<Record<string, any>>;
        files(): Promise<Record<string, File | File[]>>;
        hasFile(key: string): Promise<boolean>;
        getFile(key: string): Promise<File | null>;
        getFiles(key: string): Promise<File[]>;
        validate<T = any>(rules: any, options?: any): Promise<T>;
        validated<T = any>(): T;
    }
}

export {};