import React, { useEffect, useState } from "react";

import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import { useUserContext } from "context/UserContext";
import { Link, useLocation, useParams } from "react-router-dom";
import { hasEmployeeRecordsAccess } from "../../../lib/employeeRecordsAccess";

import { downloadAttachment, employeeRecordsApi, errorMessage } from "./api";
import { Fact, Field, Section, text } from "./Fields";
import Reports from "./Reports";

const bankFields = [
  "bank_account_name",
  "bank_name",
  "bank_branch",
  "bank_account_number",
  "bank_ifsc",
  "bank_swift",
];
const contactFields = ["emergency_contact_name", "emergency_contact_phone"];
const salaryFields = [
  "salary_amount",
  "salary_currency",
  "salary_frequency",
  "salary_effective_on",
];

const paymentDefaults = {
  paid_on: "",
  amount: "",
  currency: "INR",
  reference: "",
  note: "",
};

const Records = ({ companyId, userId, self }) => {
  const [controller] = useState(() => new window.AbortController());
  const [record, setRecord] = useState(null);
  const [details, setDetails] = useState<any>({});
  const [ledger, setLedger] = useState(null);
  const [payment, setPayment] = useState(paymentDefaults);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const identity = { company_id: companyId, user_id: userId };
  const signal = controller.signal;

  const loadRecord = async () => {
    const response = await employeeRecordsApi.record(userId, signal);
    if (signal.aborted) return;
    const result = response.data.employee_record;
    if (
      String(result.company_id) !== companyId ||
      String(result.user.id) !== userId
    ) {
      throw new Error("workspace");
    }
    setRecord(result);
    setDetails(result.private_details);
  };

  const loadPayments = async (page = 1) => {
    const response = await employeeRecordsApi.payments(userId, page, signal);
    if (signal.aborted) return;

    if (String(response.data.company_id) !== companyId) {
      throw new Error("workspace");
    }
    setLedger(response.data);
  };

  const perform = async action => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
    } catch (failure) {
      if (!signal.aborted) {
        setError((await errorMessage(failure)) || text("failed"));
      }
    } finally {
      if (!signal.aborted) setBusy(false);
    }
  };

  useEffect(() => {
    perform(() => Promise.all([loadRecord(), loadPayments()]));

    return () => controller.abort();
  }, []);

  const change = (key, value) =>
    setDetails(previous => ({ ...previous, [key]: value }));
  const family = details.family_members || [];
  const changeFamily = (index, key, value) =>
    change(
      "family_members",
      family.map((member, position) =>
        position === index ? { ...member, [key]: value } : member
      )
    );

  const save = event => {
    event.preventDefault();
    const keys = [
      ...bankFields,
      ...contactFields,
      "family_members",
      ...(record.can_manage ? salaryFields : []),
    ];

    const changed = Object.fromEntries(
      keys
        .filter(
          key =>
            JSON.stringify(details[key]) !==
            JSON.stringify(record.private_details[key])
        )
        .map(key => [key, details[key]])
    );

    perform(async () => {
      await employeeRecordsApi.save(identity, changed, signal);
      await loadRecord();
      if (!signal.aborted) {
        setEditing(false);
        setNotice(text("saved"));
      }
    });
  };

  return (
    <div
      className="mx-auto w-full min-w-0 max-w-4xl space-y-6 p-3 text-foreground sm:p-6"
      data-testid="employee-records"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{text("title")}</h1>
        <Link
          className="text-sm text-primary underline"
          to={self ? "/settings/profile" : `/team/${userId}`}
        >
          {text("backProfile")}
        </Link>
      </div>
      {error && (
        <p
          className="break-words rounded-md border border-destructive p-3 text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      )}
      {notice && <p role="status">{notice}</p>}
      {!record ? (
        !error && <p role="status">{text("loading")}</p>
      ) : (
        <>
          <Section title={text("personalEmployment")}>
            <p className="font-medium">
              {record.user.first_name} {record.user.last_name}
            </p>
            <dl className="grid gap-4 sm:grid-cols-2">
              {["date_of_birth", "personal_email_id", "phone"].map(key => (
                <Fact key={key} label={text(key)}>
                  {record.user[key]}
                </Fact>
              ))}
              <Fact label={text("linkedin")}>
                {record.user.social_accounts?.linkedin_url}
              </Fact>
              <Fact label={text("github")}>
                {record.user.social_accounts?.github_url}
              </Fact>
              {[
                "employee_id",
                "designation",
                "joined_at",
                "employment_type",
              ].map(key => (
                <Fact key={key} label={text(key)}>
                  {record.employment[key]}
                </Fact>
              ))}
              <Fact label={text("address")}>
                {record.user.addresses?.map(address => (
                  <p key={address.id}>
                    {[
                      address.address_type,
                      address.address_line_1,
                      address.address_line_2,
                      address.city,
                      address.state,
                      address.country,
                      address.pin,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                ))}
              </Fact>
            </dl>
            {self && (
              <Link
                className="inline-block text-sm text-primary underline"
                to="/settings/profile/edit"
              >
                {text("editContact")}
              </Link>
            )}
          </Section>
          <Section title={text("privateDetails")}>
            {!editing ? (
              <>
                <dl className="grid gap-4 sm:grid-cols-2">
                  {[...contactFields, ...bankFields].map(key => (
                    <Fact key={key} label={text(key)}>
                      {key === "bank_account_number" && details[key]
                        ? `${"•".repeat(
                            Math.max(4, details[key].length - 4)
                          )}${details[key].slice(-4)}`
                        : details[key]}
                    </Fact>
                  ))}
                </dl>
                <h3 className="font-medium">{text("family")}</h3>
                {family.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {text("noFamily")}
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {family.map((member, index) => (
                      <li className="break-words text-sm" key={index}>
                        {[
                          member.name,
                          member.date_of_birth,
                          member.gender,
                          member.relationship,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </li>
                    ))}
                  </ul>
                )}
                <Button
                  disabled={busy}
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditing(true);
                    setError("");
                    setNotice("");
                  }}
                >
                  {text("editRecords")}
                </Button>
              </>
            ) : (
              <form className="space-y-5" onSubmit={save}>
                <div className="grid gap-4 sm:grid-cols-2">
                  {[...contactFields, ...bankFields].map(key => (
                    <Field
                      key={key}
                      maxLength={key === "emergency_contact_phone" ? 50 : 200}
                      name={key}
                      value={details[key]}
                      onChange={value => change(key, value)}
                      {...(key === "bank_account_number"
                        ? {
                            pattern: "[0-9]{1,34}",
                            inputMode: "numeric",
                            maxLength: 34,
                          }
                        : key === "bank_ifsc"
                        ? { pattern: "[A-Z]{4}0[A-Z0-9]{6}" }
                        : key === "bank_swift"
                        ? { pattern: "[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?" }
                        : {})}
                    />
                  ))}
                </div>
                <fieldset className="space-y-3">
                  <legend className="font-medium">{text("family")}</legend>
                  {family.map((member, index) => (
                    <fieldset
                      className="space-y-3 rounded-md border border-border p-3"
                      key={index}
                    >
                      <legend className="text-sm font-medium">
                        {text("familyMember", { number: index + 1 })}
                      </legend>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {[
                          "name",
                          "date_of_birth",
                          "gender",
                          "relationship",
                        ].map(key => (
                          <Field
                            key={key}
                            label={text(`family_${key}`)}
                            maxLength={key === "name" ? 200 : 50}
                            name={`family_${index}_${key}`}
                            required={key === "name"}
                            type={key === "date_of_birth" ? "date" : "text"}
                            value={member[key]}
                            onChange={value => changeFamily(index, key, value)}
                          />
                        ))}
                      </div>
                      <Button
                        disabled={busy}
                        type="button"
                        variant="outline"
                        onClick={() =>
                          change(
                            "family_members",
                            family.filter((_, position) => position !== index)
                          )
                        }
                      >
                        {text("removeFamily", { number: index + 1 })}
                      </Button>
                    </fieldset>
                  ))}
                  <Button
                    disabled={busy || family.length >= 20}
                    type="button"
                    variant="outline"
                    onClick={() =>
                      change("family_members", [
                        ...family,
                        {
                          name: "",
                          date_of_birth: "",
                          gender: "",
                          relationship: "",
                        },
                      ])
                    }
                  >
                    {text("addFamily")}
                  </Button>
                </fieldset>
                {record.can_manage && (
                  <fieldset className="grid gap-4 sm:grid-cols-2">
                    <legend className="mb-3 font-medium">
                      {text("salary")}
                    </legend>
                    {salaryFields
                      .filter(key => key !== "salary_frequency")
                      .map(key => (
                        <Field
                          key={key}
                          name={key}
                          type={key === "salary_effective_on" ? "date" : "text"}
                          value={details[key]}
                          onChange={value => change(key, value)}
                          {...(key === "salary_amount"
                            ? {
                                inputMode: "decimal",
                                pattern: "[0-9]{1,10}(\\.[0-9]{1,2})?",
                              }
                            : key === "salary_currency"
                            ? { pattern: "[A-Z]{3}", maxLength: 3 }
                            : {})}
                        />
                      ))}
                    <div className="space-y-2">
                      <Label htmlFor="salary_frequency">
                        {text("salary_frequency")}
                      </Label>
                      <select
                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:ring-2 focus-visible:ring-ring"
                        id="salary_frequency"
                        value={details.salary_frequency || ""}
                        onChange={event =>
                          change("salary_frequency", event.target.value)
                        }
                      >
                        <option value="">{text("empty")}</option>
                        <option value="monthly">{text("monthly")}</option>
                        <option value="annual">{text("annual")}</option>
                      </select>
                    </div>
                  </fieldset>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button disabled={busy} type="submit">
                    {text("saveRecords")}
                  </Button>
                  <Button
                    disabled={busy}
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setDetails(record.private_details);
                      setEditing(false);
                      setError("");
                    }}
                  >
                    {text("cancel")}
                  </Button>
                </div>
              </form>
            )}
          </Section>
          <Section title={text("salary")}>
            <p className="text-sm text-muted-foreground">
              {text("salaryHelp")}
            </p>
            <dl className="grid gap-4 tabular-nums sm:grid-cols-2">
              {salaryFields.map(key => (
                <Fact key={key} label={text(key)}>
                  {record.private_details[key]}
                </Fact>
              ))}
            </dl>
          </Section>
          <Section title={text("documents")}>
            <p className="text-sm text-muted-foreground">
              {text("documentHelp")}
            </p>
            {["pan", "contract"].map(kind => (
              <div className="space-y-3" key={kind}>
                <h3 className="font-medium">{text(kind)}</h3>
                {(kind === "pan" || record.can_manage) && (
                  <div className="space-y-2">
                    <Label htmlFor={`upload_${kind}`}>
                      {text("upload", { kind: text(kind) })}
                    </Label>
                    <Input
                      accept="application/pdf,image/jpeg,image/png"
                      disabled={busy}
                      id={`upload_${kind}`}
                      type="file"
                      onChange={event => {
                        const file = event.target.files?.[0];
                        event.target.value = "";
                        if (!file) return;
                        setError("");
                        if (
                          file.size > 5 * 1024 * 1024 ||
                          ![
                            "application/pdf",
                            "image/jpeg",
                            "image/png",
                          ].includes(file.type)
                        ) {
                          setError(text("invalidDocument"));

                          return;
                        }

                        perform(async () => {
                          await employeeRecordsApi.upload(
                            identity,
                            kind,
                            file,
                            signal
                          );
                          await loadRecord();
                          if (!signal.aborted) setNotice(text("uploaded"));
                        });
                      }}
                    />
                  </div>
                )}
                {record.documents[kind].length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {text("noDocuments")}
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {record.documents[kind].map(document => (
                      <li className="min-w-0" key={document.id}>
                        <Button
                          className="h-auto min-h-10 max-w-full whitespace-normal break-all text-left"
                          disabled={busy}
                          type="button"
                          variant="outline"
                          onClick={() =>
                            perform(() =>
                              downloadAttachment(
                                `/employee_records/documents/${document.id}`,
                                document.filename,
                                signal,
                                { user_id: userId, kind }
                              )
                            )
                          }
                        >
                          {text("downloadDocument", {
                            filename: document.filename,
                          })}
                        </Button>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {document.created_at.slice(0, 10)}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </Section>
          <Section title={text("payments")}>
            <p className="text-sm text-muted-foreground">
              {text("paymentHelp")}
            </p>
            {!ledger ? (
              <p role="status">{text("loading")}</p>
            ) : (
              <>
                {ledger.employee_payments.length === 0 ? (
                  <p>{text("noPayments")}</p>
                ) : (
                  <ul className="space-y-3">
                    {ledger.employee_payments.map(entry => (
                      <li
                        className="space-y-1 rounded-md border border-border p-3 text-sm"
                        key={entry.id}
                      >
                        <p className="font-medium tabular-nums">
                          {entry.paid_on} · {entry.currency} {entry.amount}
                        </p>
                        <p className="break-all">{entry.reference}</p>
                        {entry.note && (
                          <p className="break-words [overflow-wrap:anywhere]">
                            {entry.note}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    disabled={busy || ledger.pagination.page <= 1}
                    type="button"
                    variant="outline"
                    onClick={() =>
                      perform(() => loadPayments(ledger.pagination.page - 1))
                    }
                  >
                    {text("previous")}
                  </Button>
                  <span className="text-sm">
                    {text("page", { number: ledger.pagination.page })}
                  </span>
                  <Button
                    disabled={busy || !ledger.pagination.has_more}
                    type="button"
                    variant="outline"
                    onClick={() =>
                      perform(() => loadPayments(ledger.pagination.page + 1))
                    }
                  >
                    {text("next")}
                  </Button>
                </div>
              </>
            )}
            {record.can_manage && (
              <form
                className="space-y-4 border-t border-border pt-4"
                onSubmit={event => {
                  event.preventDefault();
                  perform(async () => {
                    await employeeRecordsApi.pay(identity, payment, signal);
                    await loadPayments();
                    if (!signal.aborted) {
                      setPayment(paymentDefaults);
                      setNotice(text("paymentSaved"));
                    }
                  });
                }}
              >
                <h3 className="font-medium">{text("recordPayment")}</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  {Object.keys(paymentDefaults).map(key => (
                    <Field
                      key={key}
                      label={text(`payment_${key}`)}
                      maxLength={
                        key === "note" ? 2000 : key === "currency" ? 3 : 200
                      }
                      name={`payment_${key}`}
                      required={key !== "note"}
                      type={key === "paid_on" ? "date" : "text"}
                      value={payment[key]}
                      onChange={value =>
                        setPayment(previous => ({ ...previous, [key]: value }))
                      }
                      {...(key === "amount"
                        ? {
                            inputMode: "decimal",
                            pattern: "[0-9]{1,10}(\\.[0-9]{1,2})?",
                          }
                        : key === "currency"
                        ? { pattern: "[A-Z]{3}" }
                        : {})}
                    />
                  ))}
                </div>
                <Button disabled={busy} type="submit">
                  {text("savePayment")}
                </Button>
              </form>
            )}
          </Section>
          {record.can_manage && <Reports companyId={companyId} />}
        </>
      )}
    </div>
  );
};

const EmployeeRecords = () => {
  const { company, user, companyRole } = useUserContext();
  const { memberId } = useParams();
  const location = useLocation();
  const userId = location.pathname.startsWith("/team/") ? memberId : user?.id;
  const linkedCompany = new URLSearchParams(location.search).get("company_id");
  if (
    !hasEmployeeRecordsAccess(company, user, companyRole, userId) ||
    (linkedCompany !== null && linkedCompany !== String(company?.id))
  ) {
    return (
      <p className="p-6 text-sm" role="alert">
        {text("unavailable")}
      </p>
    );
  }

  return (
    <Records
      companyId={String(company.id)}
      key={`${company.id}:${user.id}:${userId}:${companyRole}:${location.search}`}
      self={String(userId) === String(user.id)}
      userId={String(userId)}
    />
  );
};

export default EmployeeRecords;
