import deepEqual from "fast-deep-equal";

export const toPath = (p: string | (string|number)[]): string =>
  Array.isArray(p) ? p.map(seg => String(seg)).join(".") : p;

export const splitPath = (p: string): (string|number)[] =>
  p === "" ? [] : p.split(".").map(seg => (seg.match(/^\d+$/) ? Number(seg) : seg));

export function getByPath(obj: any, path: string) {
  const segs = splitPath(path);
  let cur = obj;
  for (const s of segs) {
    if (cur == null) return undefined;
    cur = cur[s as any];
  }
  return cur;
}

export function setByPath(obj: any, path: string, value: any) {
  const segs = splitPath(path);
  if (segs.length === 0) return value;
  let cur = obj;
  for (let i = 0; i < segs.length - 1; i++) {
    const s = segs[i];
    const next = segs[i+1];
    if (cur[s as any] == null) {
      cur[s as any] = typeof next === "number" ? [] : {};
    }
    cur = cur[s as any];
  }
  (cur as any)[segs[segs.length - 1] as any] = value;
  return obj;
}

export function deleteByPath(obj: any, path: string) {
  const segs = splitPath(path);
  if (segs.length === 0) return;
  let cur = obj;
  for (let i = 0; i < segs.length - 1; i++) {
    const s = segs[i];
    if (cur[s as any] == null) return;
    cur = cur[s as any];
  }
  const last = segs[segs.length - 1] as any;
  if (Array.isArray(cur) && typeof last === "number") {
    cur.splice(last, 1);
  } else {
    delete (cur as any)[last];
  }
}

export const isObject = (v: any) => v && typeof v === "object" && !Array.isArray(v);

export const applyDefaults = (schema: any, data: any): any => {
  if (schema == null) return data;
  if (data == null && schema.default !== undefined) return structuredClone(schema.default);
  if (Array.isArray(data)) {
    const itemSchema = schema.items;
    return data.map(it => applyDefaults(itemSchema, it));
  }
  if (isObject(data)) {
    const result: any = { ...data };
    const props = schema.properties || {};
    for (const key of Object.keys(props)) {
      result[key] = applyDefaults((props as any)[key], result[key]);
    }
    return result;
  }
  return data;
};

export function sanitizeId(path: string): string {
  return path.replace(/[^a-zA-Z0-9\-_:.]/g, "_");
}

export function shallowEqual(a: any, b: any) {
  if (a === b) return true;
  if (!a || !b) return false;
  const ak = Object.keys(a);
  const bk = Object.keys(b);
  if (ak.length !== bk.length) return false;
  for (const k of ak) if ((a as any)[k] !== (b as any)[k]) return false;
  return true;
}

export function clone<T>(v: T): T {
  return structuredClone(v);
}

export { deepEqual };
