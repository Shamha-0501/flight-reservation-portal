import { ValidationException } from "./validation-exception";
import { validatePayload } from "@/forge/validation/validate-payload";

const kInstalled = Symbol.for("forge:req:installed");
const kJson = Symbol.for("forge:req:json");
const kForm = Symbol.for("forge:req:form");
const kAll = Symbol.for("forge:req:all");
const kValidated = Symbol.for("forge:req:validated");
const kParams = Symbol.for("forge:req:params");

function parseQuery(url: string) {
  const u = new URL(url);
  const out: Record<string, string> = {};
  u.searchParams.forEach((v, k) => (out[k] = v));
  return out;
}

function contentType(req: Request) {
  return String(req.headers.get("content-type") || "").toLowerCase();
}

function isMultipart(ct: string) {
  return ct.includes("multipart/form-data");
}

function isJson(ct: string) {
  return ct.includes("application/json");
}

function isFormUrlEncoded(ct: string) {
  return ct.includes("application/x-www-form-urlencoded");
}

function formDataToObject(fd: FormData) {
  // Convert ONLY fields (string values) to object; keep files accessible via getFile/getFiles
  const out: Record<string, any> = {};
  for (const [k, v] of fd.entries()) {
    if (typeof v !== "string") continue;

    // support array-ish fields: tags[]=a, tags[]=b
    if (k.endsWith("[]")) {
      const key = k.slice(0, -2);
      out[key] ||= [];
      out[key].push(v);
    } else if (k in out) {
      out[k] = Array.isArray(out[k]) ? [...out[k], v] : [out[k], v];
    } else {
      out[k] = v;
    }
  }
  return out;
}

function extractFiles(fd: FormData) {
  const files: Record<string, File | File[]> = {};
  for (const [k, v] of fd.entries()) {
    if (typeof v === "string") continue;

    if (files[k]) {
      files[k] = Array.isArray(files[k])
        ? [...(files[k] as File[]), v]
        : [files[k] as File, v];
    } else {
      files[k] = v;
    }
  }
  return files;
}

export function installForgeRequest() {
  const proto: any = (globalThis as any).Request?.prototype;
  if (!proto || proto[kInstalled]) return;
  proto[kInstalled] = true;

  // ---------- route params ----------
  proto.setRouteParams = function (params: Record<string, string>) {
    this[kParams] = params || {};
    return this;
  };

  proto.param = function (key: string) {
    return (this[kParams] || {})[key];
  };

  // ---------- headers/cookies/ip ----------
  proto.header = function (name: string) {
    return this.headers.get(name);
  };

  proto.ip = function () {
    return (
      this.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      this.headers.get("x-real-ip") ||
      null
    );
  };

  proto.cookie = function (name: string) {
    try {
      // @ts-ignore
      return this.cookies?.get?.(name)?.value ?? null;
    } catch {
      return null;
    }
  };

  // ---------- body parsers (cached) ----------
  proto.jsonBody = async function () {
    if (this[kJson] !== undefined) return this[kJson];

    const ct = contentType(this);
    if (!isJson(ct)) {
      this[kJson] = {};
      return this[kJson];
    }

    const cloned = this.clone();
    this[kJson] = await cloned.json().catch(() => ({}));
    return this[kJson];
  };

  proto.formDataBody = async function () {
    if (this[kForm] !== undefined) return this[kForm];

    const ct = contentType(this);

    if (isMultipart(ct)) {
      const cloned = this.clone();
      this[kForm] = await cloned.formData().catch(() => new FormData());
      return this[kForm];
    }

    if (isFormUrlEncoded(ct)) {
      const cloned = this.clone();
      const text = await cloned.text().catch(() => "");
      const sp = new URLSearchParams(text);
      const fd = new FormData();
      sp.forEach((v, k) => fd.append(k, v));
      this[kForm] = fd;
      return this[kForm];
    }

    this[kForm] = new FormData();
    return this[kForm];
  };

  // ---------- unified input ----------
  proto.all = async function () {
    if (this[kAll] !== undefined) return this[kAll];

    const q = parseQuery(this.url);
    const p = this[kParams] || {};
    const ct = contentType(this);

    let bodyObj: Record<string, any> = {};
    let files: Record<string, File | File[]> = {};

    if (isMultipart(ct) || isFormUrlEncoded(ct)) {
      const fd: FormData = await this.formDataBody();
      bodyObj = formDataToObject(fd);
      files = extractFiles(fd);
    } else if (isJson(ct)) {
      bodyObj = await this.jsonBody();
    } else {
      bodyObj = await this.jsonBody().catch(() => ({}));
    }

    this[kAll] = { ...q, ...p, ...bodyObj, __files: files };
    return this[kAll];
  };

  proto.input = async function (key: string, def?: any) {
    const data = await this.all();
    return key in data ? data[key] : def;
  };

  proto.getInput = proto.input;

  proto.hasInput = async function (key: string) {
    const data = await this.all();
    return data[key] !== undefined && data[key] !== null && data[key] !== "";
  };

  proto.only = async function (keys: string[]) {
    const data = await this.all();
    const out: Record<string, any> = {};
    for (const k of keys) if (k in data) out[k] = data[k];
    return out;
  };

  proto.except = async function (keys: string[]) {
    const data = await this.all();
    const out: Record<string, any> = { ...data };
    for (const k of keys) delete out[k];
    return out;
  };

  // ---------- files ----------
  proto.files = async function () {
    const data = await this.all();
    return (data.__files || {}) as Record<string, File | File[]>;
  };

  proto.hasFile = async function (key: string) {
    const f = await this.getFile(key);
    return !!f;
  };

  proto.getFile = async function (key: string) {
    const fs = await this.files();
    const v = fs[key];
    return Array.isArray(v) ? v[0] : v || null;
  };

  proto.getFiles = async function (key: string) {
    const fs = await this.files();
    const v = fs[key];
    if (!v) return [];
    return Array.isArray(v) ? v : [v];
  };

  // ---------- validation (Laravel-style) ----------
  proto.validate = async function (rules: any, options?: any) {
    const data = await this.all();
    const files = (data.__files || {}) as Record<string, File | File[]>;

    const { __files, ...payload } = data;

    const result = await validatePayload(payload, files, rules, options);
    if (!result.ok) {
      throw new ValidationException(result.errors || {});
    }

    this[kValidated] = result.data;
    return this[kValidated];
  };

  proto.validated = function () {
    if (this[kValidated] === undefined) {
      throw new Error("No validated data. Call req.validate(...) first.");
    }
    return this[kValidated];
  };
}
