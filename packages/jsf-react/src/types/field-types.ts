import React from "react";
import { JSONSchema, ValidationError } from "@ianhunterpersonal/jsf-core";

export interface FieldRendererProps {
  schema: any;
  path: string;
  required: boolean;
  isOneOfBranch?: boolean;
  value: any;
  error?: ValidationError;
  isDirty: boolean;
  hasSubmitted: boolean;
  classNamePrefix: string;
  onChange: (path: string, value: any) => Promise<void>;
  onAddItem?: (path: string) => Promise<void>;
  onRemoveItem?: (path: string, index: number) => Promise<void>;
  onSetBranch?: (path: string, index: number, branchSchema: any) => Promise<void>;
  getSchemaAtPath: (root: any, path: string) => any;
  applyConstTagsForBranch: (engine: any, path: string, branchSchema: any, enable: boolean) => void;
  checkShouldUseAccordion: (schema: any) => boolean;
  constVisibility: "hidden" | "readonly" | "visible";
  autoConstTagging: boolean;
  constErrorStrategy: "suppress-when-managed" | "show";
  hiddenConstPathsRef: React.MutableRefObject<Set<string>>;
  constPathsRef: React.MutableRefObject<Set<string>>;
  engineRef: React.MutableRefObject<any>;
  setTick: React.Dispatch<React.SetStateAction<number>>;
  runPostChange: () => void;
  fieldError?: (path: string) => ValidationError | undefined;
}

export interface FieldWrapperProps {
  children: React.ReactNode;
  path: string;
  title: string;
  required: boolean;
  error?: ValidationError;
  isDirty: boolean;
  hasSubmitted: boolean;
  classNamePrefix: string;
  fieldType: string;
  id: string;
}

export type FieldRenderer = React.ComponentType<FieldRendererProps>;
