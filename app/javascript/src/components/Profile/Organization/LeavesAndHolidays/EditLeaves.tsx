import React from "react";

import { DeleteIcon } from "miruIcons";
import { components } from "react-select";

import { CustomInputText } from "common/CustomInputText";
import CustomReactSelect from "common/CustomReactSelect";
import { Divider } from "common/Divider";
import {
  leaveColors,
  leaveIcons,
  repetitionType,
  countTypeOptions,
} from "constants/leaveType";

const { Option } = components;

const iconColorStyles = {
  control: (provided, state) => ({
    ...provided,
    backgroundColor: "#FFFFFF",
    minHeight: 48,
    padding: "0",
    borderColor: state.isFocused ? "#5B34EA" : "#D7DEE5",
    borderWidth: state.isFocused ? "1px" : "1px",
    boxShadow: state.isFocused && "0 0 0 1px #5B34EA",
    "&:hover": {
      borderColor: "#5B34EA",
    },
  }),
  menu: provided => ({
    ...provided,
    fontSize: "12px",
    letterSpacing: "2px",
    width: "auto",
    zIndex: 5,
  }),
  valueContainer: provided => ({
    ...provided,
    overflow: "visible",
  }),
  placeholder: base => ({
    ...base,
    position: "absolute",
    top: "-30%",
    transition: "top 0.2s, font-size 0.2s",
    fontSize: 10,
    backgroundColor: "#FFFFFF",
  }),
  menuList: provided => ({
    ...provided,
    display: "grid",
    gridTemplateColumns: "auto auto auto auto",
    padding: 0,
  }),
  option: (provided, state) => ({
    ...provided,
    display: "grid",
    justifyItems: "center",
    padding: 0,
    cursor: "pointer",
    background: state.isFocused || state.isSelected ? "#D7DEE5" : "#fff",
  }),
  "&:hover": {
    background: "#D7DEE5",
  },
};

const customStyles = {
  control: (provided, state) => ({
    ...provided,
    backgroundColor: "#FFFFFF",
    minHeight: 48,
    padding: "0",
    borderColor: state.isFocused ? "#5B34EA" : "#D7DEE5",
    borderWidth: state.isFocused ? "1px" : "1px",
    boxShadow: state.isFocused && "0 0 0 1px #5B34EA",
    "&:hover": {
      borderColor: "#5B34EA",
    },
  }),
  menu: provided => ({
    ...provided,
    fontSize: "12px",
    letterSpacing: "2px",
    zIndex: 5,
  }),
  placeholder: base => ({
    ...base,
    position: "absolute",
    top: "-30%",
    transition: "top 0.2s, font-size 0.2s",
    fontSize: 10,
    backgroundColor: "#FFFFFF",
  }),
  option: provided => ({
    ...provided,
    cursor: "pointer",
    "&:hover": {
      background: "#D7DEE5",
    },
  }),
};

const IconOption = props => (
  <Option {...props} className="h-10 w-10 items-center">
    <img alt={props.data.label} className="m-3 h-5 w-5" src={props.data.icon} />
  </Option>
);

const ColorOption = props => (
  <Option {...props} className="h-10 w-10 items-center">
    <div className="m-3 h-4 w-4" style={{ background: props.data.value }} />
  </Option>
);

const EditLeaves = ({
  leaveBalanceList,
  updateCondition,
  handleDeleteLeaveBalance,
  handleAddLeaveType,
  handleLeaveTypeChange,
}) => (
  <div className="mt-4 min-h-80v bg-miru-gray-100 p-10">
    <div className="flex flex-row py-6">
      <div className="w-2/12 p-2">Leave Balance</div>
      <div className="w-10/12 p-2">
        <div className="flex flex-col">
          {leaveBalanceList.map((leaveBalance, index) => (
            <div key={index}>
              <div className="mb-4 flex w-full items-center justify-between">
                <CustomInputText
                  id="leaveType"
                  inputBoxClassName="border focus:border-miru-han-purple-1000 cursor-pointer"
                  label="Leave Type"
                  labelClassName="cursor-pointer"
                  name="leaveType"
                  type="text"
                  value={leaveBalance.leaveType || ""}
                  wrapperClassName="w-5/12"
                  onChange={e => handleLeaveTypeChange(e, index)}
                />
                <CustomReactSelect
                  handleOnChange={e => updateCondition("leaveIcon", e, index)}
                  id="leaveIcon"
                  label="Icon"
                  name="leaveIcon"
                  options={leaveIcons}
                  styles={iconColorStyles}
                  value={leaveBalance.leaveIcon || null}
                  wrapperClassName="w-3/12 h-12 mx-4"
                  components={{
                    Option: IconOption,
                    IndicatorSeparator: () => null,
                  }}
                  getOptionLabel={e => (
                    <img alt={e.label} className="h-5 w-5" src={e.icon} />
                  )}
                />
                <CustomReactSelect
                  handleOnChange={e => updateCondition("leaveColor", e, index)}
                  id="leaveColor"
                  label="Color"
                  name="leaveColor"
                  options={leaveColors}
                  styles={iconColorStyles}
                  value={leaveBalance.leaveColor || null}
                  wrapperClassName="w-4/12 h-12"
                  components={{
                    Option: ColorOption,
                    IndicatorSeparator: () => null,
                  }}
                  getOptionLabel={e => (
                    <div className="h-5 w-5" style={{ background: e.value }} />
                  )}
                />
                <div className="w-1/12" />
              </div>
              <div className="mb-6 flex w-full items-center justify-between">
                <CustomInputText
                  id="total"
                  inputBoxClassName="border focus:border-miru-han-purple-1000 cursor-pointer"
                  label="Total"
                  labelClassName="cursor-pointer"
                  min={0}
                  name="total"
                  type="number"
                  value={leaveBalance.total || ""}
                  wrapperClassName="w-2/12 mr-2"
                  onChange={e =>
                    updateCondition("total", e.target.value, index)
                  }
                />
                <CustomReactSelect
                  id="countType"
                  label=""
                  name="countType"
                  options={countTypeOptions}
                  styles={customStyles}
                  wrapperClassName="w-1/5 h-12 mx-4"
                  components={{
                    IndicatorSeparator: () => null,
                  }}
                  handleOnChange={e =>
                    updateCondition("countType", e.value, index)
                  }
                  value={
                    leaveBalance.countType
                      ? countTypeOptions.filter(
                          option => option.value === leaveBalance.countType
                        )
                      : countTypeOptions[0]
                  }
                />
                <CustomReactSelect
                  id="repetitionType"
                  label=""
                  name="repetitionType"
                  options={repetitionType}
                  styles={customStyles}
                  wrapperClassName="w-3/12 h-12 mr-4"
                  components={{
                    IndicatorSeparator: () => null,
                  }}
                  handleOnChange={e =>
                    updateCondition("repetitionType", e.value, index)
                  }
                  value={
                    leaveBalance.repetitionType
                      ? repetitionType.filter(
                          option => option.value === leaveBalance.repetitionType
                        )
                      : repetitionType[0]
                  }
                />
                <CustomInputText
                  id="carryForward"
                  inputBoxClassName="border focus:border-miru-han-purple-1000 cursor-pointer"
                  label="Carry forward (days)"
                  labelClassName="cursor-pointer"
                  min={0}
                  name="carryForward"
                  type="number"
                  value={leaveBalance.carryforwardedCount || ""}
                  wrapperClassName="w-4/12"
                  onChange={e =>
                    updateCondition(
                      "carryforwardedCount",
                      e.target.value,
                      index
                    )
                  }
                />
                <div className="flex h-12 w-1/12 items-center">
                  <button onClick={() => handleDeleteLeaveBalance(index)}>
                    <DeleteIcon
                      className="cursor-pointer rounded-full"
                      color="#5b34ea"
                      style={{ minWidth: "40px" }}
                    />
                  </button>
                </div>
              </div>
              {leaveBalanceList.length - 1 != index && (
                <div className="mb-6 w-11/12">
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
    </div>
  </div>
);

export default EditLeaves;
