import React, { useEffect, useState } from "react";
import { passkeysApi, totpApi } from "apis/api";
import { useUserContext } from "context/UserContext";
import { toast } from "sonner";
import { beginPasskeyRegistration } from "utils/passkeys";
import { i18n } from "../../../../i18n";
import { Badge } from "../../../ui/badge";
import { Button } from "../../../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "../../../ui/dialog";
import { Input } from "../../../ui/input";
import PasskeysPanel from "./Edit/PasskeysPanel";
import TotpPanel from "./Edit/TotpPanel";

const errorMessage = error =>
  error?.response?.data?.error ||
  i18n.t(
    error?.name === "NotAllowedError"
      ? "loginSecurity.passkeyCancelled"
      : "accountSecurity.failed"
  );

const AccountSecurity = () => {
  const { user } = useUserContext();
  const [passkeyState, setPasskeyState] = useState(null);
  const [totp, setTotp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [dialogError, setDialogError] = useState("");
  const [action, setAction] = useState<{
    title: string;
    description: string;
    submit: (password: string) => Promise<void>;
  } | null>(null);

  const loadSecurity = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const [passkeysResponse, totpResponse] = await Promise.all([
        passkeysApi.index(),
        totpApi.show(),
      ]);
      setPasskeyState(passkeysResponse.data);
      setTotp(totpResponse.data);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSecurity();
  }, []);

  const closeAction = () => {
    if (busy) return;
    setAction(null);
    setPassword("");
    setDialogError("");
  };

  const confirmAction = async event => {
    event.preventDefault();
    if (!password || busy) return;
    setBusy(true);
    setDialogError("");
    setError("");
    try {
      await action.submit(password);
      setAction(null);
      setPassword("");
      toast.success(i18n.t("accountSecurity.saved"));
    } catch (error) {
      setDialogError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const confirmTotp = async () => {
    setBusy(true);
    setError("");
    try {
      const response = await totpApi.confirm({ code });
      setTotp(response.data);
      setCode("");
      toast.success(i18n.t("twoFactor.enabledSuccess"));
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const renamePasskey = async (id, nickname) => {
    setBusy(true);
    setError("");
    try {
      const response = await passkeysApi.update(id, { nickname });
      setPasskeyState(response.data);
      toast.success(i18n.t("accountSecurity.renamed"));

      return true;
    } catch (error) {
      setError(errorMessage(error));

      return false;
    } finally {
      setBusy(false);
    }
  };

  return (
    <section
      aria-labelledby="account-security-title"
      className="scroll-mt-24 space-y-5"
      id="account-security"
      tabIndex={-1}
    >
      <div className="space-y-2">
        <h2
          className="text-xl font-geist-semibold text-foreground"
          id="account-security-title"
        >
          {i18n.t("accountSecurity.title")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {i18n.t("accountSecurity.description")}
        </p>
        {!loading && !loadError && totp && passkeyState && (
          <Badge
            variant={
              totp.enabled || passkeyState.passkey_required_for_login
                ? "default"
                : "outline"
            }
          >
            {i18n.t(
              totp.enabled || passkeyState.passkey_required_for_login
                ? "accountSecurity.on"
                : "accountSecurity.off"
            )}
          </Badge>
        )}
      </div>
      {loading ? (
        <p role="status">{i18n.t("common.loading")}</p>
      ) : loadError ? (
        <div className="space-y-3 rounded-xl border border-destructive p-4">
          <p role="alert">{i18n.t("accountSecurity.loadFailed")}</p>
          <Button onClick={loadSecurity} variant="outline">
            {i18n.t("common.retry")}
          </Button>
        </div>
      ) : (
        <>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <div className="grid items-start gap-6 xl:grid-cols-2">
            <TotpPanel
              busy={busy}
              canManage
              enabled={totp.enabled}
              onSetup={() =>
                setAction({
                  title: i18n.t("accountSecurity.setupAuthenticator"),
                  description: i18n.t("accountSecurity.confirmPassword"),
                  submit: async currentPassword => {
                    const response = await totpApi.setup({
                      current_password: currentPassword,
                    });
                    setTotp(response.data);
                    setCode("");
                  },
                })
              }
              onCancelSetup={() => {
                setTotp({
                  ...totp,
                  secret: null,
                  qr_code: null,
                  provisioning_uri: null,
                });
                setCode("");
                setError("");
              }}
              onConfirm={confirmTotp}
              onDisable={() =>
                setAction({
                  title: i18n.t("accountSecurity.disableAuthenticatorAction"),
                  description: i18n.t(
                    passkeyState.passkey_required_for_login
                      ? "accountSecurity.disableAuthenticator"
                      : "accountSecurity.disableLastFactor"
                  ),
                  submit: async currentPassword => {
                    const response = await totpApi.destroy({
                      current_password: currentPassword,
                    });
                    setTotp(response.data);
                    setCode("");
                  },
                })
              }
              onGenerateRecoveryCodes={() =>
                setAction({
                  title: i18n.t("twoFactor.regenerateRecoveryCodes"),
                  description: i18n.t("accountSecurity.replaceCodes"),
                  submit: async currentPassword => {
                    const response = await totpApi.regenerateRecoveryCodes({
                      current_password: currentPassword,
                    });
                    setTotp(response.data);
                  },
                })
              }
              onDismissCodes={() => setTotp({ ...totp, recovery_codes: [] })}
              qrCode={totp.qr_code}
              recoveryCodes={totp.recovery_codes || []}
              recoveryCodesCount={totp.recovery_codes_count || 0}
              secret={totp.secret}
              setVerificationCode={setCode}
              verificationCode={code}
            />
            <PasskeysPanel
              busy={busy}
              canManage
              passkeys={passkeyState.passkeys}
              passkeyRequiredForLogin={passkeyState.passkey_required_for_login}
              onRename={renamePasskey}
              onRegister={() =>
                setAction({
                  title: i18n.t("passkeys.addAction"),
                  description: i18n.t("accountSecurity.confirmPassword"),
                  submit: async currentPassword => {
                    const options = await passkeysApi.registrationOptions({
                      current_password: currentPassword,
                    });

                    const credential = await beginPasskeyRegistration(
                      options.data.public_key
                    );

                    const response = await passkeysApi.create({
                      challenge_token: options.data.challenge_token,
                      credential,
                      nickname: i18n.t("accountSecurity.defaultPasskeyName"),
                    });
                    setPasskeyState(response.data);
                  },
                })
              }
              onRemove={id =>
                setAction({
                  title: i18n.t("accountSecurity.removePasskey"),
                  description: i18n.t(
                    passkeyState.passkeys.length === 1 &&
                      passkeyState.passkey_required_for_login &&
                      !totp.enabled
                      ? "accountSecurity.removeLastFactor"
                      : "accountSecurity.removeDescription"
                  ),
                  submit: async currentPassword => {
                    const response = await passkeysApi.destroy(id, {
                      current_password: currentPassword,
                    });
                    setPasskeyState(response.data);
                  },
                })
              }
              onToggleRequirement={required =>
                setAction({
                  title: i18n.t(
                    required
                      ? "accountSecurity.enablePasskeys"
                      : "accountSecurity.disablePasskeys"
                  ),
                  description: i18n.t(
                    !required && !totp.enabled
                      ? "accountSecurity.disableLastFactor"
                      : "accountSecurity.passkeyRequirementDescription"
                  ),
                  submit: async currentPassword => {
                    const response = await passkeysApi.updateRequirement({
                      required,
                      current_password: currentPassword,
                    });
                    setPasskeyState(response.data);
                  },
                })
              }
            />
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {i18n.t("accountSecurity.trustedBrowsers")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {i18n.t("accountSecurity.trustDescription")}
              </p>
              <Button
                disabled={busy}
                variant="outline"
                onClick={() =>
                  setAction({
                    title: i18n.t("loginSecurity.revokeBrowsers"),
                    description: i18n.t("accountSecurity.revokeDescription"),
                    submit: async currentPassword => {
                      await totpApi.revokeTrustedBrowsers({
                        current_password: currentPassword,
                      });
                    },
                  })
                }
              >
                {i18n.t("loginSecurity.revokeBrowsers")}
              </Button>
            </CardContent>
          </Card>
        </>
      )}
      <Dialog
        open={!!action}
        onOpenChange={open => {
          if (!open) closeAction();
        }}
      >
        <DialogContent>
          <DialogTitle>{action?.title}</DialogTitle>
          <DialogDescription>{action?.description}</DialogDescription>
          <form className="space-y-4" onSubmit={confirmAction}>
            <input
              aria-hidden="true"
              autoComplete="username"
              className="sr-only"
              name="username"
              readOnly
              tabIndex={-1}
              type="email"
              value={user?.email || ""}
            />
            <div className="space-y-2">
              <label htmlFor="account-security-password">
                {i18n.t("settings.currentPassword")}
              </label>
              <Input
                autoComplete="current-password"
                id="account-security-password"
                type="password"
                value={password}
                onChange={event => {
                  setPassword(event.target.value);
                  setDialogError("");
                }}
                aria-invalid={!!dialogError}
                aria-describedby={
                  dialogError ? "account-security-error" : undefined
                }
              />
              {dialogError && (
                <p
                  className="text-sm text-destructive"
                  id="account-security-error"
                  role="alert"
                >
                  {dialogError}
                </p>
              )}
            </div>
            <div className="flex justify-end gap-3">
              <Button
                disabled={busy}
                onClick={closeAction}
                type="button"
                variant="outline"
              >
                {i18n.t("cancel")}
              </Button>
              <Button disabled={busy || !password} type="submit">
                {i18n.t(busy ? "common.saving" : "continue")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default AccountSecurity;
