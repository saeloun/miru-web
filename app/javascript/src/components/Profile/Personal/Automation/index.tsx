import React from "react";

import { Browser, Command, Robot, TerminalWindow } from "phosphor-react";
import { i18n } from "../../../../i18n";

import { Badge } from "../../../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../../ui/card";

const cliInstallCommand =
  "curl -fsSL https://raw.githubusercontent.com/saeloun/miru-web/main/tools/miru-cli/install.sh | bash";

const commandGroups = [
  {
    titleKey: "install",
    icon: <TerminalWindow size={18} weight="duotone" />,
    lines: [cliInstallCommand],
  },
  {
    titleKey: "authenticateOnce",
    icon: <Browser size={18} weight="duotone" />,
    lines: [
      "miru login --email you@example.com --password password",
      "miru config set-base-url --url http://127.0.0.1:3000",
    ],
  },
  {
    titleKey: "dailyCommands",
    icon: <Command size={18} weight="duotone" />,
    lines: [
      "miru whoami",
      "miru project list",
      "miru expense list",
      "miru invoice list",
      "miru payment list",
      "miru time list --from 2026-03-01 --to 2026-03-09",
      'miru time create --project-id 2 --duration 30 --date 2026-03-09 --note "CLI entry"',
    ],
  },
];

const Automation = () => (
  <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 sm:p-6">
    <Card className="border-border bg-card shadow-sm">
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="secondary" className="gap-1.5 px-3 py-1">
            <Robot size={14} weight="fill" />
            {i18n.t("automationSettings.freeForEveryPlan")}
          </Badge>
        </div>
        <div className="space-y-2">
          <CardTitle className="text-2xl tracking-tight">
            {i18n.t("automationSettings.title")}
          </CardTitle>
          <p className="max-w-3xl text-sm text-muted-foreground">
            {i18n.t("automationSettings.description")}
          </p>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-border bg-background p-4 shadow-sm">
          <p className="text-sm font-semibold text-foreground">
            {i18n.t("automationSettings.cards.samePermissionsTitle")}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {i18n.t("automationSettings.cards.samePermissionsDescription")}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-background p-4 shadow-sm">
          <p className="text-sm font-semibold text-foreground">
            {i18n.t("automationSettings.cards.humansAndScriptsTitle")}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {i18n.t("automationSettings.cards.humansAndScriptsDescription")}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-background p-4 shadow-sm">
          <p className="text-sm font-semibold text-foreground">
            {i18n.t("automationSettings.cards.easyToInstallTitle")}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {i18n.t("automationSettings.cards.easyToInstallDescription")}
          </p>
        </div>
      </CardContent>
    </Card>

    <div className="grid gap-4 lg:grid-cols-3">
      {commandGroups.map(group => (
        <Card key={group.titleKey} className="border-border bg-card shadow-sm">
          <CardHeader className="gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background text-foreground shadow-sm">
              {group.icon}
            </div>
            <CardTitle className="text-lg">
              {i18n.t(`automationSettings.commandGroups.${group.titleKey}`)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {group.lines.map(line => (
              <code
                key={line}
                className="block overflow-x-auto rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm"
              >
                {line}
              </code>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

export default Automation;
