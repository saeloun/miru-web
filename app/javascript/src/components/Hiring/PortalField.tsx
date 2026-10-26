import React from "react";
import { Button } from "../ui/button";
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
import {
  type CompensationAnswer,
  type FormAnswer,
  type FormField,
} from "./types";

export default function PortalField({
  field,
  value,
  required,
  change,
}: {
  field: FormField;
  value: FormAnswer | undefined;
  required: boolean;
  change: (value: FormAnswer) => void;
}) {
  const id = `candidate-${field.id}`;
  if (field.type === "compensation") {
    const amount =
      value && typeof value === "object" && !Array.isArray(value)
        ? value
        : { amount: "", currency: "", period: "" };
    const filled = Object.values(amount).some(Boolean);
    const update = (key: keyof CompensationAnswer, text: string) => {
      const next = { ...amount, [key]: text };
      change(Object.values(next).some(Boolean) ? next : null);
    };

    return (
      <fieldset className="space-y-3 rounded-lg border p-4">
        <legend className="px-1 text-sm font-medium">
          {field.label}
          {required && " (required)"}
        </legend>
        <p className="text-xs text-muted-foreground">
          Leave all three fields blank if you are not providing this
          information.
        </p>
        <div className="space-y-2">
          <Label htmlFor={`${id}-amount`}>{field.label} amount</Label>
          <Input
            id={`${id}-amount`}
            inputMode="decimal"
            maxLength={27}
            required={required || filled}
            value={amount.amount}
            onChange={event => update("amount", event.target.value)}
          />
        </div>
        <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`${id}-currency`}>{field.label} currency</Label>
            <Input
              id={`${id}-currency`}
              placeholder="INR"
              maxLength={3}
              required={required || filled}
              value={amount.currency}
              onChange={event =>
                update("currency", event.target.value.toUpperCase())
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${id}-period`}>{field.label} period</Label>
            <Select
              value={amount.period}
              required={required || filled}
              onValueChange={text => update("period", text)}
            >
              <SelectTrigger id={`${id}-period`}>
                <SelectValue placeholder="Choose period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="annual">Annual</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {filled && (
          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            aria-label={`Clear ${field.label}`}
            onClick={() => change(null)}
          >
            Clear
          </Button>
        )}
      </fieldset>
    );
  }

  const text =
    typeof value === "string"
      ? value
      : Array.isArray(value)
      ? value.join("\n")
      : "";

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {field.label}
        {required && " (required)"}
      </Label>
      {field.type === "textarea" || field.type === "links" ? (
        <Textarea
          id={id}
          value={text}
          required={required}
          maxLength={field.type === "links" ? 20000 : 5000}
          onChange={event =>
            change(
              field.type === "links"
                ? event.target.value.split("\n")
                : event.target.value
            )
          }
        />
      ) : field.type === "select" || field.type === "checkbox" ? (
        <>
          <Select
            value={typeof value === "boolean" ? String(value) : text}
            required={required}
            onValueChange={answer =>
              change(field.type === "checkbox" ? answer === "true" : answer)
            }
          >
            <SelectTrigger id={id}>
              <SelectValue placeholder="Choose an answer" />
            </SelectTrigger>
            <SelectContent>
              {field.type === "checkbox" ? (
                <>
                  <SelectItem value="true">Yes</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </>
              ) : (
                field.choices?.map(choice => (
                  <SelectItem key={choice} value={choice}>
                    {choice}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {!required &&
            value !== undefined &&
            value !== null &&
            value !== "" && (
              <Button
                type="button"
                variant="outline"
                className="min-h-11"
                aria-label={`Clear ${field.label}`}
                onClick={() => change(null)}
              >
                Clear
              </Button>
            )}
        </>
      ) : (
        <Input
          id={id}
          value={text}
          required={required}
          maxLength={
            field.type === "url" ? 2048 : field.type === "email" ? 254 : 500
          }
          type={
            ["email", "url", "date"].includes(field.type) ? field.type : "text"
          }
          inputMode={field.type === "number" ? "decimal" : undefined}
          onChange={event => change(event.target.value)}
        />
      )}
      {field.type === "links" && (
        <p className="text-xs text-muted-foreground">
          One GitHub, portfolio or project URL per line.
        </p>
      )}
      {field.type === "time_zone" && (
        <p className="text-xs text-muted-foreground">
          Use an IANA time zone, for example Asia/Kolkata or Europe/London.
        </p>
      )}
    </div>
  );
}
