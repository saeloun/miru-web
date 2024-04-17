import React from "react";

import { DeleteIcon } from "miruIcons";
import { Button } from "StyledComponents";

import { CustomInputText } from "common/CustomInputText";
import CustomReactSelect from "common/CustomReactSelect";
import { Divider } from "common/Divider";
import { allocationFrequency, getAllocationPeriod } from "constants/leaveType";

import Header from "./Header";
import {
  ColorOption,
  iconColorStyles,
  customStyles,
  IconOption,
} from "./utils";

const EditLeaves = ({
  leaveBalanceList,
  updateCondition,
  handleDeleteLeaveBalance,
  handleAddLeaveType,
  handleLeaveTypeChange,
  iconOptions,
  colorOptions,
  isDesktop,
  updateLeaveDetails,
  handleCancelAction,
  showYearPicker,
  currentYear,
  setCurrentYear,
  isDisableUpdateBtn,
}) => {
  const getAllocationPeriodValue = (allocationFrequency, allocationPeriod) => {
    const availableOptions = getAllocationPeriod(allocationFrequency);
    const selectedOption = availableOptions.find(
      option => option.value === allocationPeriod
    );

    return selectedOption || availableOptions[0];
  };

  return (
    <>
      <Header
        cancelAction={handleCancelAction}
        currentYear={currentYear}
        isDisableUpdateBtn={isDisableUpdateBtn}
        saveAction={updateLeaveDetails}
        setCurrentYear={setCurrentYear}
        showYearPicker={showYearPicker}
      />
      <div className="mt-4 min-h-full p-4 lg:min-h-80v lg:bg-miru-gray-100 lg:p-10">
        <div className="flex flex-col lg:flex-row lg:py-6">
          <div className="p-2 lg:w-2/12">Leave Balance</div>
          <div className="p-2 lg:w-10/12">
            <div className="flex flex-col bg-miru-gray-100 py-6 px-4 lg:bg-transparent lg:p-0">
              {leaveBalanceList.map((leaveBalance, index) => (
                <div className="flex flex-col" key={index}>
                  <div className="flex w-full flex-col items-center justify-between lg:mb-4 lg:flex-row">
                    <CustomInputText
                      id={`leaveType_${index}`}
                      inputBoxClassName="border focus:border-miru-han-purple-1000 cursor-pointer"
                      label="Leave Type"
                      labelClassName="cursor-pointer"
                      name={`leaveType_${index}`}
                      type="text"
                      value={leaveBalance.leaveType || ""}
                      wrapperClassName="w-full lg:w-5/12 mb-6 lg:mb-0"
                      onChange={e => handleLeaveTypeChange(e, index)}
                    />
                    <CustomReactSelect
                      id={`leaveIcon_${index}`}
                      label="Icon"
                      name={`leaveIcon_${index}`}
                      options={iconOptions}
                      styles={iconColorStyles}
                      value={leaveBalance.leaveIcon || null}
                      wrapperClassName="w-full h-12 lg:mx-4 lg:w-3/12 mb-6 lg:mb-0"
                      components={{
                        Option: IconOption,
                        IndicatorSeparator: () => null,
                      }}
                      getOptionLabel={e => (
                        <img alt={e.label} className="h-5 w-5" src={e.icon} />
                      )}
                      handleOnChange={e =>
                        updateCondition("leaveIcon", e, index)
                      }
                    />
                    <CustomReactSelect
                      id={`leaveColor_${index}`}
                      label="Color"
                      name={`leaveColor_${index}`}
                      options={colorOptions}
                      styles={iconColorStyles}
                      value={leaveBalance.leaveColor || null}
                      wrapperClassName="h-12 w-full lg:w-4/12 mb-6 lg:mb-0"
                      components={{
                        Option: ColorOption,
                        IndicatorSeparator: () => null,
                      }}
                      getOptionLabel={e => (
                        <div
                          className="h-5 w-5"
                          style={{ background: e.value }}
                        />
                      )}
                      handleOnChange={e =>
                        updateCondition("leaveColor", e, index)
                      }
                    />
                    <div className="w-1/12" />
                  </div>
                  <div className="mb-6 flex w-full flex-col items-center justify-between lg:flex-row">
                    <CustomInputText
                      id={`total_${index}`}
                      inputBoxClassName="border focus:border-miru-han-purple-1000 cursor-pointer"
                      label="Total"
                      labelClassName="cursor-pointer"
                      min={0}
                      name={`total_${index}`}
                      type="number"
                      value={leaveBalance.total || ""}
                      wrapperClassName="w-full lg:w-2/12 lg:mr-2 mb-6 lg:mb-0"
                      onChange={e =>
                        updateCondition("total", e.target.value, index)
                      }
                    />
                    <CustomReactSelect
                      id={`allocationPeriod_${index}`}
                      label=""
                      name={`allocationPeriod_${index}`}
                      styles={customStyles}
                      wrapperClassName="w-full lg:w-1/5 h-12 lg:mx-4 mb-6 lg:mb-0"
                      components={{
                        IndicatorSeparator: () => null,
                      }}
                      handleOnChange={e =>
                        updateCondition("allocationPeriod", e.value, index)
                      }
                      options={getAllocationPeriod(
                        leaveBalance.allocationFrequency
                      )}
                      value={getAllocationPeriodValue(
                        leaveBalance.allocationFrequency,
                        leaveBalance.allocationPeriod
                      )}
                    />
                    <CustomReactSelect
                      id={`allocationFrequency_${index}`}
                      label=""
                      name={`allocationFrequency_${index}`}
                      options={allocationFrequency}
                      styles={customStyles}
                      wrapperClassName="w-full lg:w-3/12 h-12 lg:mr-4 mb-6 lg:mb-0"
                      components={{
                        IndicatorSeparator: () => null,
                      }}
                      handleOnChange={e => {
                        updateCondition("allocationFrequency", e.value, index);
                        updateCondition(
                          "allocationPeriod",
                          getAllocationPeriodValue(
                            leaveBalance.allocationFrequency,
                            leaveBalance.allocationPeriod
                          ).value,
                          index
                        );
                      }}
                      value={
                        leaveBalance.allocationFrequency
                          ? allocationFrequency.filter(
                              option =>
                                option.value ===
                                leaveBalance.allocationFrequency
                            )
                          : allocationFrequency[0]
                      }
                    />
                    <CustomInputText
                      id={`carryForward_${index}`}
                      inputBoxClassName="border focus:border-miru-han-purple-1000 cursor-pointer"
                      label="Carry forward (days)"
                      labelClassName="cursor-pointer"
                      min={0}
                      name={`carryForward_${index}`}
                      type="number"
                      value={leaveBalance.carryForwardDays || ""}
                      wrapperClassName="w-full lg:w-4/12 mb-6 lg:mb-0"
                      onChange={e =>
                        updateCondition(
                          "carryForwardDays",
                          e.target.value,
                          index
                        )
                      }
                    />
                    <div className="flex h-12 w-1/12 items-center">
                      <button
                        onClick={() => handleDeleteLeaveBalance(leaveBalance)}
                      >
                        <DeleteIcon
                          className="cursor-pointer rounded-full"
                          color="#5b34ea"
                          style={{ minWidth: "40px" }}
                        />
                      </button>
                    </div>
                  </div>
                  {leaveBalanceList.length - 1 != index && (
                    <div className="mb-6 w-full lg:w-11/12">
                      <Divider />
                    </div>
                  )}
                </div>
              ))}
              <div
                className="dotted-btn w-11/12 px-4 py-2 text-center text-miru-dark-purple-200"
                onClick={handleAddLeaveType}
              >
                {leaveBalanceList.length > 0
                  ? "+ Add Another Leave Type"
                  : "+ Add Leave Type"}
              </div>
            </div>
          </div>
          {!isDesktop && leaveBalanceList.length > 0 && (
            <div className="mt-5 flex w-full justify-between px-2">
              <Button
                className="mr-2 flex w-1/2 items-center justify-center rounded border border-miru-red-400 px-4 py-2"
                onClick={handleCancelAction}
              >
                <span className="ml-2 text-center text-base font-bold leading-5 text-miru-red-400">
                  Cancel
                </span>
              </Button>
              <Button
                className="ml-2 flex w-1/2 items-center justify-center px-4 py-2"
                style="primary"
                onClick={updateLeaveDetails}
              >
                <span className="ml-2 text-center text-base font-bold leading-5 text-white">
                  Save
                </span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default EditLeaves;
