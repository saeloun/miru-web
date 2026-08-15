import React, { FormEvent, KeyboardEvent, useEffect, useState } from "react";
import { toast } from "sonner";

import { ssoSettingsApi } from "apis/api";
import PlanAccessGate from "components/PlanAccessGate";
import { Badge } from "components/ui/badge";
import { Button } from "components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "components/ui/card";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import { Switch } from "components/ui/switch";
import { i18n } from "../../../../i18n";

const validDomain = (domain: string) =>
  domain.length > 0 && !domain.includes("@") && domain.includes(".");

const SsoSettingsForm = () => {
  const [ssoEnforced, setSsoEnforced] = useState(false);
  const [domains, setDomains] = useState<string[]>([]);
  const [domainInput, setDomainInput] = useState("");
  const [domainError, setDomainError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await ssoSettingsApi.show();
        setSsoEnforced(response.data.sso_enforced);
        setDomains(response.data.allowed_sso_domains || []);
      } catch (error: any) {
        toast.error(
          error?.response?.data?.errors || i18n.t("ssoSettings.loadError")
        );
      } finally {
        setLoading(false);
      }
    };

    void loadSettings();
  }, []);

  const addDomain = () => {
    const domain = domainInput.trim().toLowerCase().replace(/,$/, "");
    if (!domain) return true;

    if (!validDomain(domain)) {
      setDomainError(i18n.t("ssoSettings.invalidDomain"));

      return false;
    }

    setDomains(current =>
      current.includes(domain) ? current : [...current, domain]
    );
    setDomainInput("");
    setDomainError("");

    return true;
  };

  const handleDomainKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addDomain();
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const pendingDomain = domainInput.trim().toLowerCase();
    if (pendingDomain && !validDomain(pendingDomain)) {
      setDomainError(i18n.t("ssoSettings.invalidDomain"));

      return;
    }

    const allowedSsoDomains = pendingDomain
      ? Array.from(new Set([...domains, pendingDomain]))
      : domains;

    try {
      setSaving(true);
      const response = await ssoSettingsApi.update({
        company: {
          sso_enforced: ssoEnforced,
          allowed_sso_domains: allowedSsoDomains,
        },
      });
      setDomains(response.data.allowed_sso_domains);
      setDomainInput("");
      setDomainError("");
      toast.success(i18n.t("ssoSettings.saved"));
    } catch (error: any) {
      toast.error(
        error?.response?.data?.errors || i18n.t("ssoSettings.saveError")
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader>
        <CardTitle>{i18n.t("ssoSettings.title")}</CardTitle>
        <CardDescription>{i18n.t("ssoSettings.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="max-w-3xl space-y-8" onSubmit={handleSubmit}>
          <div className="flex items-start justify-between gap-6 rounded-lg border border-border p-4">
            <div className="space-y-1">
              <Label htmlFor="sso-enforced">
                {i18n.t("ssoSettings.requireSso")}
              </Label>
              <p className="text-sm text-muted-foreground">
                {i18n.t("ssoSettings.requireSsoWarning")}
              </p>
            </div>
            <Switch
              checked={ssoEnforced}
              disabled={loading}
              id="sso-enforced"
              onCheckedChange={setSsoEnforced}
            />
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="allowed-sso-domain">
                {i18n.t("ssoSettings.allowedDomains")}
              </Label>
              <p className="text-sm text-muted-foreground">
                {i18n.t("ssoSettings.allowedDomainsDescription")}
              </p>
            </div>
            <div className="flex min-h-12 flex-wrap items-center gap-2 rounded-md border border-input bg-background p-2 focus-within:ring-2 focus-within:ring-ring">
              {domains.map(domain => (
                <Badge className="gap-2" key={domain} variant="secondary">
                  {domain}
                  <button
                    aria-label={i18n.t("ssoSettings.removeDomain", { domain })}
                    className="rounded-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() =>
                      setDomains(current =>
                        current.filter(item => item !== domain)
                      )
                    }
                    type="button"
                  >
                    ×
                  </button>
                </Badge>
              ))}
              <Input
                className="h-8 min-w-48 flex-1 border-0 p-1 shadow-none focus-visible:ring-0"
                id="allowed-sso-domain"
                onBlur={addDomain}
                onChange={event =>
                  setDomainInput(event.target.value.toLowerCase())
                }
                onKeyDown={handleDomainKeyDown}
                placeholder={i18n.t("ssoSettings.domainPlaceholder")}
                value={domainInput}
              />
            </div>
            {domainError && (
              <p className="text-sm text-destructive" role="alert">
                {domainError}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              {i18n.t("ssoSettings.membersDomainNote")}
            </p>
          </div>

          <Button disabled={loading || saving} type="submit">
            {saving ? i18n.t("ssoSettings.saving") : i18n.t("ssoSettings.save")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

const SsoSettings = () => (
  <PlanAccessGate feature="sso">
    <SsoSettingsForm />
  </PlanAccessGate>
);

export default SsoSettings;
