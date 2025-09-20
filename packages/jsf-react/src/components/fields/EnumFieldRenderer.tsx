import React from "react";
import { FieldRendererProps } from "../../types/field-types";
import { FieldWrapper } from "../FieldWrapper";

export const EnumFieldRenderer: React.FC<FieldRendererProps> = (props) => {
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

  const strValue =
    typeof value === "string"
      ? value
      : value == null
      ? ""
      : JSON.stringify(value);
  
  const labels: string[] = (
    schema["x-enumNames"] ||
    schema["x-enum-labels"] ||
    schema.enum
  ).map((x: any) => String(x));

  return (
    <FieldWrapper
      path={path}
      title={title}
      required={required}
      error={error}
      isDirty={isDirty}
      hasSubmitted={hasSubmitted}
      classNamePrefix={classNamePrefix}
      fieldType="enum"
      id={id}
    >
      <select
        id={id}
        className={[classNamePrefix + "select", isDirty ? "is-dirty" : ""].filter(Boolean).join(" ")}
        value={strValue}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
          let v: any = e.target.value;
          if (schema.enum.some((x: any) => typeof x !== "string")) {
            try {
              v = JSON.parse(v);
            } catch {}
          }
          onChange(path, v);
        }}
      >
        <option value="">-- select --</option>
        {schema.enum.map((v: any, i: number) => (
          <option
            key={i}
            value={typeof v === "string" ? v : JSON.stringify(v)}
          >
            {labels[i]}
          </option>
        ))}
      </select>
    </FieldWrapper>
  );
};
