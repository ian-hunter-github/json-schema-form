import React from "react";
import { FieldRendererProps } from "../../types/field-types";
import { FieldWrapper } from "../FieldWrapper";

export const ConstFieldRenderer: React.FC<FieldRendererProps> = (props) => {
  const {
    schema,
    path,
    required,
    value,
    error,
    isDirty,
    hasSubmitted,
    classNamePrefix,
    constVisibility,
    autoConstTagging,
    hiddenConstPathsRef,
    constPathsRef,
    engineRef,
    fieldError,
    onChange,
    onAddItem,
    onRemoveItem,
    onSetBranch,
    getSchemaAtPath,
    applyConstTagsForBranch,
    checkShouldUseAccordion,
    constErrorStrategy,
    setTick,
    runPostChange,
  } = props;
  const id = `jsf-${path.replace(/\./g, "-")}`;
  const title =
    schema?.title ?? ((path ? path.split(".").slice(-1)[0] : "field") || "field");

  // Hide discriminator consts that are registered for this path
  if (hiddenConstPathsRef.current.has(path)) {
    if (autoConstTagging) engineRef.current.setValue(path, schema.const);
    return null;
  }

  constPathsRef.current.add(path);
  if (autoConstTagging) engineRef.current.setValue(path, schema.const);
  const display =
    typeof schema.const === "string" ? schema.const : JSON.stringify(schema.const);

  if (constVisibility === "hidden") return null;

  if (constVisibility === "readonly") {
    return (
      <FieldWrapper
        path={path}
        title={title}
        required={required}
        error={error}
        isDirty={isDirty}
        hasSubmitted={hasSubmitted}
        classNamePrefix={classNamePrefix}
        fieldType="const"
        id={id}
      >
        <div
          className={classNamePrefix + "input"}
          id={id}
          aria-readonly="true"
          style={{ opacity: 0.8 }}
        >
          {display}
        </div>
      </FieldWrapper>
    );
  }

  // visible: disabled input
  return (
    <FieldWrapper
      path={path}
      title={title}
      required={required}
      error={error}
      isDirty={isDirty}
      hasSubmitted={hasSubmitted}
      classNamePrefix={classNamePrefix}
      fieldType="const"
      id={id}
    >
      <input
        className={classNamePrefix + "input"}
        id={id}
        value={display}
        disabled
        aria-readonly="true"
      />
    </FieldWrapper>
  );
};
