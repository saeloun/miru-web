import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Api from "apis/api";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import Picker from "./Picker";
import { failureMessage, quiet, verifyWorkspace } from "./api";
import type { Application, Choice } from "./types";

export default function ApplicationForm({ companyId }: { companyId: number }) {
  const navigate = useNavigate();
  const [requestKey] = useState(() => window.crypto.randomUUID());
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [role, setRole] = useState<Choice | null>(null);
  const [owner, setOwner] = useState<Choice | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [savedApplicationId, setSavedApplicationId] = useState<number | null>(
    null
  );
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;
    };
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy || savedApplicationId) return;
    setBusy(true);
    setError("");
    try {
      const { data } = await Api.post<{
        company_id: number;
        application: Application;
      }>(
        "/hiring/applications",
        {
          application: {
            company_id: companyId,
            request_key: requestKey,
            full_name: name,
            email,
            notes,
            role_id: role?.id || null,
            owner_employment_id: owner?.id || null,
          },
        },
        quiet
      );
      verifyWorkspace(data, companyId);
      if (mounted.current) {
        navigate(`/hiring/applications/${data.application.id}`);
      }
    } catch (failure) {
      if (mounted.current) {
        setError(failureMessage(failure));
        if (axios.isAxiosError(failure) && failure.response?.status === 409) {
          const data = failure.response.data;
          if (
            data?.company_id === companyId &&
            Number.isSafeInteger(data.existing_application_id) &&
            data.existing_application_id > 0
          ) {
            setSavedApplicationId(data.existing_application_id);
          }
        }
      }
    } finally {
      if (mounted.current) setBusy(false);
    }
  };

  return (
    <section
      className="max-w-3xl rounded-lg border bg-card p-4 sm:p-6"
      aria-labelledby="new-application-title"
    >
      <h2 id="new-application-title" className="text-lg font-semibold">
        Add application
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Create a private candidate history. An existing email in this workspace
        keeps its profile and gains a separate application.
      </p>
      <form onSubmit={submit} className="mt-6 space-y-5">
        <fieldset disabled={busy} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="candidate-name">Full name</Label>
              <Input
                id="candidate-name"
                className="h-11"
                required
                maxLength={200}
                autoComplete="off"
                value={name}
                onChange={event => setName(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="candidate-email">Email</Label>
              <Input
                id="candidate-email"
                className="h-11"
                type="email"
                required
                maxLength={254}
                autoComplete="off"
                value={email}
                onChange={event => setEmail(event.target.value)}
              />
            </div>
            <Picker
              id="application-role"
              label="Role"
              kind="roles"
              companyId={companyId}
              value={role}
              change={setRole}
              emptyLabel="No role yet"
              purpose="intake"
            />
            <Picker
              id="application-owner"
              label="Hiring owner"
              kind="owners"
              purpose="intake"
              companyId={companyId}
              value={owner}
              change={setOwner}
              emptyLabel="Unassigned"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="candidate-notes">Internal notes</Label>
            <Textarea
              id="candidate-notes"
              rows={5}
              maxLength={10000}
              value={notes}
              onChange={event => setNotes(event.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Visible to hiring Admins and Owners.
            </p>
          </div>
        </fieldset>
        {error && (
          <p role="alert" className="break-words text-sm text-destructive">
            {error}
          </p>
        )}
        <div className="flex flex-wrap gap-3">
          <Button
            type="submit"
            className="min-h-11"
            disabled={busy || savedApplicationId !== null}
          >
            {busy ? "Adding…" : "Add application"}
          </Button>
          {savedApplicationId && (
            <Button asChild variant="outline" className="min-h-11">
              <Link to={`/hiring/applications/${savedApplicationId}`}>
                Open saved application
              </Link>
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            disabled={busy}
            onClick={() => navigate("/hiring")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </section>
  );
}
