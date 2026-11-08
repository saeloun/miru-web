import React from "react";
import { deliveryStateLabels, stageLabel, type InternalNotice } from "./types";

export default function InternalNoticeHistory({
  title,
  notifications,
}: {
  title: string;
  notifications?: InternalNotice[];
}) {
  if (!notifications) return null;

  return (
    <section aria-label={title} className="space-y-3">
      <h4 className="font-semibold">{title}</h4>
      {!notifications.length && <p>No internal notices queued.</p>}
      {notifications.map(notice => (
        <details key={notice.id} className="rounded border p-3">
          <summary className="min-h-11 cursor-pointer break-words">
            {notice.content.subject} ·{" "}
            {deliveryStateLabels[notice.state] || stageLabel(notice.state)}
          </summary>
          <p className="break-words">To: {notice.content.to}</p>
          <p className="break-words">Reply to: {notice.content.reply_to}</p>
          <p className="whitespace-pre-wrap break-words">
            {notice.content.body}
          </p>
          {notice.error_code && (
            <p>Delivery issue: {stageLabel(notice.error_code)}</p>
          )}
          {notice.state === "uncertain" && (
            <p>
              Check provider acceptance before any further contact. This notice
              will not be resent automatically.
            </p>
          )}
        </details>
      ))}
    </section>
  );
}
