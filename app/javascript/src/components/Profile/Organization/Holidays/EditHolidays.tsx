import React from "react";

import dayjs from "dayjs";
import { DeleteIcon, CalendarIcon } from "miruIcons";
import Select from "react-select";

import CustomDatePicker from "common/CustomDatePicker";
import { Divider } from "common/Divider";
import { repetitionType } from "constants/leaveType";

const customStyles = {
  control: (provided, state) => ({
    ...provided,
    backgroundColor: "#FFFFFF",
    color: "red",
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
  option: provided => ({
    ...provided,
    display: "grid",
    justifyItems: "center",
    padding: 0,
    cursor: "pointer",
  }),
};

const EditHolidays = ({
  setShowDatePicker,
  holidayList,
  showDatePicker,
  handleDatePicker,
  handleHolidateNameChange,
  handleDeleteHoliday,
  handleCheckboxClick,
  enableOptionalHolidays,
  totalOptionalHolidays,
  handleChangeTotalOpHoliday,
  handleAddHoliday,
  optionalRepetitionType,
  optionalHolidaysList,
  optionalWrapperRef,
  handleChangeRepetitionOpHoliday,
  setShowOptionalDatePicker,
  showOptionalDatePicker,
  wrapperRef,
}) => (
  <div className="mt-4 min-h-80v bg-miru-gray-100 p-10">
    <div className="flex flex-row py-6">
      <div className="w-2/12 p-2">Holidays</div>
      <div className="w-10/12 p-2">
        <div className="flex flex-col">
          {holidayList.map((holiday, index) => (
            <div className="mb-4 flex flex-row" key={index}>
              <div className="flex w-11/12 flex-row py-2">
                <div
                  className="field w-1/2 border bg-white pr-1"
                  ref={wrapperRef}
                >
                  <div
                    className="relative"
                    onClick={() =>
                      setShowDatePicker({
                        visibility: !showDatePicker.visibility,
                        index,
                      })
                    }
                  >
                    <div className="field relative">
                      <div className="outline relative">
                        <input
                          disabled
                          className="focus:outline-none form__input block w-full appearance-none rounded border-0 bg-white p-4 px-3 py-2 text-sm font-medium text-miru-dark-purple-1000 sm:text-base"
                          name="holiday_date"
                          placeholder=""
                          type="text"
                          value={
                            holiday.date &&
                            dayjs(holiday.date).format("DD.MM.YYYY")
                          }
                        />
                        <CalendarIcon
                          className="absolute top-0 right-0 m-2"
                          color="#5B34EA"
                          size={20}
                        />
                        <label
                          className="absolute -top-10 z-10 ml-3 h-3 origin-0 bg-white p-0 px-1 text-xs text-miru-dark-purple-400 duration-300"
                          htmlFor="holiday_date"
                        >
                          Date
                        </label>
                      </div>
                    </div>
                  </div>
                  {index == showDatePicker.index &&
                    showDatePicker.visibility && (
                      <CustomDatePicker
                        date={holiday.date}
                        handleChange={e => handleDatePicker(e, index, false)}
                      />
                    )}
                </div>
                <div className="w-1/2 pl-1">
                  <div className="field relative">
                    <div className="outline relative">
                      <input
                        className="form__input block w-full appearance-none bg-white p-4 text-base"
                        id="holiday_name"
                        name="holiday_name"
                        placeholder=""
                        type="text"
                        value={holiday.name}
                        onChange={e =>
                          handleHolidateNameChange(e, index, false)
                        }
                      />
                      <label
                        className="absolute top-0 z-1 origin-0 bg-white p-3 text-base font-medium text-miru-dark-purple-200 duration-300"
                        htmlFor="holiday_name"
                      >
                        Name
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex w-1/12 items-end justify-center pb-4">
                <button onClick={() => handleDeleteHoliday(false, index)}>
                  <DeleteIcon
                    className="ml-2 cursor-pointer rounded-full"
                    color="#5b34ea"
                    style={{ minWidth: "40px" }}
                  />
                </button>
              </div>
            </div>
          ))}
          <div
            className="dotted-btn w-11/12 px-4 py-2 text-center text-miru-dark-purple-200"
            onClick={() => handleAddHoliday(false)}
          >
            + Add Holiday
          </div>
        </div>
      </div>
    </div>
    <Divider />
    <div className="flex flex-row py-6">
      <div className="w-2/12 p-2">
        <div>Optional</div>
        <div>Holidays</div>
      </div>
      <div className="w-10/12 p-2">
        <div className="flex w-11/12 flex-row justify-between">
          <span>Enable optional holidays</span>
          <div>
            <label className="switch">
              <input type="checkbox" onChange={handleCheckboxClick} />
              <span className="slider round" />
            </label>
          </div>
        </div>
        {enableOptionalHolidays && (
          <div className="mt-4 flex flex-col">
            <div className="flex w-11/12 flex-row py-2">
              <div className="w-1/2">
                <div className="field relative">
                  <div className="outline relative">
                    <input
                      id="total_op_holidays"
                      min={0}
                      name="total_op_holidays"
                      type="number"
                      value={totalOptionalHolidays}
                      className={`
                          form__input block w-full appearance-none bg-white p-4 text-base`}
                      onChange={handleChangeTotalOpHoliday}
                    />
                    <label
                      className="absolute top-0 z-1 origin-0 bg-white p-3 text-base font-medium text-miru-dark-purple-200 duration-300"
                      htmlFor="total_op_holidays"
                    >
                      Total optional holidays
                    </label>
                  </div>
                </div>
              </div>
              <div className="w-1/2 px-2">
                <Select
                  className=""
                  classNamePrefix="react-select-filter"
                  options={repetitionType}
                  styles={customStyles}
                  value={
                    optionalRepetitionType
                      ? repetitionType.filter(
                          option => option.value === optionalRepetitionType
                        )
                      : repetitionType[0]
                  }
                  onChange={handleChangeRepetitionOpHoliday}
                />
              </div>
            </div>
            <div className="mt-3">
              <label> List of optional holidays </label>
              {optionalHolidaysList.map((optionalHoliday, index) => (
                <div className="flex flex-row" key={index}>
                  <div className="flex w-11/12 flex-row py-3">
                    <div
                      className="field w-1/2 border bg-white pr-1"
                      ref={optionalWrapperRef}
                    >
                      <div
                        className="relative"
                        onClick={() =>
                          setShowOptionalDatePicker({
                            visibility: !showOptionalDatePicker.visibility,
                            index,
                          })
                        }
                      >
                        <div className="field relative">
                          <div className="outline relative">
                            <input
                              disabled
                              name="op_holiday_date_picker"
                              placeholder=""
                              type="text"
                              className={`
                                  focus:outline-none form__input block w-full appearance-none rounded border-0 bg-white p-4 px-3 py-2 text-sm font-medium text-miru-dark-purple-1000 sm:text-base`}
                              value={
                                optionalHoliday.date &&
                                dayjs(optionalHoliday.date).format("DD.MM.YYYY")
                              }
                            />
                            <label
                              className="absolute -top-10 z-10 ml-3 h-3 origin-0 bg-white p-0 px-1 text-xs text-miru-dark-purple-400 duration-300"
                              htmlFor="total_op_holidays"
                            >
                              Date
                            </label>
                            <CalendarIcon
                              className="absolute top-0 right-0 m-2"
                              color="#5B34EA"
                              size={20}
                            />
                          </div>
                        </div>
                      </div>
                      {showOptionalDatePicker.index == index &&
                        showOptionalDatePicker.visibility && (
                          <CustomDatePicker
                            date={optionalHoliday.date}
                            handleChange={e => handleDatePicker(e, index, true)}
                          />
                        )}
                    </div>
                    <div className="w-1/2 pl-1">
                      <div className="field relative">
                        <div className="outline relative">
                          <input
                            id="holiday_name_op"
                            name="holiday_name_op"
                            placeholder=""
                            type="text"
                            value={optionalHoliday.name}
                            className={`form__input
                                block w-full appearance-none bg-white p-4 text-base`}
                            onChange={e =>
                              handleHolidateNameChange(e, index, true)
                            }
                          />
                          <label
                            className="absolute top-0 z-1 origin-0 bg-white p-3 text-base font-medium text-miru-dark-purple-200 duration-300"
                            htmlFor="holiday_name_op"
                          >
                            Name
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex w-1/12 items-end justify-center pb-4">
                    <button onClick={() => handleDeleteHoliday(true, index)}>
                      <DeleteIcon
                        className="ml-2 cursor-pointer rounded-full"
                        color="#5b34ea"
                        style={{ minWidth: "40px" }}
                      />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div
              className="dotted-btn mt-4 w-11/12 px-4 py-2 text-center text-miru-dark-purple-200"
              onClick={() => handleAddHoliday(true)}
            >
              + Add Optional Holiday
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
);

export default EditHolidays;
