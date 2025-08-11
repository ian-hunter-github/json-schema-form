export type JSONSchema = any; // Draft-07+

export type Path = string;

export interface ValidationError {
  path: Path;
  message: string;
  keyword: string;
}

export interface EngineOptions {
  allowExternalRefs?: boolean;
  debounceMs?: number;
  keepDataOnOneOfSwitch?: boolean;
  debug?: boolean;
}

export interface FormState {
  data: any;
  dirty: Set<string>;
  errors: ValidationError[];
  activeOneOf: Record<Path, number>;
}

export interface Engine {
  getState(): FormState;
  setValue(path: Path, value: any): void;
  addArrayItem(path: Path, value?: any): void;
  removeArrayItem(path: Path, index: number): void;
  setActiveBranch(containerPath: Path, index: number): void;
  validate(): boolean;
  getErrors(): ValidationError[];
  getSchema(): JSONSchema;
  setSchema(schema: JSONSchema): void;
  reset(data?: any): void;
}
