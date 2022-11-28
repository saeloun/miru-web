import * as React from "react";

import { DeleteIcon } from "miruIcons";

const EditMembersListForm = ({
  members,
  allMemberList,
  updateMemberState,
  setMembers,
  handleSubmit,
  currencySymbol,
}) => {
  const anyError = false; // this is dummy atm

  const removeMemberHandler = idx => {
    setMembers(members => members.filter((_, i) => i != idx));
  };

  const addNewMemberRowHandler = () => {
    setMembers(oldMembers => [
      ...oldMembers,
      { hourlyRate: 0, isExisting: false },
    ]);
  };

  const getMember = (member, idx) => {
    if (member.isExisting) {
      return (
        <input
          disabled
          className="form__input"
          type="text"
          value={member.name}
        />
      );
    }

    return (
      <select
        className="h-8 w-full rounded bg-miru-gray-100 px-3 py-1 text-sm font-medium"
        disabled={member.isExisting}
        id={member.id}
        name={member.id}
        value={member.id}
        onChange={e => {
          member.isExisting
            ? null
            : updateMemberState(idx, "id", parseInt(e.target.value));
        }}
      >
        <option value="">Please select</option>
        {allMemberList.map(memberFromAllMemberList => (
          <option
            hidden={memberFromAllMemberList.isAdded}
            key={memberFromAllMemberList.id}
            value={memberFromAllMemberList.id}
          >
            {memberFromAllMemberList.name}
          </option>
        ))}
      </select>
    );
  };

  return (
    <form className="mt-7" onSubmit={handleSubmit}>
      <h5 className="mb-4 text-xs text-miru-dark-purple-1000">Team Members</h5>
      {members.map((member, idx) => (
        <div className="mb-2 flex items-center" key={idx}>
          <div className="mr-2 w-56">{getMember(member, idx)}</div>
          <div className="relative mr-2 w-24 rounded-md shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-1">
              <span className="text-gray-500 sm:text-sm">
                {" "}
                {currencySymbol}{" "}
              </span>
            </div>
            <input
              id={member.hourlyRate}
              name={member.hourlyRate}
              placeholder="Rate"
              type="number"
              value={member.hourlyRate || "0.0"}
              className={`form__input ${
                anyError
                  ? "border-red-600 focus:border-red-600 focus:ring-red-600"
                  : "border-gray-100 focus:border-miru-gray-1000 focus:ring-miru-gray-1000"
              }`}
              onChange={e =>
                updateMemberState(idx, "hourlyRate", e.target.value)
              }
            />
          </div>
          <div className="w-6 text-right">
            <button type="button" onClick={() => removeMemberHandler(idx)}>
              <DeleteIcon fill="#5B34EA" size={15} />
            </button>
          </div>
        </div>
      ))}
      <div className="actions mt-4 text-center">
        <button
          className="text-miru-han-purple-1000 "
          name="add"
          type="button"
          onClick={addNewMemberRowHandler}
        >
          + Add another team member
        </button>
      </div>
      <div className="actions mt-4">
        <input
          className="form__input_submit"
          name="commit"
          type="submit"
          value="SAVE CHANGES"
        />
      </div>
    </form>
  );
};

export default EditMembersListForm;
