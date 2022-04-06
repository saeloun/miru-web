import * as React from "react";
import { Trash } from "phosphor-react";

const closeButton = require("../../../../../assets/images/close_button.svg"); // eslint-disable-line @typescript-eslint/no-var-requires

const EditMembersListForm = ({ members, allMemberList, updateMemberState, setMembers, handleSubmit }) => {
  const anyError = false; // this is dummy atm

  const removeMemberHandler = (idx) => {
    setMembers(members => members.filter((_, i) => i != idx));
  };

  const addNewMemberRowHandler = () => {
    setMembers(oldMembers => [...oldMembers, {}]);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Show already added members */}
      {members.map((member, idx) => (
        <div className="flex flex-row">
          <div>
            <select
              value={member.id}
              name={member.id}
              id={member.id}
              disabled={member.isExisting}
              className="w-60 bg-miru-gray-100 rounded-sm mt-2 h-8"
              onChange={e => { member.isExisting ? null : updateMemberState(idx, "id", parseInt(e.target.value)); }}>
              {member.isExisting ? null : <option value="" disabled selected>Select team Member</option>}
              {allMemberList.map((memberFromAllMemberList) => (
                <option
                  key={memberFromAllMemberList.id}
                  value={memberFromAllMemberList.id}
                  hidden={memberFromAllMemberList.isAdded}>
                  {memberFromAllMemberList.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <input
              placeholder="Rate"
              className={`form__input ${anyError
                ? "border-red-600 focus:ring-red-600 focus:border-red-600"
                : "border-gray-100 focus:ring-miru-gray-1000 focus:border-miru-gray-1000"}`}
              type="number"
              name={member.hourlyRate}
              id={member.hourlyRate}
              value={member.hourlyRate}
              onChange={e => (updateMemberState(idx, "hourlyRate", e.target.value))}
            />
          </div>

          {/* Delete button for each member */}
          <div>
            <button type="button"
              onClick={() => removeMemberHandler(idx)}>
              <Trash size={15} />
              {/* <img
                src={closeButton}
              /> */}
            </button>
          </div>
        </div>
      ))}

      <div className="actions mt-4">
        <input
          name="add"
          value="+ Add another team member"
          className="form__input_submit"
          onClick={addNewMemberRowHandler}
        />
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
