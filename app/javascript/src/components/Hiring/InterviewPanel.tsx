import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import Api from "apis/api";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import Picker from "./Picker";
import Pager from "./Pager";
import { failureMessage, quiet, read, verifyWorkspace } from "./api";
import type { Choice } from "./types";
import type { PanelDetails, PanelMember, PanelPage } from "./interviewTypes";

type Draft = {
  member: PanelMember | null;
  employment: Choice | null;
  details: PanelDetails;
};

export default function InterviewPanel({ companyId }: { companyId: number }) {
  const [data, setData] = useState<PanelPage | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const mounted = useRef(true);
  const feedback = useRef<HTMLParagraphElement>(null);
  const failed = (failure: unknown) => {
    if (
      axios.isAxiosError(failure) &&
      [403, 404].includes(failure.response?.status ?? 0)
    ) {
      setData(null);
      setDraft(null);
    }
    setError(failureMessage(failure));
  };

  useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (error || notice) feedback.current?.focus();
  }, [error, notice]);

  useEffect(() => {
    let active = true;
    const controller = new window.AbortController();
    setLoading(true);
    setData(null);
    read<PanelPage>("panel_members", companyId, { page }, controller.signal)
      .then(result => {
        if (active) {
          setData(result);
          setError("");
        }
      })
      .catch(failure => {
        if (active) failed(failure);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [companyId, page, refresh]);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft || busy || loading || !draft.employment) return;
    setBusy(true);
    setError("");
    try {
      const body = {
        hiring_panel_member: {
          company_id: companyId,
          details: draft.details,
          ...(draft.member
            ? { lock_version: draft.member.lock_version }
            : { employment_id: draft.employment.id }),
        },
      };

      const response = draft.member
        ? await Api.patch(
            `/hiring/panel_members/${draft.member.id}`,
            body,
            quiet
          )
        : await Api.post("/hiring/panel_members", body, quiet);
      verifyWorkspace(response.data, companyId);
      if (!mounted.current) return;
      setDraft(null);
      setNotice("Panel member saved");
      setRefresh(value => value + 1);
    } catch (failure) {
      if (mounted.current) failed(failure);
    } finally {
      if (mounted.current) setBusy(false);
    }
  };

  const edit = (member: PanelMember | null) => {
    setNotice("");
    setError("");
    setDraft({
      member,
      employment: member
        ? { id: member.employment_id, label: member.full_name }
        : null,
      details: { ...member?.details },
    });
  };

  return (
    <section
      aria-label="Interview panel"
      className="min-w-0 space-y-5 rounded-lg border bg-card p-4 sm:p-6"
    >
      <h2 className="text-xl font-semibold">Interview panel</h2>
      <p className="text-sm text-muted-foreground">
        Maintain active staff expertise, availability and optional HTTPS booking
        links. Round assignments capture these details at the time of
        assignment.
      </p>
      {(error || notice) && (
        <p ref={feedback} tabIndex={-1} role={error ? "alert" : "status"}>
          {error || notice}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <Button
          className="min-h-11"
          disabled={busy || loading || !!draft}
          onClick={() => edit(null)}
        >
          Add panel member
        </Button>
        <Button
          variant="outline"
          className="min-h-11"
          disabled={busy}
          onClick={() => {
            setDraft(null);
            setNotice("");
            setRefresh(value => value + 1);
          }}
        >
          {draft ? "Discard draft and reload panel" : "Refresh panel"}
        </Button>
      </div>
      {draft && (
        <form onSubmit={save} className="space-y-4 rounded-lg border p-4">
          <fieldset disabled={busy || loading} className="min-w-0 space-y-4">
            <legend className="mb-3 font-medium">
              {draft.member
                ? `Edit ${draft.employment?.label}`
                : "New panel member"}
            </legend>
            {draft.member ? (
              <p>{draft.employment?.label}</p>
            ) : (
              <Picker
                id="panel-employment"
                label="Staff member"
                companyId={companyId}
                kind="owners"
                purpose="intake"
                value={draft.employment}
                change={employment => setDraft({ ...draft, employment })}
                emptyLabel="Choose active staff"
              />
            )}
            {(
              [
                ["expertise", "Expertise"],
                ["availability", "Availability"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={`panel-${key}`}>{label}</Label>
                <Textarea
                  id={`panel-${key}`}
                  maxLength={2000}
                  value={draft.details[key] || ""}
                  onChange={event =>
                    setDraft({
                      ...draft,
                      details: { ...draft.details, [key]: event.target.value },
                    })
                  }
                />
              </div>
            ))}
            <div className="space-y-2">
              <Label htmlFor="panel-booking">Booking URL</Label>
              <Input
                id="panel-booking"
                className="h-11"
                type="url"
                pattern="https://.*"
                maxLength={2000}
                value={draft.details.booking_url || ""}
                onChange={event =>
                  setDraft({
                    ...draft,
                    details: {
                      ...draft.details,
                      booking_url: event.target.value,
                    },
                  })
                }
              />
            </div>
            <Button
              type="submit"
              className="min-h-11"
              disabled={!draft.employment}
            >
              {busy ? "Saving…" : "Save panel member"}
            </Button>
          </fieldset>
        </form>
      )}
      {loading && <p role="status">Loading interview panel…</p>}
      {data && (
        <>
          {!data.panel_members.length && <p>No panel members yet.</p>}
          <ul className="space-y-3">
            {data.panel_members.map(member => (
              <li
                key={member.id}
                className="min-w-0 space-y-2 rounded-lg border p-4"
              >
                <h3 className="font-semibold break-words">
                  {member.full_name}
                  {member.active ? "" : " (former staff)"}
                </h3>
                <p className="whitespace-pre-wrap break-words">
                  {member.details.expertise || "Expertise not recorded"}
                </p>
                <p className="whitespace-pre-wrap break-words">
                  {member.details.availability || "Availability not recorded"}
                </p>
                {member.details.booking_url && (
                  <a
                    className="inline-flex min-h-11 items-center break-all text-primary underline"
                    href={member.details.booking_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open booking link
                  </a>
                )}
                <div>
                  <Button
                    variant="outline"
                    className="h-auto min-h-11 max-w-full whitespace-normal break-all text-left"
                    disabled={busy || loading || !!draft}
                    onClick={() => edit(member)}
                  >
                    Edit {member.full_name}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
          <Pager
            pagination={data.pagination}
            change={setPage}
            disabled={busy || loading || !!draft}
          />
        </>
      )}
    </section>
  );
}
