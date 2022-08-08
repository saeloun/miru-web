import * as React from "react";
import { Trash } from "phosphor-react";

const EditMembersListForm = ({ members, allMemberList, updateMemberState, setMembers, handleSubmit, currencySymbol }) => {
  const anyError = false; // this is dummy atm

  const removeMemberHandler = (idx) => {
    setMembers(members => members.filter((_, i) => i != idx));
  };

  const addNewMemberRowHandler = () => {
    setMembers(oldMembers => [...oldMembers, {}]);
  };

  const getMember = (member, idx) => {
    if (member.isExisting) {
      return <input type="text" className="form__input" disabled value={member.name} />;
    }
    return (
      <select
        value={member.id}
        name={member.id}
        id={member.id}
        disabled={member.isExisting}
        className="w-full px-3 py-1 font-medium text-sm rounded bg-miru-gray-100 h-8"
        onChange={e => { member.isExisting ? null : updateMemberState(idx, "id", parseInt(e.target.value)); }}>
        <option value="">Please select</option>
        {allMemberList.map((memberFromAllMemberList) => (
          <option
            key={memberFromAllMemberList.id}
            value={memberFromAllMemberList.id}
            hidden={memberFromAllMemberList.isAdded}>
            {memberFromAllMemberList.name}
          </option>
        ))}
      </select>
    );
  };

  return (
    <form className="mt-7" onSubmit={handleSubmit}>
      <h5 className="text-xs mb-4 text-miru-dark-purple-1000">Team Members</h5>
      {members.map((member, idx) => (
        <div className="flex items-center mb-2" key={idx}>
          <div className="mr-2 w-56">
            {getMember(member, idx)}
          </div>
          <div className="mr-2 w-24 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-1 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm"> {currencySymbol} </span>
            </div>
            <input
              placeholder="Rate"
              className={`form__input ${anyError
                ? "border-red-600 focus:ring-red-600 focus:border-red-600"
                : "border-gray-100 focus:ring-miru-gray-1000 focus:border-miru-gray-1000"}`}
              type="number"
              name={member.hourlyRate}
              id={member.hourlyRate}
              value={member.hourlyRate || "0.0"}
              onChange={e => (updateMemberState(idx, "hourlyRate", e.target.value))}
            />
          </div>
          <div className="w-6 text-right">
            <button type="button"
              onClick={() => removeMemberHandler(idx)}>
              <Trash size={15} fill="#5B34EA" />
            </button>
          </div>
        </div>
      ))}

      <div className="actions mt-4 text-center">
        <button
          name="add"
          className="text-miru-han-purple-1000 "
          type="button"
          onClick={addNewMemberRowHandler}
        >
          + Add another team member
        </button>
      </div>

      <div className="actions mt-4">
        <input
          type="submit"
          name="commit"
          value="SAVE CHANGES"
          className="form__input_submit"
        />
      </div>
    </form>
  );
};

export default EditMembersListForm;
