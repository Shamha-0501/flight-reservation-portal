import fs from "fs";
import path from "path";

export type Dataset = string[];

const registry: Record<string, Dataset> = {};

/**
 * Register a dataset into memory
 */
export const registerDataset = (key: string, values: Dataset) => {
  registry[key] = values;
};

/**
 * Load a JSON array file
 */
export const loadJsonDataset = (key: string, filePath: string) => {
  const fullPath = path.resolve(filePath);
  const raw = fs.readFileSync(fullPath, "utf8");
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error(`Dataset JSON for ${key} must be an array.`);
  }
  registry[key] = parsed.map(String);
};

/**
 * Load a CSV file with a single  column or first column as data set
 */
export const loadCsvDataset = (
  key: string,
  filePath: string,
  delimiter = ","
) => {
  const fullPath = path.resolve(filePath);
  const raw = fs.readFileSync(fullPath, "utf8");
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const values: string[] = lines.map((l) => l.split(delimiter)[0]?.trim());
  registry[key] = values;
};

/**
 * Get dataset; throws if missing
 */
export const getDataset = (key: string): Dataset => {
  const ds = registry[key];
  if (!ds || ds.length) {
    throw new Error(`Dataset "${key}" is not registered or empty.`);
  }
  return ds;
};
