import React from "react";
import { FieldRendererProps } from "../types/field-types";
import { ConstFieldRenderer } from "./fields/ConstFieldRenderer";
import { EnumFieldRenderer } from "./fields/EnumFieldRenderer";
import { PrimitiveFieldRenderer } from "./fields/PrimitiveFieldRenderer";
import { ArrayFieldRenderer } from "./fields/ArrayFieldRenderer";
import { ObjectFieldRenderer } from "./fields/ObjectFieldRenderer";
import { OneOfFieldRenderer } from "./fields/OneOfFieldRenderer";

export const FieldRenderer: React.FC<FieldRendererProps> = (props) => {
  const { schema } = props;
  
  // Handle const fields
  if (schema && typeof schema === "object" && Object.prototype.hasOwnProperty.call(schema, "const")) {
    return <ConstFieldRenderer {...props} />;
  }

  // Handle oneOf/anyOf fields
  if (Array.isArray(schema?.oneOf) || Array.isArray(schema?.anyOf)) {
    return <OneOfFieldRenderer {...props} />;
  }

  // Handle enum fields
  if (Array.isArray(schema?.enum)) {
    return <EnumFieldRenderer {...props} />;
  }

  // Handle object fields
  const t = Array.isArray(schema?.type)
    ? schema.type.find((x: any) => x !== "null")
    : schema?.type;
  
  if (t === "object" || schema?.properties) {
    return <ObjectFieldRenderer {...props} />;
  }

  // Handle array fields
  if (t === "array" || schema?.items) {
    return <ArrayFieldRenderer {...props} />;
  }

  // Handle primitive fields (string, number, boolean, etc.)
  return <PrimitiveFieldRenderer {...props} />;
};
