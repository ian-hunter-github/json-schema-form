import React from "react";
import { FieldRendererProps } from "../../types/field-types";
import { FieldWrapper } from "../FieldWrapper";
import { FieldRenderer } from "../FieldRenderer";

export const OneOfFieldRenderer: React.FC<FieldRendererProps> = (props) => {
  const {
    schema,
    path,
    required,
    value,
    error,
    isDirty,
    hasSubmitted,
    classNamePrefix,
    fieldError,
    onChange,
    onAddItem,
    onRemoveItem,
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

  const group = schema.oneOf || schema.anyOf;
  const activeIndex = engineRef.current.getState().activeOneOf?.[path] ?? 0;
  const activeSchema = group?.[activeIndex];

  const handleBranchChange = (index: number) => {
    const branchSchema = group?.[index];
    onSetBranch?.(path, index, branchSchema);
    setTick((x: number) => x + 1);
    runPostChange();
  };

  return (
    <FieldWrapper
      path={path}
      title={title}
      required={required}
      error={error}
      isDirty={isDirty}
      hasSubmitted={hasSubmitted}
      classNamePrefix={classNamePrefix}
      fieldType="oneOf"
      id={id}
    >
      <div>
        <select
          className={classNamePrefix + "select"}
          value={activeIndex}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
            handleBranchChange(Number(e.target.value));
          }}
        >
          {group?.map((branch: any, index: number) => (
            <option key={index} value={index}>
              {branch.title || `Option ${index + 1}`}
            </option>
          ))}
        </select>

        {activeSchema && (
          <FieldRenderer
            schema={activeSchema}
            path={path}
            required={required}
            value={value}
            error={error}
            isDirty={isDirty}
            hasSubmitted={hasSubmitted}
            classNamePrefix={classNamePrefix}
            isOneOfBranch={true}
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
          />
        )}
      </div>
    </FieldWrapper>
  );
};
