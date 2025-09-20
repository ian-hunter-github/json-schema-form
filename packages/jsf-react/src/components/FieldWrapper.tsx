import React from "react";
import { ValidationError } from "@ianhunterpersonal/jsf-core";
import { FieldWrapperProps } from "../types/field-types";

export const FieldWrapper: React.FC<FieldWrapperProps> = ({
  children,
  path,
  title,
  required,
  error,
  isDirty,
  hasSubmitted,
  classNamePrefix,
  fieldType,
  id,
}) => {
  const wrapCls = [
    classNamePrefix + "field",
    error ? "is-error" : "",
    isDirty ? "is-dirty" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={wrapCls}
      data-field-name={path}
      data-field-type={fieldType}
    >
      <label className={classNamePrefix + "label"} htmlFor={id}>
        {title}
        {required ? <span className={classNamePrefix + "required-asterisk"}> *</span> : ""}
      </label>
      {children}
      {error && (isDirty || hasSubmitted) && (
        <div className={classNamePrefix + "error"} id={id + "-err"}>
          {error.message}
        </div>
      )}
    </div>
  );
};
