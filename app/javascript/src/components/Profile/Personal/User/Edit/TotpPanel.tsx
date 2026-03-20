import React from "react";

import { Key, Lifebuoy, ShieldCheck } from "phosphor-react";
import { Button } from "../../../../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../ui/card";
import { Input } from "../../../../ui/input";

const TotpPanel = ({
  busy,
  canManage,
  enabled,
  onConfirm,
  onDisable,
  onGenerateRecoveryCodes,
  onSetup,
  provisioningUri,
  recoveryCodes,
  recoveryCodesCount,
  secret,
  setVerificationCode,
  verificationCode,
}) => {
  if (!canManage) return null;

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-geist-semibold">
          <ShieldCheck
            className="h-5 w-5 text-muted-foreground"
            weight="bold"
          />
          Authenticator App 2FA
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {!enabled && !secret && (
          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-muted/40 p-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-geist-medium text-foreground">
                Add an authenticator app
              </p>
              <p className="text-sm text-muted-foreground">
                Use Google Authenticator, 1Password, Bitwarden, Authy, or any
                TOTP-compatible app.
              </p>
            </div>
            <Button disabled={busy} onClick={onSetup} type="button">
              Set up 2FA
            </Button>
          </div>
        )}

        {!enabled && secret && (
          <div className="space-y-4 rounded-2xl border border-border p-4">
            <div className="space-y-1">
              <p className="text-sm font-geist-medium text-foreground">
                Finish authenticator setup
              </p>
              <p className="text-sm text-muted-foreground">
                Add this key to your authenticator app, then enter the current
                6-digit code to enable 2FA.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-muted/30 p-3">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <Key className="h-3.5 w-3.5" weight="bold" />
                Manual entry key
              </div>
              <p className="mt-2 break-all font-mono text-sm text-foreground">
                {secret}
              </p>
              {provisioningUri && (
                <p className="mt-2 break-all text-xs text-muted-foreground">
                  {provisioningUri}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label
                className="text-xs font-geist-medium uppercase tracking-wider text-muted-foreground"
                htmlFor="totp_verification_code"
              >
                Verification code
              </label>
              <Input
                id="totp_verification_code"
                inputMode="numeric"
                placeholder="123456"
                value={verificationCode}
                onChange={event => setVerificationCode(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                disabled={busy || !verificationCode.trim()}
                onClick={onConfirm}
                type="button"
              >
                Enable 2FA
              </Button>
              <Button
                disabled={busy}
                onClick={onSetup}
                type="button"
                variant="outline"
              >
                Reset key
              </Button>
            </div>
          </div>
        )}

        {enabled && (
          <div className="space-y-4 rounded-2xl border border-border p-4">
            <div className="space-y-1">
              <p className="text-sm font-geist-medium text-foreground">
                Authenticator app protection is on
              </p>
              <p className="text-sm text-muted-foreground">
                You will need an authenticator code after your password when you
                sign in.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span>{recoveryCodesCount} recovery codes available</span>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                disabled={busy}
                onClick={onGenerateRecoveryCodes}
                type="button"
                variant="outline"
              >
                <Lifebuoy className="mr-2 h-4 w-4" weight="bold" />
                Regenerate recovery codes
              </Button>
              <Button
                disabled={busy}
                onClick={onDisable}
                type="button"
                variant="outline"
              >
                Disable 2FA
              </Button>
            </div>
          </div>
        )}

        {recoveryCodes.length > 0 && (
          <div className="space-y-3 rounded-2xl border border-dashed border-border p-4">
            <div className="space-y-1">
              <p className="text-sm font-geist-medium text-foreground">
                Save these recovery codes
              </p>
              <p className="text-sm text-muted-foreground">
                Each code works once. Store them somewhere safe.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {recoveryCodes.map(code => (
                <div
                  key={code}
                  className="rounded-xl border border-border bg-muted/30 px-3 py-2 font-mono text-sm text-foreground"
                >
                  {code}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TotpPanel;
