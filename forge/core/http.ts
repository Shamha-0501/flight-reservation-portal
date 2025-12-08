import { NextRequest, NextResponse } from "next/server";

export type MiddlwareContext = {
    user?: {
        id: number;
        email: string;
        // add more later
        [key: string]: any;
    };
    sessionId?: string | null;
};

export type MiddlewareFunction = (
    req: NextRequest,
    ctx: MiddlwareContext,
    next: () => Promise<NextResponse>
) => Promise<NextResponse>;

export class Backend {
    private middlewares: MiddlewareFunction[] = [];
    private aliases = new Map<string, MiddlewareFunction>();

    use(mw: MiddlewareFunction) {
        this.middlewares.push(mw);
        return this;
    }

    alias(name: string, mw: MiddlewareFunction) {
        this.aliases.set(name, mw);
        return this;
    }

    useAliases(names: string[]) {
        for (const name of names) {
            const mw = this.aliases.get(name);
            if (!mw) throw new Error(`Middleware alias "${name}" not registered!`);
            this.use(mw);
        }

        return this;
    }

    async handle(req: NextRequest): Promise<NextResponse> {
        const ctx: MiddlwareContext = {};
        let index = -1;

        const runner = async (i: number): Promise<NextResponse> => {
            if (i < index) throw new Error("next() called multiple times.");
            index = i;
            const fn = this.middlewares[i];
            if (!fn) return NextResponse.next();
            return fn(req, ctx, () => runner(i + 1));
        }

        return runner(0);
    }

    
}