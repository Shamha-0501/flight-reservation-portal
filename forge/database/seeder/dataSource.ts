import { BaseFactory } from "../factory/base";
import { readCsvRows, chunk, CsvOptions, listCsvFiles } from "./csv";

export type ArraySource<T> = {
  type: "array";
  rows: T[];
};

export type CsvSource = {
  type: "csv";
  file: string;
  options?: CsvOptions;
};

export type CsvDirSource = {
  type: "csvDir";
  dir: string;
  options?: CsvOptions;
};

export type SeederSource<T> = ArraySource<T> | CsvSource | CsvDirSource;

export const fromArray = function <T>(rows: T[]): ArraySource<T> {
  return { type: "array", rows };
};

export const fromFactory = function <T>(
  factory: BaseFactory<T>
): ArraySource<T> {
  const rows = factory.make(); // generate T[]
  return { type: "array", rows };
};

export const fromCsv = (file: string, options?: CsvOptions): CsvSource => {
  return { type: "csv", file, options };
};

export const fromCsvDir = (dir: string, options?: CsvOptions): CsvDirSource => {
  return { type: "csvDir", dir, options };
};

export const resolveSource = async function* <T>(
  source: SeederSource<T>,
  mapRow: (row: any) => T
): AsyncGenerator<T> {
  if (source.type === "array") {
    for (const r of source.rows) yield mapRow(r);
    return;
  }

  if (source.type === "csv") {
    for await (const row of readCsvRows(source.file, source.options))
      yield mapRow(row);
    return;
  }

  for (const file of listCsvFiles(source.dir)) {
    for await (const row of readCsvRows(file, source.options))
      yield mapRow(row);
  }
};

export const forEachChunk = async function <T>(
  source: AsyncIterable<T>,
  chunkSize: number,
  fn: (rows: T[]) => Promise<void>
) {
  for await (const rows of chunk(source, chunkSize)) {
    await fn(rows);
  }
};
