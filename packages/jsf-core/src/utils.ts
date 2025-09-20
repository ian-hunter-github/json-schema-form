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

export function hasDataInContainer(obj: any, path: string): boolean {
  const containerData = getByPath(obj, path);
  if (!containerData || typeof containerData !== 'object') {
    return false;
  }
  
  // Check if there are any non-empty properties
  return Object.keys(containerData).some(key => {
    const value = containerData[key];
    return value !== undefined && value !== null && value !== '';
  });
}

// Apply all direct property const tags for a chosen branch schema at a given path.
export function applyConstTagsForBranch(
  engine: any,
  path: string,
  branchSchema: any,
  enable: boolean
) {
  if (!enable) return;
  const props = branchSchema?.properties || {};
  for (const k of Object.keys(props)) {
    const sub: any = (props as any)[k];
    if (
      sub &&
      typeof sub === "object" &&
      Object.prototype.hasOwnProperty.call(sub, "const")
    ) {
      const p = path ? `${path}.${k}` : k;
      engine.setValue(p, sub.const);
    }
  }
}

// Walk schema via dot path through properties (best-effort for oneOf containers)
export function getSchemaAtPath(root: any, path: string): any {
  if (!path) return root;
  const segs = path.split(".");
  let cur: any = root;
  for (const seg of segs) {
    if (!cur || typeof cur !== "object") return undefined;
    if (cur.properties && cur.properties[seg]) {
      cur = cur.properties[seg];
    } else {
      // unknown segment -> stop
      return cur;
    }
  }
  return cur;
}

// Helper function to determine if accordion should be used
export function checkShouldUseAccordion(schema: any): boolean {
  // Check if this is a oneOf/anyOf schema
  const isOneOf = Array.isArray(schema?.oneOf) || Array.isArray(schema?.anyOf);
  
  if (isOneOf) {
    // For oneOf schemas, check the maximum number of properties in any branch
    const group = schema.oneOf || schema.anyOf;
    let maxProperties = 0;
    
    for (const branch of group) {
      if (branch?.properties) {
        const branchPropertyCount = Object.keys(branch.properties).length;
        maxProperties = Math.max(maxProperties, branchPropertyCount);
      }
    }
          
    // Use accordion if any branch has 3 or more properties
    return maxProperties >= 3;
  } else if (schema?.properties) {
    // For regular objects, use accordion if there are 3 or more properties
    const propertyCount = Object.keys(schema.properties).length;
    
    return propertyCount >= 3;
  }
  
  return false;
}
