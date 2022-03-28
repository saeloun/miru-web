import * as React from "react";

import projectAPIS from "apis/projects";

const closeButton = require("../../../../assets/images/close_button.svg"); // eslint-disable-line @typescript-eslint/no-var-requires

export interface IEditMembersList {
  setShowAddMemberDialog: any;
  addedMembers: any;
  allMembers: any;
}

const EditMembersList = ({ setShowAddMemberDialog, addedMembers, allMembers }: IEditMembersList) => {
  const [members, setMembers] = React.useState(addedMembers.map(v => ({ ...v, isExisting: true })));
  const [allMemberList, setAllMemberList] = React.useState(allMembers);
  const [rate, setRate] = React.useState<string>();
  const anyError = false; // this is dummy atm

  React.useEffect(() => {
    const addedMemberIds = members.map((v) => v.id);
    setAllMemberList(allMemberList.map(
      (v) => addedMemberIds.includes(v.id)? { ...v, isAdded: true } : { ...v, isAdded: false }));
  }, [members]);

  const handleSubmit = async e => {
    e.preventDefault();

  };

  const updateMemberState = (idx, k, v) => {
    const modalMembers = [...members];
    const memberToEdit = { ...members[idx] };
    memberToEdit[k] = v;
    modalMembers[idx] = memberToEdit;
    setMembers(modalMembers);
  };

  return (
    <div className="px-4 min-h-screen flex items-center justify-center">
      <div
        className="overflow-auto absolute inset-0 z-10 flex items-start justify-center"
        style={{
          backgroundColor: "rgba(29, 26, 49, 0.6)"
        }}
      >
        <div className="relative px-4 min-h-screen md:flex md:items-center md:justify-center">
          <div className="rounded-lg px-6 pb-6 bg-white shadow-xl transform transition-all sm:align-middle sm:max-w-md modal-width">
            <div className="flex justify-between items-center mt-6">
              <h6 className="text-base font-extrabold">{addedMembers.length > 0 ? "Add/Remove" : "Add"} Team Member</h6>
              <button type="button">
                <img
                  src={closeButton}
                  onClick={() => {
                    setShowAddMemberDialog(false);
                  }}
                />
              </button>
            </div>
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
                      onChange={e => { m.isExisting ? null : updateMemberState(idx, "id", e.target.value); }}>
                      {m.isExisting? null : <option value="" disabled selected>Select team Member</option>}
                      {allMemberList.map((am, i) => (
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
                      name={m.hourly_rate}
                      id={m.hourly_rate}
                      value={m.hourly_rate}
                      disabled={m.isExisting}
                      onChange={e => { m.isExisting ? null : updateMemberState(idx, "hourly_rate", e.target.value); }}
                    />
                  </div>

                  {/* Delete button for each member */}
                  <div>
                    <button type="button"
                      onClick={(event) => {
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditMembersList;
