import React from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  fieldTypes,
  titleCase,
  type Field,
  type Recipient,
  type SourceDocument,
} from "./types";

export default function Fields({
  fields,
  recipients,
  documents,
  selected,
  select,
  change,
  add,
  remove,
  editable,
}: {
  fields: Field[];
  recipients: Recipient[];
  documents: SourceDocument[];
  selected: string;
  select: (field: Field) => void;
  change: (field: Field, patch: Partial<Field>) => void;
  add: () => void;
  remove: (field: Field) => void;
  editable: boolean;
}) {
  const field = fields.find(item => item.id === selected);
  const source = documents.find(
    document => document.key === field?.document_id
  );
  const signers = recipients.filter(person => person.role === "signer");
  const signature = field?.type === "signature" || field?.type === "initials";

  return (
    <section aria-label="Document fields" className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold">Fields ({fields.length})</h2>
        {editable && (
          <Button
            type="button"
            variant="outline"
            disabled={!signers.length || fields.length >= 100}
            onClick={add}
          >
            Add field
          </Button>
        )}
      </div>
      {!signers.length && editable && (
        <p className="text-sm text-muted-foreground">
          Add a signer to place fields.
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {fields.map(item => (
          <Button
            type="button"
            key={item.id}
            variant={selected === item.id ? "default" : "outline"}
            aria-label={`Edit ${item.label}`}
            onClick={() => select(item)}
          >
            {item.label}
          </Button>
        ))}
      </div>
      {field && source && (
        <fieldset
          disabled={!editable}
          className="space-y-3 rounded-lg border border-border p-3"
        >
          <legend className="px-1 font-medium">Selected field</legend>
          <div>
            <Label htmlFor="signature-field-label">Field label</Label>
            <Input
              id="signature-field-label"
              value={field.label}
              required
              maxLength={200}
              onChange={event => change(field, { label: event.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="signature-field-type">Field type</Label>
            <select
              id="signature-field-type"
              className="signatures-select"
              value={field.type}
              onChange={event => {
                const type = event.target.value as Field["type"];
                change(field, {
                  type,
                  value: undefined,
                  read_only: false,
                  options:
                    type === "dropdown" ? ["Option 1", "Option 2"] : undefined,
                });
              }}
            >
              {fieldTypes.map(type => (
                <option key={type} value={type}>
                  {titleCase(type)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="signature-field-recipient">
              Assigned recipient
            </Label>
            <select
              id="signature-field-recipient"
              className="signatures-select"
              value={field.recipient_id}
              onChange={event =>
                change(field, { recipient_id: event.target.value })
              }
            >
              {signers.map(person => (
                <option key={person.id} value={person.id}>
                  {person.name || "Unnamed signer"} — {person.email}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="signature-field-document">Field document</Label>
            <select
              id="signature-field-document"
              className="signatures-select"
              value={field.document_id}
              onChange={event =>
                change(field, { document_id: event.target.value, page: 1 })
              }
            >
              {documents.map(document => (
                <option key={document.key} value={document.key}>
                  {document.filename}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="signature-field-page">Field page</Label>
            <Input
              id="signature-field-page"
              type="number"
              min={1}
              max={source.pages.length}
              step={1}
              required
              value={field.page}
              onChange={event =>
                change(field, { page: Number(event.target.value) })
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(["x", "y", "width", "height"] as const).map(key => (
              <div key={key}>
                <Label htmlFor={`signature-field-${key}`}>
                  {
                    {
                      x: "Left (%)",
                      y: "Top (%)",
                      width: "Width (%)",
                      height: "Height (%)",
                    }[key]
                  }
                </Label>
                <Input
                  id={`signature-field-${key}`}
                  type="number"
                  required
                  step="any"
                  min={key === "x" || key === "y" ? 0 : 1}
                  max={
                    Math.round(
                      {
                        x: 100 - field.width,
                        y: 100 - field.height,
                        width: 100 - field.x,
                        height: 100 - field.y,
                      }[key] * 100
                    ) / 100
                  }
                  value={field[key]}
                  onChange={event =>
                    change(field, { [key]: Number(event.target.value) })
                  }
                />
              </div>
            ))}
          </div>
          <label className="signature-check">
            <input
              type="checkbox"
              checked={field.required}
              onChange={event =>
                change(field, { required: event.target.checked })
              }
            />{" "}
            Required
          </label>
          <label className="signature-check">
            <input
              type="checkbox"
              checked={field.read_only}
              disabled={signature}
              onChange={event =>
                change(field, { read_only: event.target.checked })
              }
            />{" "}
            Read-only
          </label>
          {signature ? (
            <p className="text-xs text-muted-foreground">
              Only the assigned signer can provide a signature or initials.
            </p>
          ) : (
            <div className="space-y-2">
              {field.type === "dropdown" && (
                <div>
                  <Label htmlFor="signature-options">Dropdown options</Label>
                  <textarea
                    id="signature-options"
                    className="signatures-select min-h-24"
                    value={(field.options || []).join("\n")}
                    onChange={event =>
                      change(field, {
                        options: event.target.value.split(/\r?\n/),
                      })
                    }
                    onBlur={() =>
                      change(field, {
                        options: field.options
                          ?.map(option => option.trim())
                          .filter(Boolean),
                        value: field.options
                          ?.map(option => option.trim())
                          .includes(String(field.value))
                          ? field.value
                          : undefined,
                      })
                    }
                  />
                </div>
              )}
              <Label htmlFor="signature-value">Field value</Label>
              {["name", "email", "date"].includes(field.type) && (
                <p
                  id="signature-value-help"
                  className="text-xs text-muted-foreground"
                >
                  Leave blank to fill automatically when signing. Pre-filled
                  values use text entry; choose Read-only to preserve them.
                </p>
              )}
              {field.type === "checkbox" ? (
                <input
                  id="signature-value"
                  type="checkbox"
                  checked={field.value === true}
                  onChange={event =>
                    change(field, { value: event.target.checked })
                  }
                />
              ) : field.type === "dropdown" ? (
                <select
                  id="signature-value"
                  className="signatures-select"
                  value={String(field.value || "")}
                  onChange={event =>
                    change(field, { value: event.target.value || undefined })
                  }
                >
                  <option value="">Choose a value</option>
                  {field.options?.filter(Boolean).map((option, index) => (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  id="signature-value"
                  aria-describedby={
                    ["name", "email", "date"].includes(field.type)
                      ? "signature-value-help"
                      : undefined
                  }
                  type={
                    field.type === "date"
                      ? "date"
                      : field.type === "email"
                      ? "email"
                      : "text"
                  }
                  inputMode={field.type === "number" ? "decimal" : undefined}
                  maxLength={field.type === "number" ? 100 : 2000}
                  value={String(field.value ?? "")}
                  onChange={event =>
                    change(field, { value: event.target.value })
                  }
                />
              )}
            </div>
          )}
          {editable && (
            <Button
              type="button"
              variant="outline"
              onClick={() => remove(field)}
            >
              Remove field
            </Button>
          )}
        </fieldset>
      )}
    </section>
  );
}
