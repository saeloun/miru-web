import * as React from "react";

const closeButton = require("../../../../../assets/images/close_button.svg"); // eslint-disable-line @typescript-eslint/no-var-requires

const EditMembersListForm = ({ members, allMemberList, updateMemberState, setMembers, handleSubmit }) => {
  const anyError = false; // this is dummy atm

  return (
    <form onSubmit={handleSubmit}>
      {/* Show already added members */}
      {members.map((m, idx) => (
        <div className="flex flex-row">
          <div>
            <select
              value={m.id}
              name={m.id}
              id={m.id}
              disabled={m.isExisting}
              className="w-60 bg-miru-gray-100 rounded-sm mt-2 h-8"
              onChange={e => { m.isExisting ? null : updateMemberState(idx, "id", parseInt(e.target.value)); }}>
              {m.isExisting ? null : <option value="" disabled selected>Select team Member</option>}
              {allMemberList.map((am) => (
                <option
                  key={am.id}
                  value={am.id}
                  hidden={am.isAdded}>
                  {am.name}
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
              name={m.hourlyRate}
              id={m.hourlyRate}
              value={m.hourlyRate}
              // disabled={m.isExisting}
              onChange={e => (updateMemberState(idx, "hourlyRate", e.target.value))}
            />
          </div>

          {/* Delete button for each member */}
          <div>
            <button type="button"
              onClick={() => {
                setMembers(members => members.filter((_, i) => i != idx));
              }}
            >
              <img
                src={closeButton}
              />
            </button>
          </div>
        </div>
      ))}

      <div className="actions mt-4">
        <input

          name="add"
          value="+ Add amother team member"
          className="form__input_submit"
          onClick={() => {
            setMembers(oldMembers => [...oldMembers, {}]);
          }}
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
