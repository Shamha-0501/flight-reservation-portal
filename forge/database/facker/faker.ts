import { getDataset } from "../factory/datasets";

export class ForgeFaker {
  private rand(): number {
    return Math.random();
  }

  // ------------ core helpers -------------
  integer(min: number, max: number): number {
    if (max < min) [min, max] = [max, min];
    return Math.floor(this.rand() * (max - min + 1)) + min;
  }

  numberBetween(min: number, max: number, decimals = 0): number {
    if (max < min) [min, max] = [max, min];
    const value = this.rand() * (max - min + 1) + min;
    if (decimals <= 0) return Math.round(value);
    const factor = 10 ** decimals;
    return Math.round(value * factor) / factor;
  }

  boolean(trueProbability = 0.5): boolean {
    return this.rand() < trueProbability;
  }

  pickOne<T>(items: readonly T[]): T {
    if (!items.length) {
      throw new Error(`Cannot pickOne from empty array.`);
    }
    const idx = this.integer(0, items.length - 1);
    return items[idx];
  }

  pickOneFromDataset(key: string): string {
    const ds = getDataset(key);
    return this.pickOne(ds);
  }

  // ----------- Person / name helpers -----------
  private defaultFirstNames = [
    "Nimal",
    "Kamal",
    "Sunil",
    "Amali",
    "Dilani",
    "Sahan",
    "Ishara",
    "Ravindu",
    "Tharindu",
    "Janani",
  ];

  private defaultLastNames = [
    "Perera",
    "Fernando",
    "Silva",
    "Jayasinghe",
    "Karunaratne",
    "Wijesinghe",
    "Bandara",
    "Gunasekara",
    "Herath",
    "Ekanayake",
  ];

  firstName(): string {
    try {
      return this.pickOneFromDataset("first_names");
    } catch {
      return this.pickOne(this.defaultFirstNames);
    }
  }

  lastName(): string {
    try {
      return this.pickOneFromDataset("last_names");
    } catch {
      return this.pickOne(this.defaultLastNames);
    }
  }

  fullName(): string {
    return `${this.firstName()} ${this.lastName()}`;
  }

  // -------- email / username helpers --------
  usernameFromName(name?: string): string {
    const base = name
      ? name
          .toLowerCase()
          .replace(/[^a-z0-9]+/gi, ".")
          .replace(/\.+/g, ".")
          .replace(/^\.+|\.+$/g, "")
      : `user${this.integer(1000, 9999)}`;
    const suffix = this.integer(10, 9999);
    return `${base}${suffix}`;
  }

  email(name?: string, domain?: string): string {
    const username = this.usernameFromName(name);
    const domains = domain ? [domain] : ["example.com", "mail.test", "demo.lk"];
    return `${username}@${this.pickOne(domains)}`;
  }

  // ------- Text helpers --------
  word(length = 5): string {
    const chars = "abcdefghijklmnopqrstuvwxyz";
    let w = "";
    for (let i = 0; i < length; i++) {
      w += chars.charAt(this.integer(0, chars.length - 1));
    }
    return w;
  }

  sentence(words = 8): string {
    const arr: string[] = [];
    for (let i = 0; i < words; i++) {
      arr.push(this.word(this.integer(3, 10)));
    }

    const first = arr[0].charAt(0).toUpperCase() + arr[0].slice(1);
    return `${first} ${arr.slice(1).join(" ")}.`;
  }

  paragraph(sentences = 3): string {
    const arr: string[] = [];
    for (let i = 0; i < sentences; i++) {
      arr.push(this.sentence(this.integer(6, 12)));
    }

    return arr.join(" ");
  }

  phoneNumber(pattern = "+94#########"): string {
    return pattern.replace(/#/g, () => String(this.integer(0, 9)));
  }

  dateBetween(start: Date, end: Date): Date {
    const startTs = start.getTime();
    const endTs = end.getTime();
    const min = Math.min(startTs, endTs);
    const max = Math.max(startTs, endTs);
    const ts = this.numberBetween(min, max);
    return new Date(ts);
  }
}

export const forgeFaker = new ForgeFaker();
