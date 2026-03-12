import React from "react";

import { Trash, Plus } from "phosphor-react";

import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "components/ui/select";

const EditMembersListForm = ({
  members,
  allMemberList,
  updateMemberState,
  setMembers,
  handleSubmit,
  currencySymbol,
}) => {
  const [errors, setErrors] = React.useState({});

  const availableMembers = allMemberList.filter(
    member => !members.some(currentMember => currentMember.id === member.id)
  );

  const removeMemberHandler = memberIndex => {
    setMembers(currentMembers =>
      currentMembers.filter((_, index) => index !== memberIndex)
    );
  };

  const addNewMemberRowHandler = () => {
    setMembers(currentMembers => [
      ...currentMembers,
      { id: "", hourlyRate: "0.00", isExisting: false },
    ]);
  };

  const handleHourlyRateInput = (value, memberIndex) => {
    if (value === "" || Number(value) < 0 || Number.isNaN(Number(value))) {
      setErrors(currentErrors => ({
        ...currentErrors,
        [memberIndex]: "Please enter a valid rate",
      }));
    } else {
      setErrors(currentErrors => {
        const nextErrors = { ...currentErrors };
        delete nextErrors[memberIndex];

        return nextErrors;
      });
    }

    updateMemberState(memberIndex, "hourlyRate", value);
  };

  const isSubmitDisabled =
    members.length === 0 ||
    members.some(
      member =>
        !member.id || member.hourlyRate === "" || Number(member.hourlyRate) < 0
    ) ||
    Object.keys(errors).length > 0;

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="space-y-4">
        {members.map((member, memberIndex) => {
          const selectedMember = allMemberList.find(
            memberFromList => String(memberFromList.id) === String(member.id)
          );

          return (
            <div
              key={`${member.id || "new"}-${memberIndex}`}
              className="grid gap-4 rounded-xl border border-border bg-card p-4 md:grid-cols-[1.5fr_1fr_auto]"
            >
              <div className="space-y-2">
                <Label htmlFor={`member-${memberIndex}`}>Team member</Label>
                {member.isExisting ? (
                  <Input
                    disabled
                    id={`member-${memberIndex}`}
                    value={selectedMember?.name || member.name || ""}
                  />
                ) : (
                  <Select
                    value={member.id ? String(member.id) : ""}
                    onValueChange={value =>
                      updateMemberState(memberIndex, "id", parseInt(value))
                    }
                  >
                    <SelectTrigger id={`member-${memberIndex}`}>
                      <SelectValue placeholder="Select teammate" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableMembers
                        .concat(selectedMember ? [selectedMember] : [])
                        .filter(
                          (value, index, self) =>
                            self.findIndex(item => item.id === value.id) ===
                            index
                        )
                        .map(memberOption => (
                          <SelectItem
                            key={memberOption.id}
                            value={String(memberOption.id)}
                          >
                            {memberOption.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor={`rate-${memberIndex}`}>Hourly rate</Label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
                    {currencySymbol}
                  </span>
                  <Input
                    id={`rate-${memberIndex}`}
                    className="pl-8"
                    min="0"
                    step="0.01"
                    type="number"
                    value={member.hourlyRate}
                    onChange={e =>
                      handleHourlyRateInput(e.target.value, memberIndex)
                    }
                  />
                </div>
                {errors[memberIndex] && (
                  <p className="text-sm text-destructive">
                    {errors[memberIndex]}
                  </p>
                )}
              </div>

              <div className="flex items-end">
                <Button
                  aria-label={`remove-member-${memberIndex}`}
                  id="removeMember"
                  size="icon"
                  type="button"
                  variant="outline"
                  onClick={() => removeMemberHandler(memberIndex)}
                >
                  <Trash size={16} />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          disabled={availableMembers.length === 0}
          id="addMember"
          type="button"
          variant="outline"
          onClick={addNewMemberRowHandler}
        >
          <Plus size={16} />
          <span>
            {members.length > 0 ? "Add another team member" : "Add team member"}
          </span>
        </Button>

        <div className="flex gap-3">
          <Button type="submit" disabled={isSubmitDisabled}>
            Save team members
          </Button>
        </div>
      </div>
    </form>
  );
};

export default EditMembersListForm;
