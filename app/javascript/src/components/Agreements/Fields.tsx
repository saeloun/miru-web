import React, { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import type { Field, Values } from "./types";

const fieldTypes: Record<Field["type"], string> = {
  text: "Text",
  date: "Date",
  number: "Number",
  checkbox: "Checkbox",
  dropdown: "Dropdown",
  signature: "Signature",
  initials: "Initials",
};

const roles: Record<Field["role"], string> = {
  admin: "Administrator",
  counterparty: "Counterparty",
  company_signer: "Company signer",
};

const presets: Pick<Field, "key" | "label" | "type">[] = [
  { key: "company_name", label: "Company name", type: "text" },
  { key: "company_address", label: "Company address", type: "text" },
  { key: "legal_name", label: "Legal name", type: "text" },
  { key: "primary_email", label: "Primary email", type: "text" },
  { key: "finance_email", label: "Finance email", type: "text" },
  { key: "signatory_name", label: "Signatory name", type: "text" },
  { key: "signatory_email", label: "Signatory email", type: "text" },
  {
    key: "signatory_designation",
    label: "Signatory designation",
    type: "text",
  },
  { key: "registered_address", label: "Registered address", type: "text" },
  { key: "consultant_address", label: "Consultant address", type: "text" },
  { key: "joined_on", label: "Joined on", type: "date" },
  { key: "payment_amount", label: "Payment amount", type: "number" },
  { key: "payment_currency", label: "Payment currency", type: "text" },
  { key: "payment_frequency", label: "Payment frequency", type: "text" },
];

const newField = (): Field => ({
  key: "",
  label: "",
  type: "text",
  role: "counterparty",
  required: false,
  read_only: false,
});

export const FieldValue = ({
  field,
  value,
  onChange,
}: {
  field: Field;
  value: Values[string];
  onChange: (value: Values[string]) => void;
}) => {
  const id = `value-${field.key}`;
  const signing = ["signature", "initials"].includes(field.type);

  return (
    <div className="space-y-1">
      <Label htmlFor={id}>Value: {field.label}</Label>
      {signing ? (
        <p className="text-xs text-muted-foreground">
          Reserved for signing. Draft editing cannot create a signature.
        </p>
      ) : field.type === "checkbox" || field.type === "dropdown" ? (
        <select
          className="agreement-select"
          id={id}
          value={value == null ? "" : String(value)}
          onChange={event =>
            onChange(
              event.target.value === ""
                ? null
                : field.type === "checkbox"
                ? event.target.value === "true"
                : event.target.value
            )
          }
        >
          <option value="">Not provided</option>
          {(field.type === "checkbox"
            ? ["true", "false"]
            : field.options || []
          ).map(option => (
            <option key={option} value={option}>
              {field.type === "checkbox"
                ? option === "true"
                  ? "Yes"
                  : "No"
                : option}
            </option>
          ))}
        </select>
      ) : (
        <Input
          id={id}
          type={field.type === "date" ? "date" : "text"}
          inputMode={field.type === "number" ? "decimal" : undefined}
          maxLength={field.type === "text" ? 5000 : undefined}
          value={typeof value === "string" ? value : ""}
          onChange={event => onChange(event.target.value)}
        />
      )}
      {value != null && value !== "" && (
        <Button size="sm" variant="ghost" onClick={() => onChange(null)}>
          Clear {field.label}
        </Button>
      )}
      {field.read_only && (
        <p className="text-xs text-muted-foreground">
          Read-only for the future recipient; administrators can set this draft
          value.
        </p>
      )}
    </div>
  );
};

const Fields = ({
  fields,
  values,
  isDraft,
  onChange,
  onValue,
  onInsert,
  onRemove,
}: {
  fields: Field[];
  values: Values;
  isDraft: boolean;
  onChange: (fields: Field[]) => void;
  onValue: (key: string, value: Values[string]) => void;
  onInsert: (key: string) => void;
  onRemove: (key: string) => void;
}) => {
  const [expanded, setExpanded] = useState(fields[0]?.key || "");
  const [removing, setRemoving] = useState<Field | null>(null);
  const [editing, setEditing] = useState<Field | null>(null);
  const [original, setOriginal] = useState<string | null>(null);
  const [options, setOptions] = useState("");
  const [error, setError] = useState("");
  const edit = (field?: Field) => {
    setEditing(field ? { ...field } : newField());
    setOriginal(field?.key || null);
    setOptions(field?.options?.join("\n") || "");
    setError("");
  };

  const save = (event: React.FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    const next = {
      ...editing,
      options:
        editing.type === "dropdown"
          ? options
              .split("\n")
              .map(option => option.trim())
              .filter(Boolean)
          : [],
    };
    if (
      !/^[a-z][a-z0-9_]{0,63}$/.test(next.key) ||
      ["constructor", "prototype"].includes(next.key) ||
      fields.some(field => field.key === next.key && field.key !== original) ||
      !next.label.trim()
    ) {
      setError(
        "Use a unique lowercase field key starting with a letter, and a label."
      );

      return;
    }

    if (
      next.type === "dropdown" &&
      (next.options.length < 1 ||
        next.options.length > 30 ||
        new Set(next.options).size !== next.options.length ||
        next.options.some(option => option.length > 200))
    ) {
      setError(
        "Provide 1–30 distinct dropdown options, at most 200 characters each."
      );

      return;
    }

    onChange(
      original
        ? fields.map(field => (field.key === original ? next : field))
        : [...fields, next]
    );
    setExpanded(next.key);
    setEditing(null);
  };

  return (
    <aside
      className="min-w-0 space-y-4 rounded-lg border border-border bg-card p-4"
      aria-label="Document fields"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold">Fields ({fields.length}/100)</h2>
        <Button
          size="sm"
          variant="outline"
          disabled={fields.length >= 100}
          onClick={() => edit()}
        >
          Add field
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Insert a field at the cursor, then configure its type and assigned
        signer. Required blanks can be saved as drafts.
      </p>
      {fields.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No fields yet. Add identity, payment or signing placeholders.
        </p>
      )}
      {fields.map(field => (
        <section
          className="rounded-md border border-border p-3"
          key={field.key}
        >
          <button
            type="button"
            className="w-full break-words text-left text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
            aria-expanded={expanded === field.key}
            aria-controls={`field-panel-${field.key}`}
            onClick={() => setExpanded(expanded === field.key ? "" : field.key)}
          >
            {field.label}
            {field.required ? " *" : ""}
            <span className="mt-1 block text-xs font-normal text-muted-foreground">
              {fieldTypes[field.type]} · {roles[field.role]}
            </span>
          </button>
          <div
            id={`field-panel-${field.key}`}
            hidden={expanded !== field.key}
            className="mt-3 space-y-3"
          >
            <code className="break-all text-xs text-muted-foreground">
              {field.key}
            </code>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onInsert(field.key)}
              >
                Insert {field.label}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => edit(field)}>
                Edit {field.label}
              </Button>
            </div>
            {isDraft && (
              <FieldValue
                field={field}
                value={values[field.key]}
                onChange={value => onValue(field.key, value)}
              />
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setRemoving(field)}
            >
              Remove {field.label}
            </Button>
          </div>
        </section>
      ))}
      <Dialog
        open={Boolean(removing)}
        onOpenChange={open => !open && setRemoving(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove field?</DialogTitle>
            <DialogDescription>
              This removes the field, all of its placements and its draft value.
              Undo in the document can restore removed placements and their
              field definition.
            </DialogDescription>
          </DialogHeader>
          <Button variant="outline" onClick={() => setRemoving(null)}>
            Keep field
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (removing) onRemove(removing.key);
              setRemoving(null);
            }}
          >
            Remove field and placements
          </Button>
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(editing)}
        onOpenChange={open => !open && setEditing(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{original ? "Edit field" : "Add field"}</DialogTitle>
            <DialogDescription>
              Keys stay fixed so existing placements keep their meaning.
              Signatures are placeholders until signing is connected.
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <form className="space-y-4" onSubmit={save}>
              {!original && (
                <div>
                  <Label htmlFor="field-preset">Start from field</Label>
                  <select
                    className="agreement-select"
                    id="field-preset"
                    defaultValue=""
                    onChange={event => {
                      const preset = presets.find(
                        preset => preset.key === event.target.value
                      );

                      setEditing(
                        preset
                          ? { ...newField(), ...preset, role: "admin" }
                          : newField()
                      );
                      setOptions("");
                    }}
                  >
                    <option value="">Custom field</option>
                    {presets.map(preset => (
                      <option
                        key={preset.key}
                        value={preset.key}
                        disabled={fields.some(
                          field => field.key === preset.key
                        )}
                      >
                        {preset.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Identity fields prefill when generating a draft where that
                    profile detail exists. Payment terms always need explicit
                    values.
                  </p>
                </div>
              )}
              <div>
                <Label htmlFor="field-key">Field key</Label>
                <Input
                  id="field-key"
                  value={editing.key}
                  disabled={Boolean(original)}
                  maxLength={64}
                  required
                  onChange={event =>
                    setEditing({ ...editing, key: event.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="field-label">Field label</Label>
                <Input
                  id="field-label"
                  value={editing.label}
                  maxLength={120}
                  required
                  onChange={event =>
                    setEditing({ ...editing, label: event.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="field-type">Field type</Label>
                <select
                  className="agreement-select"
                  id="field-type"
                  value={editing.type}
                  onChange={event =>
                    setEditing({
                      ...editing,
                      type: event.target.value as Field["type"],
                    })
                  }
                >
                  {Object.entries(fieldTypes).map(([type, label]) => (
                    <option key={type} value={type}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="field-role">Assigned to</Label>
                <select
                  className="agreement-select"
                  id="field-role"
                  value={editing.role}
                  onChange={event =>
                    setEditing({
                      ...editing,
                      role: event.target.value as Field["role"],
                    })
                  }
                >
                  {Object.entries(roles).map(([role, label]) => (
                    <option key={role} value={role}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              {editing.type === "dropdown" && (
                <div>
                  <Label htmlFor="field-options">Dropdown options</Label>
                  <Textarea
                    id="field-options"
                    value={options}
                    placeholder="One option per line"
                    onChange={event => setOptions(event.target.value)}
                  />
                </div>
              )}
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editing.required}
                  onChange={event =>
                    setEditing({ ...editing, required: event.target.checked })
                  }
                />
                Required
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editing.read_only}
                  onChange={event =>
                    setEditing({ ...editing, read_only: event.target.checked })
                  }
                />
                Read-only for recipient
              </label>
              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditing(null)}
                >
                  Cancel
                </Button>
                <Button type="submit">Save field</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </aside>
  );
};

export default Fields;
