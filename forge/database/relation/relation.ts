import type { Model } from "../model";

export class RelationOne<M extends Model<any>> {
  private _loaded = false;
  private _value: M | null = null;

  constructor(private loader: () => Promise<M | null>) {}

  /** Explicit load */
  async get(): Promise<M | null> {
    if (!this._loaded) {
      this._value = await this.loader();
      this._loaded = true;
    }
    return this._value;
  }

  /** Optional convenience */
  async value(): Promise<M | null> {
    return this.get();
  }

  /**
   * Make it "field-accessable":
   * await user.role().id
   */
  asProxy(): any {
    const self = this;

    return new Proxy(
      {},
      {
        get(_t, prop) {
          // allow: await rel.get()
          if (prop === "get") return self.get.bind(self);
          if (prop === "value") return self.value.bind(self);
          if (prop === "then") {
            // await user.role()
            return (resolve: any, reject: any) => self.get().then(resolve, reject);
          }

          // field access: await user.role().id
          return (async () => {
            const m = await self.get();
            if (!m) return undefined;
            return (m as any)[prop];
          })();
        },
      }
    );
  }
}

export class RelationMany<M extends Model<any>> {
  private _loaded = false;
  private _value: M[] = [];

  constructor(private loader: () => Promise<M[]>) {}

  async get(): Promise<M[]> {
    if (!this._loaded) {
      this._value = await this.loader();
      this._loaded = true;
    }
    return this._value;
  }

  asProxy(): any {
    const self = this;

    return new Proxy(
      [],
      {
        get(_t, prop) {
          if (prop === "get") return self.get.bind(self);
          if (prop === "then") {
            // await user.posts()
            return (resolve: any, reject: any) => self.get().then(resolve, reject);
          }

          // allow array-like usage: await user.posts().length, map, etc.
          return (async () => {
            const arr = await self.get();
            const v = (arr as any)[prop];
            return typeof v === "function" ? v.bind(arr) : v;
          })();
        },
      }
    );
  }
}
