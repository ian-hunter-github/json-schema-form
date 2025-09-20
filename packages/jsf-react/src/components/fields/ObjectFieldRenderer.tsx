import React from "react";
import { FieldRendererProps } from "../../types/field-types";
import { FieldWrapper } from "../FieldWrapper";
import { FieldRenderer } from "../FieldRenderer";
import { Accordion } from "../../Accordion";
import { AdditionalPropertiesRenderer } from "./AdditionalPropertiesRenderer";

export const ObjectFieldRenderer: React.FC<FieldRendererProps> = (props) => {
  const {
    schema,
    path,
    required,
    value,
    error,
    isDirty,
    hasSubmitted,
    classNamePrefix,
    isOneOfBranch,
    checkShouldUseAccordion,
    fieldError,
    onChange,
    onAddItem,
    onRemoveItem,
    onSetBranch,
    getSchemaAtPath,
    applyConstTagsForBranch,
    constVisibility,
    autoConstTagging,
    constErrorStrategy,
    hiddenConstPathsRef,
    constPathsRef,
    engineRef,
    setTick,
    runPostChange,
  } = props;
  
  // Check if any child fields have errors
  const hasChildErrors = React.useMemo(() => {
    if (!schema?.properties || !fieldError) return false;
    
    return Object.keys(schema.properties).some(key => {
      const childPath = path ? `${path}.${key}` : key;
      return !!fieldError(childPath);
    });
  }, [schema, path, fieldError]);

  // Combine object-level error with child errors for display
  const displayError = error || (hasChildErrors ? {
    path,
    message: "This section contains validation errors",
    keyword: "object"
  } : undefined);
  
  const id = `jsf-${path.replace(/\./g, "-")}`;
  const title =
    schema?.title ?? ((path ? path.split(".").slice(-1)[0] : "field") || "field");

  const req: string[] = schema.required || [];
  const additionalSchema =
    schema.additionalProperties && typeof schema.additionalProperties === "object"
      ? schema.additionalProperties
      : null;

  // Check if we should use accordion using the helper function
  const shouldUseAccordion = checkShouldUseAccordion(schema);

  const content = (
    <>
      {Object.entries(schema.properties || {}).map(([k, sub]) => (
        <React.Fragment key={k}>
          <FieldRenderer
            schema={sub as any}
            path={path ? `${path}.${k}` : k}
            required={req.includes(k)}
            value={getByPath(value, k)}
            error={fieldError?.(path ? `${path}.${k}` : k)}
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
        </React.Fragment>
      ))}

      {additionalSchema && (
        <AdditionalPropertiesRenderer
          path={path}
          classNamePrefix={classNamePrefix}
          additionalSchema={additionalSchema}
          value={value}
          isDirty={isDirty}
          hasSubmitted={hasSubmitted}
          fieldError={fieldError}
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
          schemaProperties={schema.properties || {}}
        />
      )}
      {displayError && (isDirty || hasSubmitted) && (
        <div className={classNamePrefix + "error"} id={id + "-err"}>
          {displayError.message}
        </div>
      )}
    </>
  );

  // If this is a oneOf branch, check if accordion should be used but don't render separate header
  if (isOneOfBranch) {
    const shouldUseAccordion = checkShouldUseAccordion(schema);
    
    if (shouldUseAccordion) {
      return (
        <Accordion 
          title={title + (required ? " *" : "")}
          defaultExpanded={true}
          className={[
            classNamePrefix + "field",
            displayError ? "is-error" : "",
            isDirty ? "is-dirty" : "",
          ].filter(Boolean).join(" ")}
        >
          {content}
        </Accordion>
      );
    } else {
      return (
        <div className={[
          classNamePrefix + "field",
          displayError ? "is-error" : "",
          isDirty ? "is-dirty" : "",
        ].filter(Boolean).join(" ") + " " + classNamePrefix + "object"}>
          {content}
        </div>
      );
    }
  }

  if (shouldUseAccordion) {
    return (
      <Accordion 
        title={title + (required ? " *" : "")}
        defaultExpanded={true}
        className={[
          classNamePrefix + "field",
          displayError ? "is-error" : "",
          isDirty ? "is-dirty" : "",
        ].filter(Boolean).join(" ")}
      >
        {content}
      </Accordion>
    );
  } else {
    return (
      <fieldset
        className={[
          classNamePrefix + "field",
          displayError ? "is-error" : "",
          isDirty ? "is-dirty" : "",
        ].filter(Boolean).join(" ") + " " + classNamePrefix + "object"}
        data-field-name={path}
        data-field-type={"object"}
      >
        <legend className={classNamePrefix + "label"}>
          {title}
          {required ? " *" : ""}
        </legend>
        {content}
      </fieldset>
    );
  }
};

// Helper function to get value by path
function getByPath(obj: any, key: string): any {
  if (obj == null) return undefined;
  return obj[key];
}
