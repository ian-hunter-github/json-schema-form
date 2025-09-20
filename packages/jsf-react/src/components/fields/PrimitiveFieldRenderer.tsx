import React from "react";
import { FieldRendererProps } from "../../types/field-types";
import { FieldWrapper } from "../FieldWrapper";

export const PrimitiveFieldRenderer: React.FC<FieldRendererProps> = (props) => {
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

  const t = Array.isArray(schema?.type)
    ? schema.type.find((x: any) => x !== "null")
    : schema?.type;

  const format = schema.format;
  let inputType: React.HTMLInputTypeAttribute = "text";
  if (format === "date") inputType = "date";
  else if (format === "time") inputType = "time";
  else if (format === "date-time") inputType = "datetime-local";
  else if (format === "email") inputType = "email";
  else if (format === "uri") inputType = "url";
  else if (format === "password") inputType = "password";
  else if (t === "number" || t === "integer") inputType = "number";
  else if (t === "boolean") inputType = "checkbox";

  const inputCls = [classNamePrefix + "input", isDirty ? "is-dirty" : ""]
    .filter(Boolean)
    .join(" ");

  const commonProps = {
    id,
    className: inputCls,
    "aria-invalid": !!error || undefined,
    "aria-describedby": error ? id + "-err" : undefined,
  } as const;

  return (
    <FieldWrapper
      path={path}
      title={title}
      required={required}
      error={error}
      isDirty={isDirty}
      hasSubmitted={hasSubmitted}
      classNamePrefix={classNamePrefix}
      fieldType={String(t ?? "unknown")}
      id={id}
    >
      {format === "textarea" ? (
        <textarea
          {...commonProps}
          value={value ?? ""}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
            onChange(path, e.currentTarget.value);
          }}
          rows={4}
        />
      ) : inputType === "checkbox" ? (
        <input
          type="checkbox"
          {...commonProps}
          checked={!!value}
          onChange={(e) => onChange(path, e.currentTarget.checked)}
        />
      ) : (
        <input
          type={inputType}
          {...commonProps}
          value={value ?? ""}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const raw = e.currentTarget.value;
            let v: any = raw;
            if (t === "number" || t === "integer")
              v = raw === "" ? undefined : Number(raw);
            onChange(path, v);
          }}
        />
      )}
    </FieldWrapper>
  );
};
