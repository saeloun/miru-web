import React, { useState } from "react";

import { DeleteIcon } from "miruIcons";

import { CustomInputText } from "common/CustomInputText";
import CustomReactSelect from "common/CustomReactSelect";
import { ErrorSpan } from "common/ErrorSpan";

const EditMembersListForm = ({
  members,
  allMemberList,
  updateMemberState,
  setMembers,
  handleSubmit,
  currencySymbol,
}) => {
  const [focusedRateInputBoxId, setFocusedRateInputBoxId] = useState("");
  const [errorForInvalidHourlyRate, setErrorForInvalidHourlyRate] = useState(
    {}
  );

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
        <CustomInputText
          disabled
          id={member?.name || ""}
          label="Team member"
          name={member?.name || ""}
          type="text"
          value={member?.name || ""}
        />
      );
    }

    const currentMemberDetails = allMemberList.find(
      memberFromAllMemberList => memberFromAllMemberList.id == member.id
    );

    const formattedMemberList = allMemberList.reduce(
      (memberList, currentMember) => {
        if (!currentMember.isAdded) {
          memberList = [
            ...memberList,
            {
              label: currentMember.name,
              value: currentMember.id,
            },
          ];
        }

        return memberList;
      },
      []
    );

    const valueObj = {
      label: currentMemberDetails?.name || "",
      value: currentMemberDetails?.id || "",
    };

    return (
      <CustomReactSelect
        hideDropdownIndicator
        isDisabled={member.isExisting}
        label="Team member"
        name={member.id}
        options={formattedMemberList}
        value={valueObj}
        handleOnChange={selectedMember => {
          member.isExisting
            ? null
            : updateMemberState(idx, "id", parseInt(selectedMember.value));
        }}
      />
    );
  };

  const handleHourlyRateInput = (e, idx) => {
    const hourlyRate = e.target.value;

    if (hourlyRate < 0 || isNaN(Number(hourlyRate))) {
      const errorMessage = "Please enter a valid rate";
      errorForInvalidHourlyRate[idx] = errorMessage;
      setErrorForInvalidHourlyRate({ ...errorForInvalidHourlyRate });
    } else {
      delete errorForInvalidHourlyRate[idx];
    }
    updateMemberState(idx, "hourlyRate", hourlyRate);
    setErrorForInvalidHourlyRate({ ...errorForInvalidHourlyRate });
  };

  const isInvalidRateInputBox = idx =>
    (idx || idx == 0) && errorForInvalidHourlyRate[idx];

  return (
    <form className="mt-7" onSubmit={handleSubmit}>
      {members.map((member, idx) => (
        <div className="mb-4" key={idx}>
          <div className="mb-1 flex">
            <div className="mr-4 w-56">{getMember(member, idx)}</div>
            <div className="relative mr-2 w-24 rounded-md shadow-sm">
              {focusedRateInputBoxId == idx || member.hourlyRate ? (
                <div
                  className="pointer-events-none absolute inset-y-0 right-1 z-20 flex items-center px-1"
                  key={idx}
                >
                  <span className="top-0 text-miru-dark-purple-1000 sm:text-sm md:text-base">
                    {currencySymbol}
                  </span>
                </div>
              ) : null}
              <CustomInputText
                id={member.hourlyRate}
                key={idx}
                label="Rate"
                name={member.hourlyRate}
                inputBoxClassName={`form__input block w-full appearance-none bg-white p-4 text-base h-12 focus-within:border-miru-han-purple-1000 text-right ${
                  isInvalidRateInputBox(idx)
                    ? "border-red-600"
                    : "border-miru-gray-1000"
                }`}
                labelClassName={`absolute top-0.5 right-1 h-6 z-1 origin-0 bg-white p-2 text-base font-medium duration-300 ${
                  isInvalidRateInputBox(idx)
                    ? "text-red-600"
                    : "text-miru-dark-purple-200"
                }`}
                value={
                  member.hourlyRate || focusedRateInputBoxId == idx
                    ? member.hourlyRate
                    : ""
                }
                onChange={e => handleHourlyRateInput(e, idx)}
                onFocus={() => setFocusedRateInputBoxId(idx)}
                onBlur={() => {
                  if (focusedRateInputBoxId == idx) {
                    setFocusedRateInputBoxId("");
                  }
                }}
              />
            </div>
            <div className="w-3 text-right ">
              <button
                className="menuButton__button"
                type="button"
                onClick={() => removeMemberHandler(idx)}
              >
                <DeleteIcon color="#5B34EA" fill="#5B34EA" size={12} />
              </button>
            </div>
          </div>
          {isInvalidRateInputBox(idx) ? (
            <div className="flex flex-row-reverse">
              <ErrorSpan
                className="block w-1/3 text-xs text-red-600"
                message={errorForInvalidHourlyRate[idx]}
              />
            </div>
          ) : null}
        </div>
      ))}
      <div className="actions mt-4 text-center">
        <button
          className="menuButton__button text-xs text-miru-han-purple-1000"
          name="add"
          type="button"
          onClick={addNewMemberRowHandler}
        >
          <span>+</span>
          <span className="ml-1 font-bold">Add another team member</span>
        </button>
      </div>
      <div className="actions mt-4">
        <input
          name="commit"
          type="submit"
          value="Add team members to project"
          className={`form__button whitespace-nowrap text-tiny md:text-base ${
            members?.every(member => member.id && member.hourlyRate >= 0)
              ? "cursor-pointer"
              : "cursor-not-allowed border-transparent bg-miru-gray-1000 hover:border-transparent"
          }`}
        />
      </div>
    </form>
  );
};

export default EditMembersListForm;
