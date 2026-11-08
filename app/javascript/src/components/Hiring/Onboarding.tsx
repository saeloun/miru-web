import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Api from "apis/api";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  accessDenied,
  failureMessage,
  quiet,
  read,
  verifyWorkspace,
} from "./api";
import type { Offer } from "./ApplicationOffers";
import type { Application } from "./types";

type Profile = {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  employee_id: string;
  designation: string;
  employment_type: string;
  joined_at: string | null;
  email: string;
  updated_at: string;
};
type Invitation = {
  id: number;
  first_name: string;
  last_name: string;
  recipient_email: string;
  expired_at: string;
  updated_at: string;
};
type Result = {
  company_id: number;
  application: Application;
  offer: Offer;
  onboarding: {
    started_at: string | null;
    onboarded_at: string | null;
    can_start: boolean;
    can_link: boolean;
    can_renew: boolean;
    reason: string | null;
    recipient: string;
    reviewed_name: { first_name: string; last_name: string } | null;
    invitation_will_send: boolean;
    employment: Profile | null;
    invitation: Invitation | null;
  };
};
type Operation = {
  action: "start" | "complete" | "renew";
  attributes: Record<string, number | string | boolean | null>;
};

export default function Onboarding({
  companyId,
  applicationId,
  offer,
  changed,
  onDenied,
}: {
  companyId: number;
  applicationId: number;
  offer: Offer;
  changed: (result: Result) => void;
  onDenied: (failure: unknown) => void;
}) {
  const path = `applications/${applicationId}/offers/${offer.id}/onboarding`;
  const [expanded, setExpanded] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [data, setData] = useState<Result | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [pending, setPending] = useState<Operation | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const mounted = useRef(true);
  const status = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (error || notice) status.current?.focus();
  }, [error, notice]);

  useEffect(() => {
    if (!expanded) return;
    const controller = new window.AbortController();
    setData(null);
    setError("");
    setConfirmed(false);
    read<Result>(path, companyId, {}, controller.signal)
      .then(result => {
        if (controller.signal.aborted) return;
        setData(result);
        const profile =
          result.onboarding.employment || result.onboarding.invitation;
        setFirstName(profile?.first_name || "");
        setLastName(profile?.last_name || "");
      })
      .catch(failure => {
        if (controller.signal.aborted) return;

        if (accessDenied(failure)) onDenied(failure);
        setError(failureMessage(failure));
      });

    return () => controller.abort();
  }, [expanded, refresh, path, companyId]);

  const send = async (operation: Operation) => {
    if (busy) return;
    setBusy(true);
    setPending(operation);
    setError("");
    setNotice("");
    try {
      const suffix = operation.action === "start" ? "" : `/${operation.action}`;
      const { data: result } = await Api.post<Result>(
        `/hiring/${path}${suffix}`,
        { hiring_onboarding: operation.attributes },
        quiet
      );
      verifyWorkspace(result, companyId);
      if (!mounted.current) return;
      setData(result);
      setPending(null);
      setConfirmed(false);
      changed(result);
      setNotice(
        result.onboarding.onboarded_at
          ? "Onboarding complete. Review payroll and agreement documents separately."
          : "Account invitation prepared."
      );
    } catch (failure) {
      if (!mounted.current) return;

      if (accessDenied(failure)) {
        setData(null);
        setFirstName("");
        setLastName("");
        setPending(null);
        onDenied(failure);
      } else if (
        axios.isAxiosError(failure) &&
        failure.response &&
        failure.response.status < 500
      ) {
        setPending(null);
        setConfirmed(false);
      }
      setError(failureMessage(failure));
    } finally {
      if (mounted.current) setBusy(false);
    }
  };

  const submit = (action: Operation["action"]) => {
    if (!data || !confirmed || pending) return;
    const base = {
      company_id: companyId,
      application_version: data.application.lock_version,
      offer_version: data.offer.lock_version,
    };
    const employment = data.onboarding.employment;
    const invitation = data.onboarding.invitation;
    void send({
      action,
      attributes:
        action === "renew"
          ? base
          : {
              ...base,
              first_name: firstName,
              last_name: lastName,
              employment_id: employment?.id ?? null,
              employment_updated_at: employment?.updated_at ?? null,
              invitation_id: invitation?.id ?? null,
              invitation_updated_at: invitation?.updated_at ?? null,
              send_invitation: data.onboarding.invitation_will_send,
            },
    });
  };

  const state = data?.onboarding;

  return (
    <section
      className="space-y-3 border-t pt-3"
      aria-label={`Onboarding offer ${offer.id}`}
    >
      <Button
        variant="outline"
        disabled={busy}
        onClick={() => setExpanded(value => !value)}
      >
        {expanded
          ? "Hide onboarding"
          : `Review onboarding for offer ${offer.id}`}
      </Button>
      {expanded && (
        <>
          <p
            ref={status}
            tabIndex={-1}
            role={error ? "alert" : "status"}
            className={error ? "text-destructive" : "text-sm"}
          >
            {error || notice}
          </p>
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => setRefresh(value => value + 1)}
          >
            Reload onboarding
          </Button>
          {!data && !error && <p>Loading onboarding…</p>}
          {state && (
            <>
              {state.reason && <p role="alert">{state.reason}</p>}
              {state.onboarded_at ? (
                <>
                  <h6 className="font-semibold">Onboarding complete</h6>
                  {state.employment && (
                    <>
                      <p>
                        {state.employment.first_name}{" "}
                        {state.employment.last_name} ·{" "}
                        {state.employment.employee_id}
                      </p>
                      <div className="flex flex-wrap gap-3">
                        <Link
                          className="underline"
                          to={`/team/${state.employment.user_id}/employee-records`}
                        >
                          View employee record
                        </Link>
                        <Link
                          className="underline"
                          to={`/agreements?company_id=${companyId}&employment_id=${state.employment.id}`}
                        >
                          Upload agreement documents
                        </Link>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Upload your own PDFs and place fields. Confirm document
                        sending separately.
                      </p>
                    </>
                  )}
                </>
              ) : (
                <>
                  <p className="text-sm">
                    {state.employment
                      ? "Link the reviewed existing profile without changing its employment, salary or bank details."
                      : `The new ${offer.details.engagement} profile will use ${offer.details.title}, joining ${offer.details.joining_on}. Manage salary and bank details separately.`}
                  </p>
                  {state.employment && (
                    <p className="text-sm">
                      Existing profile: {state.employment.employee_id} ·{" "}
                      {state.employment.designation} ·{" "}
                      {state.employment.employment_type} · joined{" "}
                      {state.employment.joined_at || "Not set"}
                    </p>
                  )}
                  <p className="break-words text-sm">
                    Account recipient: {state.recipient}
                  </p>
                  {state.reviewed_name && (
                    <p className="text-sm">
                      Reviewed member: {state.reviewed_name.first_name}{" "}
                      {state.reviewed_name.last_name}
                    </p>
                  )}
                  {state.invitation && (
                    <p className="break-words text-sm">
                      Account invitation: {state.invitation.recipient_email} ·
                      expires{" "}
                      {new Date(state.invitation.expired_at).toLocaleString(
                        undefined,
                        {
                          dateStyle: "medium",
                          timeStyle: "short",
                          timeZone: offer.details.time_zone,
                        }
                      )}{" "}
                      ({offer.details.time_zone})
                    </p>
                  )}
                  {state.started_at && (
                    <p>
                      The recipient must accept before a profile is created.
                    </p>
                  )}
                  {(state.can_start || state.can_link) && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <Label htmlFor={`onboarding-first-${offer.id}`}>
                          Onboarding first name
                        </Label>
                        <Input
                          id={`onboarding-first-${offer.id}`}
                          value={firstName}
                          maxLength={20}
                          disabled={busy || Boolean(pending)}
                          readOnly={Boolean(state.employment)}
                          onChange={event => {
                            setFirstName(event.target.value);
                            setConfirmed(false);
                          }}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`onboarding-last-${offer.id}`}>
                          Onboarding last name
                        </Label>
                        <Input
                          id={`onboarding-last-${offer.id}`}
                          value={lastName}
                          maxLength={20}
                          disabled={busy || Boolean(pending)}
                          readOnly={Boolean(state.employment)}
                          onChange={event => {
                            setLastName(event.target.value);
                            setConfirmed(false);
                          }}
                        />
                      </div>
                    </div>
                  )}
                  {state.can_start && (
                    <p className="text-sm">
                      {state.employment
                        ? "Link this existing staff profile without changing its details."
                        : state.invitation_will_send
                        ? "Send the reviewed account invitation. Membership is created only after acceptance."
                        : "Use the reviewed account invitation without sending another email."}
                    </p>
                  )}
                  {state.can_link && (
                    <p className="text-sm">
                      Link the existing profile and cancel the pending account
                      invitation.
                    </p>
                  )}
                  {(state.can_start || state.can_link || state.can_renew) && (
                    <>
                      <Label
                        className="flex items-start gap-2"
                        htmlFor={`onboarding-confirm-${offer.id}`}
                      >
                        <input
                          id={`onboarding-confirm-${offer.id}`}
                          type="checkbox"
                          checked={confirmed}
                          disabled={busy || Boolean(pending)}
                          onChange={event => setConfirmed(event.target.checked)}
                        />
                        I confirm this accepted offer and the reviewed profile
                        or invitation
                      </Label>
                      {(state.can_start || state.can_link) && (
                        <Button
                          disabled={
                            busy ||
                            Boolean(pending) ||
                            !confirmed ||
                            !firstName.trim() ||
                            !lastName.trim()
                          }
                          onClick={() =>
                            submit(state.can_link ? "complete" : "start")
                          }
                        >
                          Confirm onboarding
                        </Button>
                      )}
                      {state.can_renew && (
                        <Button
                          disabled={busy || Boolean(pending) || !confirmed}
                          onClick={() => submit("renew")}
                        >
                          Renew account invitation
                        </Button>
                      )}
                    </>
                  )}
                </>
              )}
            </>
          )}
          {pending && (
            <div className="space-y-2 rounded border p-3">
              <p>
                The request may have been saved. Retry the unchanged request or
                reload its status before taking another action.
              </p>
              <Button disabled={busy} onClick={() => void send(pending)}>
                Retry unchanged onboarding request
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
