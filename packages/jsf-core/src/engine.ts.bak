import Ajv, { ErrorObject } from "ajv";
import addFormats from "ajv-formats";
import { applyDefaults, clone, getByPath, setByPath } from "./utils";
import type { Engine, EngineOptions, FormState, JSONSchema, Path, ValidationError } from "./types";

type CacheKey = string;
const ajvCache = new Map<CacheKey, Ajv>();

function makeAjv(schema: JSONSchema): Ajv {
  const key = String((schema as any)?.$id || "no-id");
  if (ajvCache.has(key)) return ajvCache.get(key)!;

  // Allow vendor extensions and stay permissive for UX widgets
  const ajv = new Ajv({
    strict: false,            // <-- allow unknown keywords like x-*
    allErrors: true,
    allowUnionTypes: true
  });
  addFormats(ajv);

  // Whitelist vendor/interop keywords so strict mode never complains if toggled later
  ["x-enumNames", "x-enum-labels", "discriminator"].forEach((k) => {
    try { (ajv as any).addKeyword(k); } catch {}
  });

  ajvCache.set(key, ajv);
  return ajv;
}

function mapErrors(errs: ErrorObject[] | null | undefined): ValidationError[] {
  if (!errs) return [];
  return errs.map(e => {
    const path = (e.instancePath || "").replace(/^\//, "").replace(/\//g, ".").replace(/\[(\d+)\]/g, ".$1");
    const missing = (e.params as any)?.missingProperty;
    const finalPath = missing ? (path ? `${path}.${missing}` : missing) : path;
    return { path: finalPath, message: e.message || "Invalid", keyword: e.keyword };
  });
}

export function createEngine(schema: JSONSchema, initialData: any = {}, opts: EngineOptions = {}): Engine {
  let _schema = schema;
  const ajv = makeAjv(_schema);
  const validateRoot = ajv.compile(_schema);

  const state: FormState = {
    data: applyDefaults(_schema, clone(initialData)),
    dirty: new Set<string>(),
    errors: [],
    activeOneOf: {}
  };

  function validate(): boolean {
    const ok = validateRoot(state.data);
    state.errors = mapErrors(validateRoot.errors);
    return !!ok;
  }

  function setValue(path: Path, value: any) {
    state.data = setByPath(clone(state.data), path, value);
    state.dirty.add(path);
    validate();
  }

  function addArrayItem(path: Path, value?: any) {
    const next = clone(state.data);
    const nextArr = getByPath(next, path) || [];
    if (!Array.isArray(nextArr)) throw new Error(`Path ${path} is not an array`);
    nextArr.push(value);
    setByPath(next, path, nextArr);
    state.data = next;
    state.dirty.add(path);
    validate();
  }

  function removeArrayItem(path: Path, index: number) {
    const next = clone(state.data);
    const arr = getByPath(next, path);
    if (!Array.isArray(arr)) throw new Error(`Path ${path} is not an array`);
    arr.splice(index, 1);
    setByPath(next, path, arr);
    state.data = next;
    state.dirty.add(path);
    validate();
  }

  function setActiveBranch(containerPath: Path, index: number) {
    state.activeOneOf[containerPath] = index;
    validate();
  }

  function getErrors() { return state.errors; }
  function getState() { return state; }
  function getSchema() { return _schema; }

  function setSchema(s: JSONSchema) {
    _schema = s;
    ajv.removeSchema();
    validateRoot.schema = _schema;
    validateRoot.errors = null;
    state.data = applyDefaults(_schema, state.data);
    state.errors = [];
    state.activeOneOf = {};
    validate();
  }

  function reset(data?: any) {
    state.data = applyDefaults(_schema, data ?? {});
    state.errors = [];
    state.dirty = new Set();
    validate();
  }

  validate();
  return { getState, setValue, addArrayItem, removeArrayItem, setActiveBranch, validate, getErrors, getSchema, setSchema, reset };
}
