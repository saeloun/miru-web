import React, { useId } from "react";
import { useFormikContext } from "formik";

import { i18n } from "../../../i18n";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import type { ClientFormValues } from "./types";
import { CLIENT_AGREEMENT_FIELDS } from "./utils";

const AgreementDetailsFields = () => {
  const formId = useId();
  const {
    values,
    touched,
    errors,
    handleChange,
    handleBlur,
    setFieldValue,
    isSubmitting,
  } = useFormikContext<ClientFormValues>();

  return (
    <fieldset className="space-y-4 border-t border-border pt-4">
      <legend className="text-sm font-semibold text-foreground">
        {i18n.t("clients.agreement.title")}
      </legend>
      <p className="text-xs text-muted-foreground">
        {i18n.t("clients.agreement.description")}
      </p>
      {CLIENT_AGREEMENT_FIELDS.map(([name, label]) => {
        const id = `${formId}-${name}`;
        const error = touched[name] && errors[name];
        const isEmail = name.endsWith("_email");

        return (
          <div key={name} className="space-y-2">
            <Label htmlFor={id}>{i18n.t(`clients.agreement.${label}`)}</Label>
            <Input
              id={id}
              name={name}
              type={isEmail ? "email" : "text"}
              maxLength={isEmail ? 254 : 255}
              value={values[name]}
              aria-invalid={Boolean(error)}
              aria-describedby={
                [
                  name === "finance_email" ? `${id}-help` : null,
                  error ? `${id}-error` : null,
                ]
                  .filter(Boolean)
                  .join(" ") || undefined
              }
              onChange={handleChange}
              onBlur={handleBlur}
            />
            {name === "finance_email" && (
              <p id={`${id}-help`} className="text-xs text-muted-foreground">
                {i18n.t("clients.agreement.financeHelp")}
              </p>
            )}
            {error && (
              <p
                id={`${id}-error`}
                role="alert"
                className="text-xs text-destructive"
              >
                {error}
              </p>
            )}
            {name === "signatory_email" && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={
                  !values.finance_email.trim() ||
                  Boolean(errors.finance_email) ||
                  isSubmitting
                }
                onClick={() =>
                  setFieldValue("signatory_email", values.finance_email.trim())
                }
              >
                {i18n.t("clients.agreement.useFinanceEmail")}
              </Button>
            )}
          </div>
        );
      })}
    </fieldset>
  );
};

export default AgreementDetailsFields;
