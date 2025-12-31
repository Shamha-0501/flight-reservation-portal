export type ValidationErrors = Record<string, string[]>;

export type ValidateResult<T = any> =
  | { ok: true; data: T }
  | { ok: false; errors: ValidationErrors };

type FilesBag = Record<string, File | File[]>;

const pushErr = (errors: ValidationErrors, key: string, message: string) => {
  errors[key] ||= [];
  errors[key].push(message);
};

const isEmptyvalue = (v: any) => {
  return v === undefined || v === null || v === "";
};

const parseRules = (rule: any): string[] => {
  if (!rule) return [];
  if (Array.isArray(rule)) return rule.map(String);
  if (typeof rule === "string")
    return rule
      .split("|")
      .map((s) => s.trim())
      .filter(Boolean);
  return [String(rule)];
};

const getRuleArg = (rule: string) => {
  const idx = rule.indexOf(":");
  if (idx === -1) return { name: rule, arg: "" };
  return { name: rule.slice(0, idx), arg: rule.slice(idx + 1) };
};

const isEmail = (v: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
};

const fileList = (files: FilesBag, key: string): File[] => {
  const f = files[key];
  if (!f) return [];
  return Array.isArray(f) ? f : [f];
};

const isImageFile = (f: File) => {
  return (f.type || "").startsWith("image/");
};

const extOf = (name: string) => {
  const m = name.toLowerCase().match(/\.([a-z0-9]+)$/);
  return m ? m[1] : "";
};

const kbOfFile = (f: File) => {
  return Math.ceil(f.size / 1024);
};

/**
 * payload validation.
 * - payload: text fields (query/params/body merged)
 * - files: Record<field, File|File[]>
 * - rules: Record<field, ruleString>
 */
export const validatePayload = async (
  payload: Record<string, any>,
  files: FilesBag,
  rules: Record<string, any>,
  options?: {
    messages?: Record<string, string>;
    attributes?: Record<string, string>;
  }
): Promise<ValidateResult> => {
  const errors: ValidationErrors = {};
  const out: Record<string, any> = {};

  const msg = (field: string, rule: string, fallback: string) => {
    const custom = options?.messages?.[`${field}.${rule}`];
    if (custom) return custom;
    const nice = options?.attributes?.[field] || field;
    return fallback.replace(":attribute", nice);
  };

  for (const [field, ruleDef] of Object.entries(rules || {})) {
    const ruleList = parseRules(ruleDef);
    const hasSometimes = ruleList.includes("sometimes");
    const hasNullable = ruleList.includes("nullable");

    // FIX: min/max should NOT decide file vs value validation
    const hasAnyFileRule = ruleList.some(
      (r) =>
        r === "file" ||
        r === "image" ||
        r.startsWith("mimes:") ||
        r.startsWith("size:")
    );

    const filesForField = fileList(files, field);
    const value = payload[field];
    const present = value !== undefined || filesForField.length > 0;

    if (hasSometimes && !present) continue;

    if (ruleList.includes("required")) {
      const ok = hasAnyFileRule
        ? filesForField.length > 0
        : !isEmptyvalue(value);
      if (!ok) {
        pushErr(
          errors,
          field,
          msg(field, "required", ":attribute is required.")
        );
        continue;
      }
    }

    // nullable: allow null/empty and skip other validations (for non-file)
    if (!hasAnyFileRule && hasNullable && isEmptyvalue(value)) {
      out[field] = null;
      continue;
    }

    // ---------------- FILE RULES ----------------
    if (hasAnyFileRule) {
      if (filesForField.length === 0) {
        continue; // if it's not required, it can be absent
      }

      // image
      if (ruleList.includes("image")) {
        for (const f of filesForField) {
          if (!isImageFile(f)) {
            pushErr(
              errors,
              field,
              msg(field, "image", ":attribute must be an image.")
            );
            break;
          }
        }
      }

      // mimes:jpg,png,jpeg
      const mimeRule = ruleList.find((r) => r.startsWith("mimes:"));
      if (mimeRule) {
        const { arg } = getRuleArg(mimeRule);
        const allowed = arg
          .split(",")
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean);

        for (const f of filesForField) {
          const ext = extOf(f.name);
          if (!allowed.includes(ext)) {
            pushErr(
              errors,
              field,
              msg(
                field,
                "mimes",
                `:attribute must be a file of type: ${allowed.join(", ")}.`
              )
            );
            break;
          }
        }
      }

      // size: 5120 (KB exact)
      const sizeRule = ruleList.find((r) => r.startsWith("size:"));
      if (sizeRule) {
        const { arg } = getRuleArg(sizeRule);
        const sizeKB = Number(arg); // ✅ FIX
        for (const f of filesForField) {
          if (kbOfFile(f) !== sizeKB) {
            pushErr(
              errors,
              field,
              msg(field, "size", `:attribute must be ${sizeKB} KB.`)
            );
            break;
          }
        }
      }

      // min/max for files => KB
      const minRule = ruleList.find((r) => r.startsWith("min:"));
      const maxRule = ruleList.find((r) => r.startsWith("max:"));

      if (minRule) {
        const { arg } = getRuleArg(minRule);
        const minKB = Number(arg);
        for (const f of filesForField) {
          if (kbOfFile(f) < minKB) {
            pushErr(
              errors,
              field,
              msg(field, "min", `:attribute must be at least ${minKB}KB.`)
            );
            break;
          }
        }
      }

      if (maxRule) {
        const { arg } = getRuleArg(maxRule);
        const maxKB = Number(arg);
        for (const f of filesForField) {
          if (kbOfFile(f) > maxKB) {
            pushErr(
              errors,
              field,
              msg(field, "max", `:attribute must not exceed ${maxKB}KB.`)
            );
            break;
          }
        }
      }

      // if no errors => include files in output
      if (!errors[field]) {
        out[field] =
          filesForField.length === 1 ? filesForField[0] : filesForField;
      }

      continue;
    }

    // ---------------- VALUE RULES ----------------
    // If value is undefined and not required: skip
    if (value === undefined) continue;

    for (const r of ruleList) {
      const { name, arg } = getRuleArg(r);

      if (name === "required" || name === "sometimes" || name === "nullable")
        continue;

      if (name === "string") {
        if (typeof value !== "string") {
          pushErr(
            errors,
            field,
            msg(field, "string", ":attribute must be a string.")
          );
          break;
        }
      }

      if (name === "number") {
        const n = typeof value === "number" ? value : Number(value);
        if (Number.isNaN(n)) {
          pushErr(
            errors,
            field,
            msg(field, "number", ":attribute must be a number.")
          );
          break;
        }
        out[field] = n;
        continue;
      }

      if (name === "integer") {
        const n = typeof value === "number" ? value : Number(value);
        if (!Number.isInteger(n)) {
          pushErr(
            errors,
            field,
            msg(field, "integer", ":attribute must be an integer.")
          );
          break;
        }
        out[field] = n;
        continue;
      }

      if (name === "boolean") {
        const v =
          value === true || value === "true" || value === 1 || value === "1"
            ? true
            : value === false ||
              value === "false" ||
              value === 0 ||
              value === "0"
            ? false
            : null;

        if (v === null) {
          pushErr(
            errors,
            field,
            msg(field, "boolean", ":attribute must be true or false.")
          );
          break;
        }
        out[field] = v;
        continue;
      }

      if (name === "email") {
        if (typeof value !== "string" || !isEmail(value)) {
          pushErr(
            errors,
            field,
            msg(field, "email", ":attribute must be a valid email address.")
          );
          break;
        }
      }

      if (name === "array") {
        if (!Array.isArray(value)) {
          if (typeof value === "string") {
            out[field] = value
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean);
          } else {
            pushErr(
              errors,
              field,
              msg(field, "array", ":attribute must be an array.")
            );
            break;
          }
        }
      }

      if (name === "min") {
        const min = Number(arg);
        if (typeof value === "string" && value.length < min) {
          pushErr(
            errors,
            field,
            msg(field, "min", `:attribute must be at least ${min} charactors.`)
          );
          break;
        }
        if (typeof value === "number" && value < min) {
          pushErr(
            errors,
            field,
            msg(field, "min", `:attribute must be at least ${min}.`)
          );
          break;
        }
        if (Array.isArray(value) && value.length < min) {
          pushErr(
            errors,
            field,
            msg(field, "min", `:attribute must have at least ${min} items.`)
          );
          break;
        }
      }

      if (name === "max") {
        const max = Number(arg);
        if (typeof value === "string" && value.length > max) {
          pushErr(
            errors,
            field,
            msg(field, "max", `:attribute must not exceed ${max} charactors.`)
          );
          break;
        }
        if (typeof value === "number" && value > max) {
          pushErr(
            errors,
            field,
            msg(field, "max", `:attribute must not exceed ${max}.`)
          );
          break;
        }
        if (Array.isArray(value) && value.length > max) {
          pushErr(
            errors,
            field,
            msg(
              field,
              "max",
              `:attribute must not have more than ${max} items.`
            )
          );
          break;
        }
      }

      if (name === "in") {
        const allowed = arg.split(",").map((s) => s.trim());
        if (!allowed.includes(String(value))) {
          pushErr(
            errors,
            field,
            msg(
              field,
              "in",
              `:attribute must be one of : ${allowed.join(", ")}.`
            )
          );
          break;
        }
      }
    }

    // If no errors and out[field] not set by coercion rules => keep original
    if (!errors[field] && out[field] === undefined) out[field] = value;
  }

  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, data: out };
};
