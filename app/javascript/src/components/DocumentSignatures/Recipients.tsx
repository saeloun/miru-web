import React from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import type { Field, Recipient } from "./types";

export default function Recipients({
  recipients,
  fields,
  change,
  editable,
}: {
  recipients: Recipient[];
  fields: Field[];
  change: (value: Recipient[]) => void;
  editable: boolean;
}) {
  const update = (id: string, patch: Partial<Recipient>) =>
    change(
      recipients.map(person =>
        person.id === id ? { ...person, ...patch } : person
      )
    );

  return (
    <section aria-label="Recipients" className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold">Recipients</h2>
        {editable && (
          <Button
            type="button"
            variant="outline"
            disabled={recipients.length >= 20}
            onClick={() =>
              change([
                ...recipients,
                {
                  id: window.crypto.randomUUID(),
                  name: "",
                  email: "",
                  role: "signer",
                },
              ])
            }
          >
            Add recipient
          </Button>
        )}
      </div>
      {recipients.map((person, index) => {
        const assigned = fields.some(field => field.recipient_id === person.id);

        return (
          <fieldset
            key={person.id}
            disabled={!editable}
            aria-label={`Recipient ${index + 1}`}
            className="space-y-2 rounded-lg border border-border p-3"
          >
            <legend className="px-1 text-sm">Recipient {index + 1}</legend>
            <div>
              <Label htmlFor={`${person.id}-name`}>Name</Label>
              <Input
                id={`${person.id}-name`}
                required
                maxLength={200}
                value={person.name}
                onChange={event =>
                  update(person.id, { name: event.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor={`${person.id}-email`}>Email</Label>
              <Input
                id={`${person.id}-email`}
                type="email"
                required
                maxLength={254}
                value={person.email}
                onChange={event =>
                  update(person.id, { email: event.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor={`${person.id}-role`}>Role</Label>
              <select
                id={`${person.id}-role`}
                className="signatures-select"
                value={person.role}
                disabled={assigned}
                onChange={event =>
                  update(person.id, {
                    role: event.target.value as Recipient["role"],
                  })
                }
              >
                <option value="signer">Signer</option>
                <option value="reviewer">Reviewer</option>
                <option value="cc">Copy recipient</option>
              </select>
            </div>
            {assigned && (
              <p className="text-xs text-muted-foreground">
                Reassign or remove this recipient’s fields before changing their
                role or removing them.
              </p>
            )}
            {editable && (
              <Button
                type="button"
                variant="outline"
                disabled={assigned}
                onClick={() =>
                  change(recipients.filter(item => item.id !== person.id))
                }
              >
                Remove recipient
              </Button>
            )}
          </fieldset>
        );
      })}
    </section>
  );
}
