import React from "react";
import { FieldRendererProps } from "../../types/field-types";

export interface AdditionalPropertiesRendererProps {
  path: string;
  classNamePrefix: string;
  additionalSchema: any;
  value: any;
  isDirty: boolean;
  hasSubmitted: boolean;
  fieldError?: (path: string) => any;
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
  schemaProperties: Record<string, any>;
}

export const AdditionalPropertiesRenderer: React.FC<AdditionalPropertiesRendererProps> = (props) => {
  const {
    path,
    classNamePrefix,
    additionalSchema,
    value,
    isDirty,
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
    schemaProperties,
  } = props;

  const objVal = value || {};
  const extraKeys = Object.keys(objVal).filter((k: string) => !schemaProperties[k]);
  const [editingKey, setEditingKey] = React.useState<string | null>(null);
  const [editingValue, setEditingValue] = React.useState<string>("");

  const handleRemoveKey = (key: string) => {
    const next = { ...engineRef.current.getState().data };
    const segs = path ? path.split(".") : [];
    let cur: any = next;
    for (const seg of segs) {
      cur[seg] = cur[seg] ?? {};
      cur = cur[seg];
    }
    delete cur[key];
    engineRef.current.reset(next);
    setTick((x: number) => x + 1);
    runPostChange();
  };

  const handleStartEdit = (key: string) => {
    const currentValue = getByPath(objVal, key);
    setEditingKey(key);
    setEditingValue(currentValue != null ? String(currentValue) : "");
  };

  const handleSaveEdit = async () => {
    if (editingKey) {
      const fullPath = path ? `${path}.${editingKey}` : editingKey;
      await onChange(fullPath, editingValue);
      setEditingKey(null);
      setEditingValue("");
    }
  };

  const handleCancelEdit = () => {
    setEditingKey(null);
    setEditingValue("");
  };

  const formatValue = (val: any): string => {
    if (val == null) return "";
    if (typeof val === "object") return JSON.stringify(val);
    return String(val);
  };

  const AddKeyRow: React.FC = () => {
    const [key, setKey] = React.useState("");
    
    const handleAddKey = () => {
      const name = key.trim();
      if (!name) return;
      const next = { ...engineRef.current.getState().data };
      const segs = path ? path.split(".") : [];
      let cur: any = next;
      for (const seg of segs) {
        cur[seg] = cur[seg] ?? {};
        cur = cur[seg];
      }
      if (cur[name] !== undefined) return;
      cur[name] = undefined;
      engineRef.current.reset(next);
      setKey("");
      setTick((x: number) => x + 1);
      runPostChange();
    };

    return (
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <input
          className={classNamePrefix + "input"}
          placeholder="new key"
          value={key}
          onChange={(e) => setKey(e.currentTarget.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              handleAddKey();
            }
          }}
        />
        <button
          type="button"
          onClick={handleAddKey}
          disabled={!key.trim()}
        >
          Add
        </button>
      </div>
    );
  };

  if (!additionalSchema) {
    return null;
  }

  return (
    <div style={{ marginTop: 6 }}>
      <strong>Additional properties</strong>
      {extraKeys.length > 0 && (
        <table style={{ width: "100%", marginTop: 8, borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ border: "1px solid #ccc", padding: "8px", textAlign: "left" }}>KEY</th>
              <th style={{ border: "1px solid #ccc", padding: "8px", textAlign: "left" }}>VALUE</th>
              <th style={{ border: "1px solid #ccc", padding: "8px", textAlign: "left" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {extraKeys.map((key) => (
              <tr key={key}>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                  {key}
                </td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                  {editingKey === key ? (
                    <div style={{ display: "flex", gap: "4px" }}>
                      <input
                        className={classNamePrefix + "input"}
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            handleSaveEdit();
                          } else if (e.key === "Escape") {
                            handleCancelEdit();
                          }
                        }}
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleSaveEdit}
                        style={{ fontSize: "12px", padding: "2px 6px" }}
                      >
                        ✓
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        style={{ fontSize: "12px", padding: "2px 6px" }}
                      >
                        ✗
                      </button>
                    </div>
                  ) : (
                    <span
                      style={{ cursor: "pointer", minHeight: "20px", display: "block" }}
                      onClick={() => handleStartEdit(key)}
                      title="Click to edit"
                    >
                      {formatValue(getByPath(objVal, key)) || <em style={{ color: "#999" }}>empty</em>}
                    </span>
                  )}
                </td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                  <button
                    type="button"
                    onClick={() => handleRemoveKey(key)}
                    className={classNamePrefix + "button-remove"}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <AddKeyRow />
    </div>
  );
};

// Helper function to get value by path
function getByPath(obj: any, key: string): any {
  if (obj == null) return undefined;
  return obj[key];
}
