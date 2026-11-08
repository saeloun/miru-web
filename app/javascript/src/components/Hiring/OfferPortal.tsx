import React, { useCallback, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { getCsrfToken } from "utils/authHeaders";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import type { OfferTerms } from "./ApplicationOffers";

type CandidateOffer = {
  state: string;
  lock_version: number;
  company_name: string;
  candidate_name: string;
  recipient: string;
  terms: OfferTerms;
  expires_at: string;
};
type Answer = { offer_version: number; outcome: "accepted" | "declined" };

function OfferPortal({ token }: { token: string }) {
  const [offer, setOffer] = useState<CandidateOffer | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [pending, setPending] = useState<Answer | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [unavailable, setUnavailable] = useState(false);
  const status = useRef<HTMLParagraphElement>(null);
  const request = useCallback(
    async (
      action: string,
      attributes: object,
      signal?: InstanceType<typeof window.AbortController>["signal"]
    ) => {
      const response = await window.fetch(`/hiring-offer/${action}`, {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        referrerPolicy: "no-referrer",
        signal,
        headers: {
          "X-CSRF-Token": getCsrfToken(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ offer_portal: { token, ...attributes } }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 410) {
          setOffer(null);
          setPending(null);
          setConfirmed(false);
          setUnavailable(true);
        } else if (response.status < 500) setPending(null);
        throw new Error(
          typeof data.errors === "string"
            ? data.errors
            : "Unable to record this response. Check your connection."
        );
      }

      return data.offer as CandidateOffer;
    },
    [token]
  );

  useEffect(() => {
    const controller = new window.AbortController();
    setError("");
    setBusy(true);
    request("open", {}, controller.signal)
      .then(result => {
        if (!controller.signal.aborted) {
          setOffer(result);
          setPending(null);
          setConfirmed(false);
        }
      })
      .catch(failure => {
        if (!controller.signal.aborted) setError(failure.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setBusy(false);
      });

    return () => controller.abort();
  }, [request, reload]);

  useEffect(() => {
    if (error || offer?.state === "accepted" || offer?.state === "declined") {
      status.current?.focus();
    }
  }, [error, offer?.state]);

  const reply = async (answer: Answer) => {
    if (busy) return;
    setBusy(true);
    setError("");
    setPending(answer);
    try {
      setOffer(await request("reply", answer));
      setPending(null);
      setConfirmed(false);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Unable to record your response."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 sm:p-8">
      <h1 className="text-2xl font-semibold">Private offer</h1>
      <p ref={status} role={error ? "alert" : "status"} tabIndex={-1}>
        {error ||
          (offer?.state === "accepted"
            ? "Your acceptance is recorded. The hiring team will arrange onboarding."
            : offer?.state === "declined"
            ? "Your decline is recorded."
            : !offer
            ? "Loading offer…"
            : "Review these terms before responding.")}
      </p>
      {offer && (
        <>
          <section
            className="space-y-3 rounded border p-4"
            aria-label="Issued offer terms"
          >
            <h2 className="break-words text-xl font-semibold">
              {offer.company_name}
            </h2>
            <p className="break-words">
              For {offer.candidate_name} · {offer.recipient}
            </p>
            <p className="break-words">
              {offer.terms.title} · {offer.terms.engagement}
            </p>
            <p>
              {offer.terms.amount} {offer.terms.currency} / {offer.terms.period}
            </p>
            <p>Proposed joining date: {offer.terms.joining_on}</p>
            <p>
              Respond by the end of {offer.terms.expires_on} (
              {offer.terms.time_zone}).
            </p>
            <p>
              This records your response to the issued offer. Any employment or
              consulting agreement is handled separately by the hiring team.
            </p>
          </section>
          {offer.state === "sent" && (
            <fieldset disabled={busy || Boolean(pending)} className="space-y-4">
              <Label className="flex min-h-11 items-center gap-3">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={event => setConfirmed(event.target.checked)}
                />
                I have reviewed these offer terms
              </Label>
              <div className="flex flex-wrap gap-3">
                <Button
                  disabled={!confirmed}
                  onClick={() =>
                    void reply({
                      offer_version: offer.lock_version,
                      outcome: "accepted",
                    })
                  }
                >
                  Accept offer
                </Button>
                <Button
                  variant="outline"
                  disabled={!confirmed}
                  onClick={() =>
                    void reply({
                      offer_version: offer.lock_version,
                      outcome: "declined",
                    })
                  }
                >
                  Decline offer
                </Button>
              </div>
            </fieldset>
          )}
          {pending && (
            <div className="space-y-2">
              <p>
                Your response may have been recorded. Reload its status or retry
                this same response.
              </p>
              <Button disabled={busy} onClick={() => void reply(pending)}>
                Retry unchanged response
              </Button>
            </div>
          )}
        </>
      )}
      {!unavailable && (
        <Button
          variant="outline"
          disabled={busy}
          onClick={() => setReload(value => value + 1)}
        >
          Reload offer
        </Button>
      )}
    </div>
  );
}

export function mountOfferPortal(element: HTMLElement, token: string) {
  createRoot(element).render(<OfferPortal token={token} />);
}
