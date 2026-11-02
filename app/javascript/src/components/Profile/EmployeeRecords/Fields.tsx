import React from "react";

import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import { t } from "../../../i18n";

export const text = (key: string, options = {}) =>
  t(`employeeRecords.${key}`, options);

export const Field = ({
  name,
  label = text(name),
  value,
  onChange,
  ...props
}) => (
  <div className="min-w-0 space-y-2">
    <Label htmlFor={name}>{label}</Label>
    <Input
      id={name}
      name={name}
      value={value ?? ""}
      onChange={event => onChange(event.target.value)}
      {...props}
    />
  </div>
);

export const Section = ({ title, children }) => (
  <section className="min-w-0 space-y-4 rounded-xl border border-border bg-card p-4 sm:p-6">
    <h2 className="text-lg font-semibold">{title}</h2>
    {children}
  </section>
);

export const Fact = ({ label, children }) => (
  <div className="min-w-0">
    <dt className="text-sm text-muted-foreground">{label}</dt>
    <dd className="mt-1 break-words text-sm [overflow-wrap:anywhere]">
      {children !== "" && React.Children.count(children)
        ? children
        : text("empty")}
    </dd>
  </div>
);
