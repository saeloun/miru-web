import React, { useState } from "react";

import { Fingerprint, ShieldCheck, Trash } from "phosphor-react";
import { i18n } from "../../../../../i18n";
import { Button } from "../../../../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../ui/card";
import { Switch } from "../../../../ui/switch";
import { Input } from "../../../../ui/input";

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
  onRename,
  passkeyRequiredForLogin,
  passkeys,
}) => {
  const [editingId, setEditingId] = useState(null);
  const [nickname, setNickname] = useState("");
  if (!canManage) return null;

  return (
    <Card
      className="border-border shadow-sm"
      role="region"
      aria-label={i18n.t("passkeys.title")}
    >
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
              {i18n.t("loginSecurity.devicePasskey")}
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
            aria-label={i18n.t("passkeys.requirementTitle")}
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
                <div className="min-w-0 space-y-1">
                  <p className="break-words text-sm font-geist-medium text-foreground">
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
                {editingId === passkey.id ? (
                  <form
                    className="w-full space-y-3 sm:max-w-xs"
                    onSubmit={async event => {
                      event.preventDefault();
                      if (await onRename(passkey.id, nickname.trim())) {
                        setEditingId(null);
                      }
                    }}
                  >
                    <label
                      className="text-sm"
                      htmlFor={`passkey-name-${passkey.id}`}
                    >
                      {i18n.t("accountSecurity.passkeyName")}
                    </label>
                    <Input
                      autoFocus
                      id={`passkey-name-${passkey.id}`}
                      maxLength={80}
                      value={nickname}
                      onChange={event => setNickname(event.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button disabled={busy || !nickname.trim()} type="submit">
                        {i18n.t("accountSecurity.saveName")}
                      </Button>
                      <Button
                        disabled={busy}
                        type="button"
                        variant="outline"
                        onClick={() => setEditingId(null)}
                      >
                        {i18n.t("cancel")}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Button
                      disabled={busy}
                      type="button"
                      variant="outline"
                      aria-label={i18n.t("accountSecurity.renameNamed", {
                        name:
                          passkey.nickname || i18n.t("passkeys.fallbackName"),
                      })}
                      onClick={() => {
                        setNickname(passkey.nickname || "");
                        setEditingId(passkey.id);
                      }}
                    >
                      {i18n.t("accountSecurity.rename")}
                    </Button>
                    <Button
                      className="sm:self-center"
                      disabled={busy}
                      onClick={() => onRemove(passkey.id)}
                      type="button"
                      variant="outline"
                      aria-label={i18n.t("accountSecurity.removeNamed", {
                        name:
                          passkey.nickname || i18n.t("passkeys.fallbackName"),
                      })}
                    >
                      <Trash className="mr-2 h-4 w-4" weight="bold" />
                      {i18n.t("passkeys.removeAction")}
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PasskeysPanel;
