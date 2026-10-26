import React, { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { useUserContext } from "context/UserContext";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import ApplicationForm from "./ApplicationForm";
import ApplicationDetail from "./ApplicationDetail";
import Roles from "./Roles";
import Settings from "./Settings";
import Inbox from "./Inbox";
import Mailboxes from "./Mailboxes";
import ReceiptDetail from "./ReceiptDetail";
import Picker from "./Picker";
import AssignmentLibrary from "./AssignmentLibrary";
import AssignmentTemplateEditor from "./AssignmentTemplateEditor";
import { failureMessage, read } from "./api";
import {
  receiptLabel,
  stageLabel,
  type ApplicationPage,
  type Choice,
} from "./types";

function Applications({ companyId }: { companyId: number }) {
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState("");
  const [role, setRole] = useState<Choice | null>(null);
  const [owner, setOwner] = useState<Choice | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [data, setData] = useState<ApplicationPage | null>(null);
  const [stages, setStages] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const controller = new window.AbortController();
    setData(null);
    setError("");
    const timer = setTimeout(
      () =>
        read<ApplicationPage>(
          "applications",
          companyId,
          {
            query,
            stage: stage || undefined,
            role_id: role?.id,
            owner_employment_id: owner?.id,
            from: from || undefined,
            to: to || undefined,
            page,
          },
          controller.signal
        )
          .then(result => {
            if (active) {
              setData(result);
              setStages(result.stages);
            }
          })
          .catch(failure => {
            if (active) setError(failureMessage(failure));
          }),
      200
    );

    return () => {
      active = false;
      controller.abort();
      clearTimeout(timer);
    };
  }, [companyId, query, stage, role?.id, owner?.id, from, to, page, refresh]);

  const clear = () => {
    setQuery("");
    setStage("");
    setRole(null);
    setOwner(null);
    setFrom("");
    setTo("");
    setPage(1);
  };
  const filtered = Boolean(query || stage || role || owner || from || to);

  return (
    <div className="space-y-5">
      <section
        aria-label="Application filters"
        className="grid gap-4 rounded-lg border bg-card p-4 sm:grid-cols-2 xl:grid-cols-3"
      >
        <div className="space-y-2">
          <Label htmlFor="hiring-query">Find candidates</Label>
          <Input
            id="hiring-query"
            className="h-11"
            value={query}
            maxLength={200}
            placeholder="Name or email"
            onChange={event => {
              setQuery(event.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="hiring-stage">Stage</Label>
          <select
            id="hiring-stage"
            value={stage}
            onChange={event => {
              setStage(event.target.value);
              setPage(1);
            }}
            className="h-11 w-full rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">All stages</option>
            {Object.entries(stages).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <Picker
          id="filter-role"
          label="Role"
          kind="roles"
          purpose="history"
          companyId={companyId}
          value={role}
          emptyLabel="All roles"
          change={value => {
            setRole(value);
            setPage(1);
          }}
        />
        <Picker
          id="filter-owner"
          label="Hiring owner"
          kind="owners"
          purpose="history"
          companyId={companyId}
          value={owner}
          emptyLabel="All owners"
          change={value => {
            setOwner(value);
            setPage(1);
          }}
        />
        <div className="space-y-2">
          <Label htmlFor="hiring-from">From date</Label>
          <Input
            id="hiring-from"
            type="date"
            className="h-11"
            value={from}
            onChange={event => {
              setFrom(event.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="hiring-to">To date</Label>
          <Input
            id="hiring-to"
            type="date"
            className="h-11"
            value={to}
            onChange={event => {
              setTo(event.target.value);
              setPage(1);
            }}
          />
        </div>
        {filtered && (
          <div>
            <Button variant="outline" className="min-h-11" onClick={clear}>
              Clear filters
            </Button>
          </div>
        )}
      </section>

      {error ? (
        <div role="alert" className="space-y-3 rounded-lg border p-4">
          <p className="break-words text-sm text-destructive">{error}</p>
          <Button
            variant="outline"
            className="min-h-11"
            onClick={() => setRefresh(refresh + 1)}
          >
            Retry
          </Button>
        </div>
      ) : !data ? (
        <p role="status" className="py-8 text-sm text-muted-foreground">
          Loading applications…
        </p>
      ) : data.applications.length === 0 ? (
        <section className="rounded-lg border bg-card px-5 py-12 text-center">
          <h2 className="text-lg font-semibold">
            {filtered ? "No matching applications" : "No applications yet"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {filtered
              ? "Adjust your filters to find a candidate."
              : "Add an application to start a candidate's hiring history."}
          </p>
          {!filtered && (
            <Button asChild className="mt-5 min-h-11">
              <Link to="/hiring/new">Add application</Link>
            </Button>
          )}
        </section>
      ) : (
        <section className="min-w-0 rounded-lg border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <caption className="sr-only">Hiring applications</caption>
              <thead className="border-b bg-muted/40">
                <tr>
                  {[
                    "Candidate",
                    "Role",
                    "Stage",
                    "Received",
                    "Hiring owner",
                  ].map(label => (
                    <th key={label} className="px-4 py-3 font-medium">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.applications.map(application => (
                  <tr key={application.id}>
                    <td className="max-w-[18rem] px-4 py-2">
                      <Link
                        className="inline-flex min-h-11 items-center break-words font-medium text-primary underline-offset-4 hover:underline"
                        to={`/hiring/applications/${application.id}`}
                      >
                        {application.candidate.full_name}
                      </Link>
                      <p className="break-all text-muted-foreground">
                        {application.candidate.email}
                      </p>
                    </td>
                    <td className="max-w-[14rem] break-words px-4 py-3">
                      {application.role?.title || "No role yet"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary">
                        {stageLabel(application.stage)}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums">
                      {receiptLabel(application.received_at, data.time_zone)}
                    </td>
                    <td className="px-4 py-3">
                      {application.owner?.full_name || "Unassigned"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t p-4 text-sm text-muted-foreground">
            <p>Received times: {data.time_zone}</p>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className="min-h-11"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <span className="tabular-nums">Page {page}</span>
              <Button
                variant="outline"
                className="min-h-11"
                disabled={!data.pagination.has_more}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function Workspace({ companyId }: { companyId: number }) {
  const { applicationId, receiptId, templateId } = useParams();
  const location = useLocation();
  const newApplication = location.pathname.endsWith("/new");
  const roles = location.pathname.endsWith("/roles");
  const settings = location.pathname.endsWith("/communications");
  const inbox = location.pathname.endsWith("/inbox");
  const mailboxes = location.pathname.endsWith("/mailboxes");
  const library =
    location.pathname.endsWith("/assignment-library") || !!templateId;

  return (
    <div
      data-testid="hiring-workspace"
      className="mx-auto min-w-0 max-w-7xl space-y-6 p-4 sm:p-6"
    >
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Hiring</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Applications, candidate history and hiring roles.
          </p>
        </div>
        <nav aria-label="Hiring navigation" className="flex flex-wrap gap-3">
          {(roles ||
            settings ||
            inbox ||
            mailboxes ||
            receiptId ||
            library) && (
            <Button asChild variant="outline" className="min-h-11">
              <Link to="/hiring">All applications</Link>
            </Button>
          )}
          {!roles && (
            <Button asChild variant="outline" className="min-h-11">
              <Link to="/hiring/roles">Manage roles</Link>
            </Button>
          )}
          {!settings && (
            <Button asChild variant="outline" className="min-h-11">
              <Link to="/hiring/communications">Communication settings</Link>
            </Button>
          )}
          {!inbox && (
            <Button asChild variant="outline" className="min-h-11">
              <Link to="/hiring/inbox">Email inbox</Link>
            </Button>
          )}
          {!newApplication && (
            <Button asChild className="min-h-11">
              <Link to="/hiring/new">Add application</Link>
            </Button>
          )}
          {!library && (
            <Button asChild variant="outline" className="min-h-11">
              <Link to="/hiring/assignment-library">Assignment library</Link>
            </Button>
          )}
        </nav>
      </header>
      {templateId ? (
        <AssignmentTemplateEditor
          key={templateId}
          companyId={companyId}
          id={templateId}
        />
      ) : library ? (
        <AssignmentLibrary companyId={companyId} />
      ) : receiptId ? (
        <ReceiptDetail key={receiptId} companyId={companyId} id={receiptId} />
      ) : inbox ? (
        <Inbox companyId={companyId} />
      ) : mailboxes ? (
        <Mailboxes companyId={companyId} />
      ) : settings ? (
        <Settings companyId={companyId} />
      ) : applicationId ? (
        <ApplicationDetail
          key={applicationId}
          companyId={companyId}
          id={applicationId}
        />
      ) : newApplication ? (
        <ApplicationForm companyId={companyId} />
      ) : roles ? (
        <Roles companyId={companyId} />
      ) : (
        <Applications companyId={companyId} />
      )}
    </div>
  );
}

export default function Hiring() {
  const { company, companyRole } = useUserContext();
  if (!company) {
    return (
      <p role="status" className="p-6">
        Loading workspace…
      </p>
    );
  }

  if (!["owner", "admin"].includes(companyRole)) {
    return (
      <p role="alert" className="p-6">
        Hiring requires an active Owner or Admin membership.
      </p>
    );
  }

  return <Workspace key={company.id} companyId={company.id} />;
}
