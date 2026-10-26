import React from "react";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { type FormField, type FormSchema } from "./types";

const customTypes = {
  text: "Short text",
  textarea: "Long text",
  email: "Email",
  url: "URL",
  number: "Number",
  date: "Date",
  select: "Choice",
  checkbox: "Yes or no",
};

export default function FormSettings({
  value,
  change,
}: {
  value: FormSchema;
  change: (form: FormSchema) => void;
}) {
  const update = (id: string, attributes: Partial<FormField>) =>
    change({
      ...value,
      fields: value.fields.map(field =>
        field.id === id ? { ...field, ...attributes } : field
      ),
    });

  return (
    <section
      aria-label="Candidate application form"
      className="min-w-0 space-y-4 border-t pt-5 md:col-span-2"
    >
      <h3 className="font-semibold">Candidate application form</h3>
      <div className="flex items-center gap-3">
        <Checkbox
          id="hiring-form-enabled"
          aria-label="Enable candidate forms"
          checked={value.enabled}
          onCheckedChange={checked =>
            change({ ...value, enabled: checked === true })
          }
        />
        <Label
          htmlFor="hiring-form-enabled"
          className="inline-flex min-h-11 items-center"
        >
          Enable candidate forms
        </Label>
      </div>
      <p className="text-sm text-muted-foreground">
        Add a private application link to approved acknowledgements. Saving does
        not send email or change forms already issued.
      </p>
      <p className="text-xs text-muted-foreground">
        Compensation is restricted. Previously restricted answers remain
        restricted on their original forms.
      </p>
      <div className="grid min-w-0 grid-cols-1 gap-3 lg:grid-cols-2">
        {value.fields.map(field => {
          const custom = field.id.startsWith("custom_");

          return (
            <fieldset
              key={field.id}
              data-field-id={field.id}
              data-custom-field={custom ? "true" : undefined}
              className="min-w-0 space-y-3 rounded-lg border p-3"
            >
              <div className="space-y-2">
                <Label
                  htmlFor={`form-label-${field.id}`}
                  className="break-words"
                >
                  {custom ? "Field label" : `${field.label} label`}
                </Label>
                <Input
                  id={`form-label-${field.id}`}
                  value={field.label}
                  required
                  maxLength={120}
                  onChange={event =>
                    update(field.id, { label: event.target.value })
                  }
                />
              </div>
              {custom && (
                <div className="space-y-2">
                  <Label htmlFor={`form-type-${field.id}`}>Answer type</Label>
                  <Select
                    value={field.type}
                    onValueChange={type =>
                      update(field.id, {
                        type,
                        choices:
                          type === "select" ? field.choices || [] : undefined,
                      })
                    }
                  >
                    <SelectTrigger id={`form-type-${field.id}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(customTypes).map(([type, label]) => (
                        <SelectItem key={type} value={type}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {custom && field.type === "select" && (
                <div className="space-y-2">
                  <Label htmlFor={`form-choices-${field.id}`}>
                    Choices, one per line
                  </Label>
                  <Textarea
                    id={`form-choices-${field.id}`}
                    value={(field.choices || []).join("\n")}
                    maxLength={3630}
                    onChange={event =>
                      update(field.id, {
                        choices: event.target.value.split("\n"),
                      })
                    }
                  />
                </div>
              )}
              <div className="flex flex-wrap gap-x-5 gap-y-1">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`form-required-${field.id}`}
                    aria-label={`Require ${field.label}`}
                    checked={field.required}
                    onCheckedChange={checked =>
                      update(field.id, { required: checked === true })
                    }
                  />
                  <Label
                    htmlFor={`form-required-${field.id}`}
                    className="inline-flex min-h-11 items-center"
                  >
                    Required
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`form-sensitive-${field.id}`}
                    aria-label={`Restrict ${field.label}`}
                    checked={field.sensitive}
                    disabled={field.type === "compensation"}
                    onCheckedChange={checked =>
                      update(field.id, { sensitive: checked === true })
                    }
                  />
                  <Label
                    htmlFor={`form-sensitive-${field.id}`}
                    className="inline-flex min-h-11 items-center"
                  >
                    Restricted answer
                  </Label>
                </div>
              </div>
              {custom && (
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11"
                  onClick={() =>
                    change({
                      ...value,
                      fields: value.fields.filter(item => item.id !== field.id),
                    })
                  }
                >
                  Remove custom field
                </Button>
              )}
            </fieldset>
          );
        })}
      </div>
      <Button
        type="button"
        variant="outline"
        className="min-h-11"
        disabled={value.fields.length >= 61}
        onClick={() =>
          change({
            ...value,
            fields: [
              ...value.fields,
              {
                id: `custom_field_${window.crypto
                  .randomUUID()
                  .replace(/-/g, "")}`,
                label: "",
                type: "text",
                required: false,
                sensitive: false,
              },
            ],
          })
        }
      >
        Add custom field
      </Button>
    </section>
  );
}
