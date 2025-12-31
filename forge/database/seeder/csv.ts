import fs from "fs";
import path from "node:path";
import readline from "node:readline";

export type CsvOptions = {
  delimiter?: string;
  headers?: string[] | "auto";
  trim?: boolean;
  skipEmpty?: boolean;
};

const splitCsvLine = (line: string, delimiter: string) => {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && ch === delimiter) {
      out.push(cur);
      cur = "";
      continue;
    }

    cur += ch;
  }

  out.push(cur);
  return out;
};

export const readCsvRows: (
  filePath: string,
  opts?: CsvOptions
) => AsyncGenerator<Record<string, string>> = async function* (
  filePath: string,
  opts: CsvOptions = {}
) {
  const delimiter = opts.delimiter ?? ",";
  const trim = opts.trim ?? true;
  const skipEmpty = opts.skipEmpty ?? true;

  const rl = readline.createInterface({
    input: fs.createReadStream(filePath),
    crlfDelay: Infinity,
  });

  let headers: string[] | null = null;

  for await (const rawLine of rl) {
    const line = trim ? rawLine.trim() : rawLine;
    if (skipEmpty && !line) continue;

    const cols = splitCsvLine(line, delimiter).map((v) =>
      trim ? v.trim() : v
    );

    if (!headers) {
      if (opts.headers === "auto" || !opts.headers) {
        headers = cols;
        continue;
      }
      headers = opts.headers;
    }

    const row: Record<string, string> = {};
    for (let i = 0; i < headers.length; i++) row[headers[i]] = cols[i] ?? "";
    yield row;
  }
};

export const chunk = async function* <T>(
  source: AsyncIterable<T>,
  size: number
): AsyncGenerator<T[]> {
  if (size <= 0) throw new Error("chunk size must be > 0");

  let buf: T[] = [];

  for await (const item of source) {
    buf.push(item);

    if (buf.length >= size) {
      yield buf;
      buf = [];
    }
  }

  // IMPORTANT: yield remaining items (e.g., 1 row when chunkSize=500)
  if (buf.length > 0) {
    yield buf;
  }
};

export const listCsvFiles = (dir: string) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".csv"))
    .map((e) => path.join(dir, e.name))
    .sort();
};
