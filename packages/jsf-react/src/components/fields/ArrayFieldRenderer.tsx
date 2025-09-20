import React from "react";
import { FieldRendererProps } from "../../types/field-types";
import { FieldWrapper } from "../FieldWrapper";
import { FieldRenderer } from "../FieldRenderer";

export const ArrayFieldRenderer: React.FC<FieldRendererProps> = (props) => {
  const {
    schema,
    path,
    required,
    value,
    error,
    isDirty,
    hasSubmitted,
    classNamePrefix,
    onAddItem,
    onRemoveItem,
    fieldError,
    onChange,
    onSetBranch,
    getSchemaAtPath,
    applyConstTagsForBranch,
    checkShouldUseAccordion,
    constVisibility,
    autoConstTagging,
    constErrorStrategy,
    hiddenConstPathsRef,
    constPathsRef,
    engineRef,
    setTick,
    runPostChange,
  } = props;
  const id = `jsf-${path.replace(/\./g, "-")}`;
  const title =
    schema?.title ?? ((path ? path.split(".").slice(-1)[0] : "field") || "field");

  const items = Array.isArray(value) ? value : [];

  return (
    <FieldWrapper
      path={path}
      title={title}
      required={required}
      error={error}
      isDirty={isDirty}
      hasSubmitted={hasSubmitted}
      classNamePrefix={classNamePrefix}
      fieldType="array"
      id={id}
    >
      <div>
        {items.map((_v: any, i: number) => (
          <div key={i} style={{ marginBottom: 8 }}>
            <FieldRenderer
              schema={schema.items}
              path={`${path}.${i}`}
              required={false}
              value={getByPath(value, i)}
              error={fieldError?.(`${path}.${i}`)}
              isDirty={isDirty}
              hasSubmitted={hasSubmitted}
              classNamePrefix={classNamePrefix}
              onChange={onChange}
              onAddItem={onAddItem}
              onRemoveItem={onRemoveItem}
              onSetBranch={onSetBranch}
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
            />
            <button type="button" onClick={() => onRemoveItem?.(path, i)}>
              Remove
            </button>
          </div>
        ))}
        <button type="button" onClick={() => onAddItem?.(path)}>
          Add
        </button>
      </div>
    </FieldWrapper>
  );
};

// Helper function to get value by path
function getByPath(obj: any, path: string | number): any {
  if (obj == null) return undefined;
  if (typeof path === "number") return obj[path];
  const segments = path.split(".");
  let current = obj;
  for (const segment of segments) {
    if (current == null) return undefined;
    current = current[segment];
  }
  return current;
}
