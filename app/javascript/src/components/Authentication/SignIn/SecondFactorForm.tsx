import React, { useState } from "react";
import { passkeysApi, totpApi } from "apis/api";
import { beginPasskeyAuthentication } from "utils/passkeys";
import { t } from "../../../i18n";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import AuthShell from "../AuthShell";

const SecondFactorForm = ({ challenge, onComplete, onBack }) => {
  const [code, setCode] = useState("");
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);
  const [trustBrowser, setTrustBrowser] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const verify = async (withPasskey = false) => {
    setBusy(true);
    setError("");
    try {
      const payload = {
        pending_token: challenge.pending_token,
        trust_browser: trustBrowser,
      };

      const response = withPasskey
        ? await passkeysApi.authenticate({
            ...payload,
            credential: await beginPasskeyAuthentication(challenge.public_key),
          })
        : await totpApi.authenticate({
            ...payload,
            ...(useRecoveryCode ? { recovery_code: code } : { code }),
          });
      onComplete(response.data);
    } catch (error) {
      setError(
        error?.response?.data?.error ||
          t(
            withPasskey
              ? "loginSecurity.passkeyCancelled"
              : "loginSecurity.invalidCode"
          )
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title={t("loginSecurity.title")}
      description={t("loginSecurity.description")}
    >
      <form
        className="space-y-5"
        onSubmit={event => {
          event.preventDefault();
          if (!busy && code.trim() && challenge.requires_totp) verify();
        }}
      >
        {challenge.requires_passkey && (
          <Button
            className="w-full"
            type="button"
            disabled={busy}
            onClick={() => verify(true)}
          >
            {busy
              ? t("loginSecurity.verifying")
              : t("loginSecurity.usePasskey")}
          </Button>
        )}
        {challenge.requires_totp && (
          <div className="space-y-3">
            {challenge.requires_passkey && (
              <p className="text-center text-sm text-muted-foreground">
                {t("loginSecurity.orAuthenticator")}
              </p>
            )}
            <label
              className="block text-sm font-medium"
              htmlFor="verification_code"
            >
              {useRecoveryCode
                ? t("auth.recoveryCode")
                : t("auth.signIn.totpCode")}
            </label>
            <Input
              autoFocus
              autoComplete="one-time-code"
              id="verification_code"
              inputMode={useRecoveryCode ? "text" : "numeric"}
              value={code}
              onChange={event => setCode(event.target.value)}
              placeholder={useRecoveryCode ? "ABCD-EFGH" : "123456"}
            />
            <button
              type="button"
              disabled={busy}
              className="text-sm text-primary underline"
              onClick={() => {
                setUseRecoveryCode(!useRecoveryCode);
                setCode("");
                setError("");
              }}
            >
              {useRecoveryCode
                ? t("loginSecurity.useAuthenticator")
                : t("loginSecurity.useRecoveryCode")}
            </button>
          </div>
        )}
        <label
          className="flex items-start gap-3 text-sm"
          htmlFor="trust_browser"
        >
          <input
            id="trust_browser"
            type="checkbox"
            checked={trustBrowser}
            disabled={busy}
            onChange={event => setTrustBrowser(event.target.checked)}
            className="mt-1 h-4 w-4 accent-primary"
          />
          <span>
            {t("loginSecurity.trustBrowser")}
            <span className="mt-1 block text-xs text-muted-foreground">
              {t("loginSecurity.trustDescription")}
            </span>
          </span>
        </label>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        {challenge.requires_totp && (
          <Button
            className="w-full"
            type="submit"
            disabled={busy || !code.trim()}
          >
            {busy
              ? t("loginSecurity.verifying")
              : t("auth.signIn.verifyAndSignIn")}
          </Button>
        )}
        <Button
          className="w-full"
          variant="outline"
          type="button"
          disabled={busy}
          onClick={onBack}
        >
          {t("auth.signIn.back")}
        </Button>
      </form>
    </AuthShell>
  );
};

export default SecondFactorForm;
