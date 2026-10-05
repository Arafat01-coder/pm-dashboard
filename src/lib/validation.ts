import { badRequest } from "./errors";
import { passwordProblem } from "./passwordRules";

/**
 * Small validators for request bodies. Each returns the cleaned value or
 * records a field error; call `done()` to throw them all at once.
 */
export function validator(body: Record<string, unknown>) {
  const errors: Record<string, string> = {};

  return {
    errors,

    /** Required or optional trimmed string with a max length. */
    string(field: string, opts: { required?: boolean; max?: number; label?: string } = {}) {
      const { required = false, max = 500, label = field } = opts;
      const raw = body[field];
      if (raw === undefined || raw === null || raw === "") {
        if (required) errors[field] = `${label} is required`;
        return undefined;
      }
      if (typeof raw !== "string") {
        errors[field] = `${label} must be text`;
        return undefined;
      }
      const value = raw.trim();
      if (required && !value) errors[field] = `${label} is required`;
      else if (value.length > max) errors[field] = `${label} must be at most ${max} characters`;
      return value;
    },

    /** One of a fixed list of values. */
    oneOf<T extends string>(field: string, options: readonly T[], opts: { required?: boolean; label?: string } = {}) {
      const { required = false, label = field } = opts;
      const raw = body[field];
      if (raw === undefined || raw === null || raw === "") {
        if (required) errors[field] = `${label} is required`;
        return undefined;
      }
      if (typeof raw !== "string" || !options.includes(raw as T)) {
        errors[field] = `${label} is not valid`;
        return undefined;
      }
      return raw as T;
    },

    /** A YYYY-MM-DD date. Returns null when cleared, undefined when absent. */
    date(field: string, opts: { label?: string } = {}) {
      const { label = field } = opts;
      const raw = body[field];
      if (raw === undefined) return undefined;
      if (raw === null || raw === "") return null;
      if (typeof raw !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(raw) || Number.isNaN(Date.parse(raw))) {
        errors[field] = `${label} must be a valid date`;
        return undefined;
      }
      return new Date(`${raw}T00:00:00.000Z`);
    },

    /** A list of ids. */
    ids(field: string, opts: { label?: string; max?: number } = {}) {
      const { label = field, max = 200 } = opts;
      const raw = body[field];
      if (raw === undefined) return undefined;
      if (!Array.isArray(raw) || raw.some((v) => typeof v !== "string") || raw.length > max) {
        errors[field] = `${label} is not valid`;
        return undefined;
      }
      return [...new Set(raw as string[])];
    },

    /** An optional id; null clears it. */
    id(field: string, opts: { label?: string } = {}) {
      const { label = field } = opts;
      const raw = body[field];
      if (raw === undefined) return undefined;
      if (raw === null || raw === "") return null;
      if (typeof raw !== "string") {
        errors[field] = `${label} is not valid`;
        return undefined;
      }
      return raw;
    },

    email(field: string, opts: { required?: boolean; label?: string } = {}) {
      const value = this.string(field, { ...opts, max: 254 });
      if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        errors[field] = `Enter a valid email address`;
        return undefined;
      }
      return value?.toLowerCase();
    },

    password(field: string, opts: { label?: string } = {}) {
      const { label = "Password" } = opts;
      const raw = body[field];
      if (typeof raw !== "string" || !raw) {
        errors[field] = `${label} is required`;
        return undefined;
      }
      const problem = passwordProblem(raw);
      if (problem) {
        errors[field] = problem;
        return undefined;
      }
      return raw;
    },

    done() {
      if (Object.keys(errors).length > 0) {
        throw badRequest(Object.values(errors)[0], errors);
      }
    },
  };
}
