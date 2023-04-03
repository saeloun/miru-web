import React, { useEffect, useState } from "react";

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
  setAllMemberList,
}) => {
  const [focusedRateInputBoxId, setFocusedRateInputBoxId] = useState("");
  const [formattedMemberList, setFormattedMemberList] = useState([]);
  const [errorForInvalidHourlyRate, setErrorForInvalidHourlyRate] = useState(
    {}
  );

  const getFormattedMemberList = () => {
    allMemberList.length > 0 &&
      allMemberList.reduce((memberList, currentMember) => {
        if (!currentMember.isAdded) {
          memberList = [
            ...memberList,
            {
              label: currentMember.name,
              value: currentMember.id,
            },
          ];
        }
        memberList && setFormattedMemberList(memberList);

        return memberList;
      }, []);
  };

  useEffect(() => {
    getFormattedMemberList();
  }, [allMemberList]);

  const removeMemberHandler = (memberIndex, member) => {
    const newArr = allMemberList.map(currentMember => {
      if (member.id == currentMember.id) {
        return { ...currentMember, isAdded: false };
      }

      return currentMember;
    });

    setAllMemberList(newArr);

    setMembers(members => members.filter((_, i) => i != memberIndex));
  };

  const addNewMemberRowHandler = () => {
    setMembers(oldMembers => [
      ...oldMembers,
      { hourlyRate: "00.00", isExisting: false },
    ]);
  };

  const getMember = (member, memberIndex) => {
    if (member.isExisting) {
      return (
        <CustomInputText
          disabled
          id={member?.name}
          label="Team member"
          name={member?.name}
          type="text"
          value={member?.name}
        />
      );
    }

    const currentMemberDetails = allMemberList.find(
      memberFromAllMemberList => memberFromAllMemberList.id == member.id
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
            : updateMemberState(
                memberIndex,
                "id",
                parseInt(selectedMember.value)
              );
          document.getElementById(member.hourlyRate).focus();
        }}
      />
    );
  };

  const handleHourlyRateInput = (e, memberIndex) => {
    const hourlyRate = e.target.value;

    if (hourlyRate < 0 || isNaN(Number(hourlyRate))) {
      const errorMessage = "Please enter a valid rate";
      errorForInvalidHourlyRate[memberIndex] = errorMessage;
      setErrorForInvalidHourlyRate({ ...errorForInvalidHourlyRate });
    } else {
      delete errorForInvalidHourlyRate[memberIndex];
    }
    updateMemberState(memberIndex, "hourlyRate", hourlyRate);
    setErrorForInvalidHourlyRate({ ...errorForInvalidHourlyRate });
  };

  const isInvalidRateInputBox = memberIndex =>
    (memberIndex || memberIndex == 0) && errorForInvalidHourlyRate[memberIndex];

  const isSubmitBtnActive = members =>
    members?.every(
      member => member.id && member.hourlyRate >= 0 && member.hourlyRate != ""
    );

  return (
    <form className="mt-7 mr-6" onSubmit={handleSubmit}>
      {members.map((member, memberIndex) => (
        <div className="mb-4" key={memberIndex}>
          <div className="mb-1 flex">
            <div className="mr-4 w-56">{getMember(member, memberIndex)}</div>
            <div className="relative mr-2 w-24 rounded-md shadow-sm">
              {member.hourlyRate == "" &&
              focusedRateInputBoxId != memberIndex ? null : (
                <div className="pointer-events-none absolute inset-y-0 right-1 z-20 flex items-center px-1">
                  <span className="top-0 text-miru-dark-purple-1000 sm:text-sm md:text-base">
                    {currencySymbol}
                  </span>
                </div>
              )}
              <CustomInputText
                id={member.hourlyRate}
                label="Rate"
                moveLabelToRightClassName="right-1"
                name={member.hourlyRate}
                value={member.hourlyRate}
                inputBoxClassName={` text-right ${
                  isInvalidRateInputBox(memberIndex)
                    ? "border-miru-red-400 error-input"
                    : "border-miru-gray-1000 focus:border-miru-han-purple-1000"
                }`}
                onChange={e => handleHourlyRateInput(e, memberIndex)}
                onFocus={() => setFocusedRateInputBoxId(memberIndex)}
                onBlur={() => {
                  if (focusedRateInputBoxId == memberIndex) {
                    setFocusedRateInputBoxId("");
                  }
                }}
              />
            </div>
            <div className="my-auto text-right ">
              <button
                className="menuButton__button"
                id="removeMember"
                type="button"
                onClick={() => removeMemberHandler(memberIndex, member)}
              >
                <DeleteIcon color="#5B34EA" fill="#5B34EA" size={12} />
              </button>
            </div>
          </div>
          {isInvalidRateInputBox(memberIndex) ? (
            <div className="flex flex-row-reverse">
              <ErrorSpan
                className="relative right-2 block w-1/3 text-xs text-miru-red-400"
                message={errorForInvalidHourlyRate[memberIndex]}
              />
            </div>
          ) : null}
        </div>
      ))}
      <div className="actions mt-4 text-center">
        <button
          disabled={!(formattedMemberList.length > 0)}
          name="add"
          type="button"
          className={`menuButton__button text-xs ${
            formattedMemberList.length > 0
              ? "text-miru-han-purple-1000"
              : "text-miru-dark-purple-400"
          }`}
          onClick={addNewMemberRowHandler}
        >
          <span>+</span>
          <span className="ml-1 font-bold">Add another team member</span>
        </button>
      </div>
      <div className="actions mt-4">
        <input
          disabled={!isSubmitBtnActive(members)}
          name="commit"
          type="submit"
          value="Add team members to project"
          className={`form__button whitespace-nowrap text-tiny md:text-base ${
            isSubmitBtnActive(members)
              ? "cursor-pointer"
              : "cursor-not-allowed border-transparent bg-miru-gray-1000 hover:border-transparent"
          }`}
        />
      </div>
    </form>
  );
};

export default EditMembersListForm;
