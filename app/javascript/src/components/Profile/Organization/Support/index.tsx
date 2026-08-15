import React, { FormEvent, useState } from "react";
import { toast } from "sonner";

import { supportRequestsApi } from "apis/api";
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
import { Textarea } from "components/ui/textarea";
import { useUserContext } from "context/UserContext";
import { i18n } from "../../../../i18n";

const Support = () => {
  const { company } = useUserContext();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const priority = Boolean(company?.pro_access);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    try {
      setSending(true);
      await supportRequestsApi.create({
        support_request: { subject, message },
      });
      setSubject("");
      setMessage("");
      toast.success(i18n.t("supportSettings.sent"));
    } catch (error: any) {
      toast.error(
        error?.response?.data?.errors || i18n.t("supportSettings.sendError")
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <CardTitle>{i18n.t("supportSettings.title")}</CardTitle>
          <Badge variant={priority ? "default" : "secondary"}>
            {priority
              ? i18n.t("supportSettings.priorityBadge")
              : i18n.t("supportSettings.standardBadge")}
          </Badge>
        </div>
        <CardDescription>
          {priority
            ? i18n.t("supportSettings.priorityDescription")
            : i18n.t("supportSettings.standardDescription")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="max-w-3xl space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="support-subject">
              {i18n.t("supportSettings.subject")}
            </Label>
            <Input
              id="support-subject"
              maxLength={200}
              onChange={event => setSubject(event.target.value)}
              placeholder={i18n.t("supportSettings.subjectPlaceholder")}
              required
              value={subject}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="support-message">
              {i18n.t("supportSettings.message")}
            </Label>
            <Textarea
              className="min-h-40"
              id="support-message"
              maxLength={5000}
              onChange={event => setMessage(event.target.value)}
              placeholder={i18n.t("supportSettings.messagePlaceholder")}
              required
              value={message}
            />
          </div>
          <Button disabled={sending} type="submit">
            {sending
              ? i18n.t("supportSettings.sending")
              : i18n.t("supportSettings.send")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default Support;
