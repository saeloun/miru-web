import React from "react";

import { Fingerprint, ShieldCheck, Trash } from "phosphor-react";
import { i18n } from "../../../../../i18n";
import { Button } from "../../../../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../ui/card";
import { Switch } from "../../../../ui/switch";

const formatTimestamp = (value?: string | null) => {
  if (!value) return i18n.t("passkeys.neverUsed");

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const PasskeysPanel = ({
  busy,
  canManage,
  onRegister,
  onRemove,
  onToggleRequirement,
  passkeyRequiredForLogin,
  passkeys,
}) => {
  if (!canManage) return null;

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-geist-semibold">
          <Fingerprint
            className="h-5 w-5 text-muted-foreground"
            weight="bold"
          />
          {i18n.t("passkeys.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-muted/40 p-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-geist-medium text-foreground">
              {i18n.t("passkeys.addTitle")}
            </p>
            <p className="text-sm text-muted-foreground">
              {i18n.t("passkeys.addDescription")}
            </p>
          </div>
          <Button disabled={busy} onClick={onRegister} type="button">
            {i18n.t("passkeys.addAction")}
          </Button>
        </div>

        <div className="flex items-center justify-between gap-4 rounded-2xl border border-border p-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-geist-medium text-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" weight="bold" />
              {i18n.t("passkeys.requirementTitle")}
            </div>
            <p className="text-sm text-muted-foreground">
              {i18n.t("passkeys.requirementDescription")}
            </p>
          </div>
          <Switch
            checked={passkeyRequiredForLogin}
            disabled={busy || passkeys.length === 0}
            onCheckedChange={onToggleRequirement}
          />
        </div>

        <div className="space-y-3">
          {passkeys.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
              {i18n.t("passkeys.emptyState")}
            </div>
          ) : (
            passkeys.map(passkey => (
              <div
                key={passkey.id}
                className="flex flex-col gap-3 rounded-2xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-1">
                  <p className="text-sm font-geist-medium text-foreground">
                    {passkey.nickname || i18n.t("passkeys.fallbackName")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {i18n.t("passkeys.addedAt", {
                      time: formatTimestamp(passkey.created_at),
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {i18n.t("passkeys.lastUsedAt", {
                      time: formatTimestamp(passkey.last_used_at),
                    })}
                  </p>
                </div>
                <Button
                  className="sm:self-center"
                  disabled={busy}
                  onClick={() => onRemove(passkey.id)}
                  type="button"
                  variant="outline"
                >
                  <Trash className="mr-2 h-4 w-4" weight="bold" />
                  {i18n.t("passkeys.removeAction")}
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PasskeysPanel;
