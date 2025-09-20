// React adapter with const visibility/tagging options
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createEngine, getByPath, sanitizeId } from "@ianhunterpersonal/jsf-core";
import { Accordion } from "./Accordion";
import { FieldRenderer } from "./components/FieldRenderer";
import type { JSONSchema, ValidationError } from "@ianhunterpersonal/jsf-core";

// Confirmation Dialog Component
const ConfirmationDialog: React.FC<{
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="jsf-confirmation-dialog-overlay">
      <div className="jsf-confirmation-dialog">
        <h3 className="jsf-confirmation-dialog-title">{title}</h3>
        <p className="jsf-confirmation-dialog-message">{message}</p>
        <div className="jsf-confirmation-dialog-actions">
          <button
            type="button"
            className="jsf-confirmation-dialog-button jsf-confirmation-dialog-button--cancel"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="jsf-confirmation-dialog-button jsf-confirmation-dialog-button--confirm"
            onClick={onConfirm}
          >
            Yes, Clear Data
          </button>
        </div>
      </div>
    </div>
  );
};

type ChangeCtx = {
  path: string;
  value: any;
  data: any;
  schema: JSONSchema;
  ts: number;
};
type ValidateCtx = {
  valid: boolean;
  errors: ValidationError[];
  data: any;
  ts: number;
};

type ConstVisibility = "hidden" | "readonly" | "visible";
type ConstErrorStrategy = "suppress-when-managed" | "show";

export type JsonSchemaFormProps = {
  oneOfBranchTitleVisibility?: "sr-only" | "hidden" | "visible";
  oneOfBranchShowDescription?: boolean;
  schema: JSONSchema;
  initialData?: any;
  classNamePrefix?: string;
  keepDataOnOneOfSwitch?: boolean;
  debounceMs?: number;
  debug?: boolean;

  // const/discriminator options
  constVisibility?: ConstVisibility; // default 'hidden'
  autoConstTagging?: boolean; // default true
  constErrorStrategy?: ConstErrorStrategy; // default 'suppress-when-managed'

  // existing callbacks
  onChange?: (data: any) => void;
  onSubmit?: (data: any) => void | Promise<void>;
  onValidate?: (ctx: ValidateCtx) => void | Promise<void>;
  onSubmitFailed?: (ctx: ValidateCtx) => void | Promise<void>;
  transformError?: (e: ValidationError) => ValidationError | null;

  onBeforeChange?: (ctx: ChangeCtx) => boolean | void | Promise<boolean | void>;
  onAfterChange?: (ctx: ChangeCtx) => void | Promise<void>;
  onBeforeSubmit?: (
    ctx: ValidateCtx
  ) => boolean | void | Promise<boolean | void>;
  onBranchChange?: (info: {
    path: string;
    index: number;
    schema: any;
  }) => void | Promise<void>;
  onArrayAdd?: (info: { path: string; index: number }) => void | Promise<void>;
  onArrayRemove?: (info: {
    path: string;
    index: number;
  }) => void | Promise<void>;
  onReset?: (data: any) => void | Promise<void>;
  onSchemaLoad?: (schema: JSONSchema) => void | Promise<void>;
  showReset?: boolean;
};

function useDebounced(ms: number = 120) {
  const t = useRef<number | null>(null);
  const schedule = (fn: () => void) => {
    if (t.current) clearTimeout(t.current);
    t.current = window.setTimeout(() => {
      t.current = null;
      fn();
    }, ms);
  };
  useEffect(
    () => () => {
      if (t.current) clearTimeout(t.current);
    },
    []
  );
  return schedule;
}

function applyConstTagsForBranch(
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
function getSchemaAtPath(root: any, path: string): any {
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

export const JsonSchemaForm: React.FC<JsonSchemaFormProps> = ({
  schema,
  initialData,
  classNamePrefix = "jsf-",
  keepDataOnOneOfSwitch,
  debounceMs = 120,
  debug = false,
  constVisibility = "hidden",
  autoConstTagging = true,
  constErrorStrategy = "suppress-when-managed",
  onChange,
  onSubmit,
  onValidate,
  onSubmitFailed,
  transformError,
  onBeforeChange,
  onAfterChange,
  onBeforeSubmit,
  onBranchChange,
  onArrayAdd,
  onArrayRemove,
  onReset,
  onSchemaLoad,
  showReset = false,
}) => {
  const engineRef = useRef(
    createEngine(schema, initialData, { keepDataOnOneOfSwitch })
  );
  const [tick, setTick] = useState(0);
  const schedule = useDebounced(debounceMs);
  const prefix = (c: string) => classNamePrefix + c;

  // State for confirmation dialog
  const [confirmationDialog, setConfirmationDialog] = useState<{
    isOpen: boolean;
    path: string;
    index: number;
    branchSchema: any;
  }>({
    isOpen: false,
    path: '',
    index: -1,
    branchSchema: null,
  });

  // State for form-level error indication
  const [hasErrors, setHasErrors] = useState(false);
  // Track if form has been submitted to show all errors
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Track const paths seen during render for error suppression
  const constPathsRef = useRef<Set<string>>(new Set());
  // Paths of discriminator const fields to hide (e.g. profile.kind)
  const hiddenConstPathsRef = useRef<Set<string>>(new Set());
  const resetConstPaths = () => {
    constPathsRef.current = new Set();
  };

  // Helper function to check if a field at a given path is a primitive type
  const isPrimitiveField = (path: string): boolean => {
    if (!path) return false;
    
    const segs = path.split('.');
    let currentSchema: any = schema;
    
    for (const seg of segs) {
      if (!currentSchema || typeof currentSchema !== 'object') return false;
      
      if (currentSchema.properties && currentSchema.properties[seg]) {
        currentSchema = currentSchema.properties[seg];
      } else if (currentSchema.items && seg.match(/^\d+$/)) {
        // Array item - check the items schema
        currentSchema = currentSchema.items;
      } else {
        // Unknown segment or array index without items schema
        return false;
      }
    }
    
    // Check if the final schema represents a primitive type
    if (!currentSchema || typeof currentSchema !== 'object') return false;
    
    const type = Array.isArray(currentSchema?.type)
      ? currentSchema.type.find((x: any) => x !== "null")
      : currentSchema?.type;
    
    // Primitive types: string, number, integer, boolean, or enum
    return type === 'string' || 
           type === 'number' || 
           type === 'integer' || 
           type === 'boolean' ||
           Array.isArray(currentSchema?.enum);
  };

  useEffect(() => {
    engineRef.current.setSchema(schema);
    setTick((x) => x + 1);
    (async () => {
      if (onSchemaLoad) await onSchemaLoad(schema);
    })();
  }, [schema, onSchemaLoad]);

  const firstMount = useRef(true);
  useEffect(() => {
    if (firstMount.current && initialData !== undefined) {
      engineRef.current.reset(initialData);
      firstMount.current = false;
      // Run validation immediately on form load without debouncing
      const runInitialValidation = async () => {
        const ok = engineRef.current.validate() as boolean;
        const st = engineRef.current.getState();
        let errs: ValidationError[] = st.errors;
        if (transformError)
          errs = errs.map(transformError).filter(Boolean) as ValidationError[];
        if (constErrorStrategy === "suppress-when-managed") {
          errs = errs.filter(
            (e) => !(e.keyword === "const" && constPathsRef.current.has(e.path))
          );
        }
        
        // Check if any errors are on primitive fields
        const hasPrimitiveErrors = errs.some(error => isPrimitiveField(error.path));
        setHasErrors(hasPrimitiveErrors);
        
        const ctx: ValidateCtx = {
          valid: ok,
          errors: errs,
          data: st.data,
          ts: Date.now(),
        };
        if (onChange) onChange(st.data);
        if (onValidate) await onValidate(ctx);
        setTick((x) => x + 1);
      };
      
      runInitialValidation();
    }
  }, [initialData]);

  // After each tick, ensure current active oneOf/anyOf branch const tags are applied.
  useEffect(() => {
    const st = engineRef.current.getState() as any;
    const active: Record<string, number> = st.activeOneOf || {};
    for (const path of Object.keys(active)) {
      const idx = active[path] ?? 0;
      const at = getSchemaAtPath(schema, path);
      const group = at?.oneOf || at?.anyOf;
      if (Array.isArray(group)) {
        applyConstTagsForBranch(
          engineRef.current,
          path,
          group[idx],
          autoConstTagging
        );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, schema, autoConstTagging]);

  const runPostChange = () => {
    schedule(async () => {
      const ok = engineRef.current.validate() as boolean;
      const st = engineRef.current.getState();
      let errs: ValidationError[] = st.errors;
      if (transformError)
        errs = errs.map(transformError).filter(Boolean) as ValidationError[];
      if (constErrorStrategy === "suppress-when-managed") {
        errs = errs.filter(
          (e) => !(e.keyword === "const" && constPathsRef.current.has(e.path))
        );
      }
      
      // Check if any errors are on primitive fields
      const hasPrimitiveErrors = errs.some(error => isPrimitiveField(error.path));
      setHasErrors(hasPrimitiveErrors);
      
      const ctx: ValidateCtx = {
        valid: ok,
        errors: errs,
        data: st.data,
        ts: Date.now(),
      };
      if (onChange) onChange(st.data);
      if (onValidate) await onValidate(ctx);
      setTick((x) => x + 1);
    });
  };

  const applyChange = async (path: string, value: any) => {
    const st0 = engineRef.current.getState();
    const ctx0: ChangeCtx = {
      path,
      value,
      data: st0.data,
      schema,
      ts: Date.now(),
    };
    if (onBeforeChange) {
      const res = await onBeforeChange(ctx0);
      if (res === false) return;
    }
    // Get original value for dirty state comparison
    const originalValue = initialData ? getByPath(initialData, path) : undefined;
    engineRef.current.setValue(path, value);
    const st1 = engineRef.current.getState();
    const ctx1: ChangeCtx = {
      path,
      value,
      data: st1.data,
      schema,
      ts: Date.now(),
    };
    // If value matches original, clear dirty state
    const isEqual = 
      (value === originalValue) || 
      (value === "" && originalValue === undefined) || 
      (value === undefined && originalValue === "") ||
      (value === null && originalValue === undefined) ||
      (value === undefined && originalValue === null);
    if (isEqual) {
      st1.dirty.delete(path);
    }
    if (onAfterChange) await onAfterChange(ctx1);
    setTick((x) => x + 1);
    runPostChange();
  };

  const addItem = async (path: string) => {
    engineRef.current.addArrayItem(path);
    const arr = getByPath(engineRef.current.getState().data, path);
    const index = (Array.isArray(arr) ? arr.length : 1) - 1;
    if (onArrayAdd) await onArrayAdd({ path, index });
    setTick((x) => x + 1);
    runPostChange();
  };

  const removeItem = async (path: string, i: number) => {
    engineRef.current.removeArrayItem(path, i);
    if (onArrayRemove) await onArrayRemove({ path, index: i });
    setTick((x) => x + 1);
    runPostChange();
  };

  const setBranch = async (path: string, index: number, branchSchema: any) => {
    const currentIndex = state.activeOneOf[path] ?? -1;
    
    // Only show confirmation if we're switching to a different branch
    // and there's existing data in the container
    if (currentIndex !== index && engineRef.current.hasDataInOneOfContainer(path)) {
      // Show confirmation dialog
      setConfirmationDialog({
        isOpen: true,
        path,
        index,
        branchSchema
      });
      return;
    }
    
    // If no data or same branch, proceed with the switch
    await performBranchSwitch(path, index, branchSchema);
  };

  const handleConfirmSwitch = async () => {
    const { path, index, branchSchema } = confirmationDialog;
    await performBranchSwitch(path, index, branchSchema);
    setConfirmationDialog({ isOpen: false, path: '', index: -1, branchSchema: null });
  };

  const handleCancelSwitch = () => {
    setConfirmationDialog({ isOpen: false, path: '', index: -1, branchSchema: null });
  };

  const performBranchSwitch = async (path: string, index: number, branchSchema: any) => {
    engineRef.current.setActiveBranch(path, index);
    applyConstTagsForBranch(
      engineRef.current,
      path,
      branchSchema,
      autoConstTagging
    );
    if (onBranchChange)
      await onBranchChange({ path, index, schema: branchSchema });
    setTick((x) => x + 1);
    runPostChange();
  };

  const state = engineRef.current.getState();

  const errors: ValidationError[] = useMemo(() => {
    let errs: ValidationError[] = state.errors as ValidationError[];

    if (transformError) {
      errs = errs
        .map(transformError)
        .filter((x): x is ValidationError => Boolean(x));
    }

    // suppress summary oneOf error when a branch is active at that path
    const active = (state as any).activeOneOf || {};
    errs = errs.filter(
      (e: ValidationError) =>
        !(
          e.keyword === "oneOf" &&
          Object.prototype.hasOwnProperty.call(active, e.path)
        )
    );

    if (constErrorStrategy === "suppress-when-managed") {
      errs = errs.filter(
        (e: ValidationError) =>
          !(e.keyword === "const" && constPathsRef.current.has(e.path))
      );
    }

    return errs;
  }, [tick, transformError, constErrorStrategy]);

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    console.log("Submit button clicked");
    
    const ok = engineRef.current.validate() as boolean;
    const st = engineRef.current.getState();
    let errs: ValidationError[] = st.errors;
    if (transformError)
      errs = errs.map(transformError).filter(Boolean) as ValidationError[];
    if (constErrorStrategy === "suppress-when-managed") {
      errs = errs.filter(
        (er) => !(er.keyword === "const" && constPathsRef.current.has(er.path))
      );
    }
    
    // Check if any errors are on primitive fields
    const hasPrimitiveErrors = errs.some(error => isPrimitiveField(error.path));
    setHasErrors(hasPrimitiveErrors);
    
    const ctx: ValidateCtx = {
      valid: ok,
      errors: errs,
      data: st.data,
      ts: Date.now(),
    };

    console.log("Form validation result:", { valid: ok, errors: errs.length });
    console.log("Form data:", st.data);
    
    if (errs.length > 0) {
      console.log("Validation errors:", errs);
    }

    if (!ok) {
      console.log("Form validation failed, not submitting");
      
      // Show validation errors in an alert
      if (errs.length > 0) {
        const errorMessages = errs.map((error, index) => 
          `${index + 1}. ${error.message} (${error.path})`
        ).join('\n');
        
        alert(`Form validation failed. Please fix the following errors:\n\n${errorMessages}`);
      } else {
        alert("Form validation failed. Please check your inputs.");
      }
      
      if (onValidate) await onValidate(ctx);
      if (onSubmitFailed) await onSubmitFailed(ctx);
      if (errs[0]) {
        const id = sanitizeId(errs[0].path);
        document.getElementById(id)?.focus?.();
      }
      setTick((x) => x + 1);
      return;
    }
    
    console.log("Form validation passed, proceeding with submission");
    if (onValidate) await onValidate(ctx);
    if (onBeforeSubmit) {
      const proceed = await onBeforeSubmit(ctx);
      if (proceed === false) {
        console.log("Submission cancelled by onBeforeSubmit");
        return;
      }
    }
    if (onSubmit) {
      console.log("Calling onSubmit callback with data:", st.data);
      await onSubmit(st.data);
    } else {
      console.log("No onSubmit callback provided");
    }
    if (debug) alert(JSON.stringify(st.data, null, 2));
  };

  const fieldError = (path: string) => errors.find((e) => e.path === path);

  // Helper function to determine if accordion should be used
  const checkShouldUseAccordion = (schema: any): boolean => {
    
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
  };

  // Inline row for additionalProperties key add
  const renderAddKeyRow = (path: string) => {
    const [key, setKey] = useState(""); // NOTE: local hook in render helper is not allowed; replace with controlled below
    // We cannot use hooks here (this is not a component). Implement as inline controlled inputs via a tiny inner component:
    const AddKeyRow: React.FC = () => {
      const [k, setK] = useState("");
      return (
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <input
            className={prefix("input")}
            placeholder="new key"
            value={k}
            onChange={(e) => setK(e.currentTarget.value)}
          />
          <button
            type="button"
            onClick={() => {
              const name = k.trim();
              if (!name) return;
              const next = { ...engineRef.current.getState().data };
              const segs = path ? path.split(".") : [];
              let cur: any = next;
              for (const seg of segs) {
                cur[seg] = cur[seg] ?? {};
                cur = cur[seg];
              }
              if (cur[name] !== undefined) return;
              cur[name] = undefined;
              engineRef.current.reset(next);
              setK("");
              setTick((x) => x + 1);
              runPostChange();
            }}
          >
            Add
          </button>
        </div>
      );
    };
    return <AddKeyRow />;
  };

  // reset const path tracking before each render pass
  resetConstPaths();
  hiddenConstPathsRef.current = new Set();

  const req: string[] = (schema as any).required || [];
  return (
    <form className={`${prefix("form")} ${hasErrors ? "is-invalid" : ""}`} noValidate onSubmit={handleSubmit}>
      {(schema as any).type === "object" || (schema as any).properties
        ? Object.entries((schema as any).properties || {}).map(([k, s]) => (
            <React.Fragment key={k}>
              <FieldRenderer
                schema={s}
                path={k}
                required={req.includes(k)}
                value={getByPath(state.data, k)}
                error={fieldError(k)}
                isDirty={state.dirty.has(k)}
                hasSubmitted={hasSubmitted}
                classNamePrefix={classNamePrefix}
                onChange={applyChange}
                onAddItem={addItem}
                onRemoveItem={removeItem}
                onSetBranch={setBranch}
                getSchemaAtPath={getSchemaAtPath}
                applyConstTagsForBranch={applyConstTagsForBranch}
                checkShouldUseAccordion={checkShouldUseAccordion}
                constVisibility={constVisibility}
                autoConstTagging={autoConstTagging}
                constErrorStrategy={constErrorStrategy}
                hiddenConstPathsRef={hiddenConstPathsRef}
                constPathsRef={constPathsRef}
                engineRef={engineRef}
                setTick={setTick}
                runPostChange={runPostChange}
                fieldError={fieldError}
              />
            </React.Fragment>
          ))
        : (
            <FieldRenderer
              schema={schema}
              path=""
              required={false}
              value={state.data}
              error={fieldError("")}
              isDirty={false}
              hasSubmitted={hasSubmitted}
              classNamePrefix={classNamePrefix}
              onChange={applyChange}
              onAddItem={addItem}
              onRemoveItem={removeItem}
              onSetBranch={setBranch}
              getSchemaAtPath={getSchemaAtPath}
              applyConstTagsForBranch={applyConstTagsForBranch}
              checkShouldUseAccordion={checkShouldUseAccordion}
              constVisibility={constVisibility}
              autoConstTagging={autoConstTagging}
              constErrorStrategy={constErrorStrategy}
              hiddenConstPathsRef={hiddenConstPathsRef}
              constPathsRef={constPathsRef}
              engineRef={engineRef}
              setTick={setTick}
              runPostChange={runPostChange}
              fieldError={fieldError}
            />
          )}

      <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
        <button type="submit">Submit</button>
        {showReset && (
          <button
            type="button"
            onClick={async () => {
              engineRef.current.reset();
              setTick((x) => x + 1);
              if (onReset) await onReset(engineRef.current.getState().data);
              runPostChange();
            }}
          >
            Reset
          </button>
        )}
      </div>

      {debug && (
        <pre
          style={{
            background: "#fafafa",
            border: "1px solid #eee",
            padding: 8,
            borderRadius: 8,
            marginTop: 12,
          }}
        >
          {JSON.stringify(
            { data: engineRef.current.getState().data, errors },
            null,
            2
          )}
        </pre>
      )}

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmationDialog.isOpen}
        title="Clear Data?"
        message="Switching to a different variant will clear the current data. Do you want to continue?"
        onConfirm={handleConfirmSwitch}
        onCancel={handleCancelSwitch}
      />
    </form>
  );
};

export default JsonSchemaForm;
export { FieldRenderer };
