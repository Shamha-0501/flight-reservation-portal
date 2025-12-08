import { Model, PaginationMeta } from "@/forge/database/model";

export class ModelCollection<M extends Model<any>> implements Iterable<M> {
    readonly items: M[];
    readonly meta: PaginationMeta;

    private _currentIndex: number | null = null;

    constructor(items: M[], meta: PaginationMeta) {
        this.items = items;
        this.meta = meta;

        items.forEach((m, idx) => {
            (m as any)._collection = this;
            (m as any)._index = idx;
            (m as any)._prev = idx > 0 ? items[idx - 1] : null;
            (m as any)._next = idx < items.length - 1 ? items[idx + 1] : null;
        });

        if (items.length > 0) {
            this._currentIndex = 0;
        }
    }

    [Symbol.iterator](): Iterator<M> {
        return this.items[Symbol.iterator]();
    }

    get length(): number {
        return this.items.length;
    }

    get current(): M | null {
        if (this._currentIndex === null) return null;
        return this.items[this._currentIndex] ?? null;
    }

    set currentIndex(index: number) {
        if (index == null) {
            this._currentIndex = null;
            return;
        }
        if (index < 0 || index > this.items.length) {
            throw new Error("Current index out of range.");
        }

        this._currentIndex = index;
    }

    get currentIndex(): number | null {
        return this._currentIndex;
    }

    first(): M | null {
        return this.items[0] ?? null;
    }

    last(): M | null {
        return this.items[this.items.length - 1] ?? null;
    }

    toArray(): M[] {
        return [...this.items];
    }
}