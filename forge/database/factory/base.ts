import { forgeFaker, ForgeFaker } from "../facker/faker";

export abstract class BaseFactory<TAttrs> {
  protected _records = 1;
  protected _state: Partial<TAttrs> = {};
  protected facker: ForgeFaker;

  constructor(fackerInstance: ForgeFaker = forgeFaker) {
    this.facker = fackerInstance;
  }

  /**
   * Concrete factories implement this and use this.facker
   */
  abstract definition(facker: ForgeFaker): TAttrs;

  generate(count: number): this {
    this._records = count;
    return this;
  }

  state(state: Partial<TAttrs>): this {
    this._state = { ...this._state, ...state };
    return this;
  }

  make(): TAttrs[] {
    const rows: TAttrs[] = [];

    for (let i = 0; i < this._records; i++) {
      const base = this.definition(this.facker);
      rows.push({
        ...base,
        ...this._state,
      });
    }

    return rows;
  }
}
