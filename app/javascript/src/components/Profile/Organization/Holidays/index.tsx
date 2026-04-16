import React, { useCallback, useEffect, useRef, useState } from "react";

import { holidaysApi } from "apis/api";
import Loader from "common/Loader/index";
import { useUserContext } from "context/UserContext";
import { getYear } from "date-fns";
import { useOutsideClick } from "helpers";
import { useNavigate } from "react-router-dom";
import { Toastr } from "StyledComponents";
import { sendGAPageView } from "utils/googleAnalytics";

import OrganizationHolidaysEditor from "./Editor";
import { companyDateFormat, makePayload } from "./utils";

const Holidays = () => {
  const [holidayList, setHolidayList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentYear, setCurrentYear] = useState<number>(getYear(new Date()));
  const [showDatePicker, setShowDatePicker] = useState<any>({
    visibility: false,
    index: 0,
  });
  const wrapperRef = useRef(null);
  const optionalWrapperRef = useRef(null);

  const [enableOptionalHolidays, setEnableOptionalHolidays] =
    useState<any>(false);

  const [showOptionalDatePicker, setShowOptionalDatePicker] = useState<any>({
    visibility: false,
    index: 0,
  });
  const [optionalHolidaysList, setOptionalHolidaysList] = useState([]);
  const [totalOptionalHolidays, setTotalOptionalHolidays] = useState(0);
  const [optionalRepetitionType, setOptionalRepetitionType] =
    useState("per_year");
  const [isEditable, setIsEditable] = useState(false);
  const [holidays, setHolidays] = useState([]);
  const [currentYearHolidaysList, setCurrentYearHolidaysList] = useState([]);
  const [currentYearPublicHolidays, setCurrentYearPublicHolidays] = useState(
    []
  );

  const [currentYearOptionalHolidays, setCurrentYearOptionalHolidays] =
    useState([]);

  const [holidayErrors, setHolidayErrors] = useState<
    Record<number, Record<string, string[]>>
  >({});

  const [optionalHolidayErrors, setOptionalHolidayErrors] = useState<
    Record<number, Record<string, string[]>>
  >({});

  const { isDesktop, company, companyRole } = useUserContext();
  const dateFormat = companyDateFormat(company?.date_format);
  const canManageHolidays = companyRole === "admin" || companyRole === "owner";

  const navigate = useNavigate();

  useOutsideClick(wrapperRef, () => {
    setShowDatePicker({
      visibility: false,
      index: 0,
    });
  });

  useOutsideClick(optionalWrapperRef, () => {
    setShowOptionalDatePicker({
      visibility: false,
      index: 0,
    });
  });

  const updateHolidaysList = useCallback(
    holidays => {
      const currentHoliday = holidays.find(
        holiday => holiday.year == currentYear
      );

      if (currentHoliday) {
        const {
          enable_optional_holidays,
          national_holidays = [],
          optional_holidays = [],
          no_of_allowed_optional_holidays,
          time_period_optional_holidays,
        } = currentHoliday;

        enable_optional_holidays &&
          setEnableOptionalHolidays(enable_optional_holidays);

        no_of_allowed_optional_holidays &&
          setTotalOptionalHolidays(no_of_allowed_optional_holidays);

        time_period_optional_holidays &&
          setOptionalRepetitionType(time_period_optional_holidays);

        const newNationalHolidays = national_holidays.map(holiday => ({
          ...holiday,
        }));

        const newOptionalHolidays = optional_holidays.map(holiday => ({
          ...holiday,
        }));
        setHolidayList(newNationalHolidays);
        setOptionalHolidaysList(newOptionalHolidays);
        setCurrentYearHolidaysList([
          ...national_holidays,
          ...optional_holidays,
        ]);
        setCurrentYearPublicHolidays(national_holidays);
        setCurrentYearOptionalHolidays(optional_holidays);
      } else {
        setEnableOptionalHolidays(false);
        setTotalOptionalHolidays(0);
        setOptionalRepetitionType("per_year");
        setHolidayList([]);
        setCurrentYearHolidaysList([]);
        setOptionalHolidaysList([]);
        setCurrentYearPublicHolidays([]);
        setCurrentYearOptionalHolidays([]);
      }
    },
    [currentYear]
  );

  const fetchHolidays = useCallback(async () => {
    const res = await holidaysApi.allHolidays();
    setHolidays(res.data.holidays);
    updateHolidaysList(res.data.holidays);
    setIsLoading(false);
  }, [updateHolidaysList]);

  useEffect(() => {
    sendGAPageView();
    fetchHolidays();
  }, [fetchHolidays]);

  useEffect(() => {
    if (holidays.length) {
      updateHolidaysList(holidays);
    }
  }, [currentYear, holidays, updateHolidaysList]);

  const handleDatePicker = (date, index, isoptionalHoliday) => {
    if (!isoptionalHoliday) {
      const holidayListDetail = [...holidayList];
      holidayListDetail[index].date = date;
      setHolidayList([...holidayListDetail]);
      setShowDatePicker({ visibility: false, index: 0 });
      if (holidayErrors[index]?.date) {
        const newErrors = { ...holidayErrors };
        if (newErrors[index]) {
          const { date: _dateError, ...restErrors } = newErrors[index];
          if (Object.keys(restErrors).length === 0) {
            delete newErrors[index];
          } else {
            newErrors[index] = restErrors;
          }
        }
        setHolidayErrors(newErrors);
      }
    } else {
      const holidayListDetail = [...optionalHolidaysList];
      holidayListDetail[index].date = date;
      setOptionalHolidaysList([...holidayListDetail]);
      setShowOptionalDatePicker({ visibility: false, index: 0 });
      if (optionalHolidayErrors[index]?.date) {
        const newErrors = { ...optionalHolidayErrors };
        if (newErrors[index]) {
          const { date: _dateError, ...restErrors } = newErrors[index];
          if (Object.keys(restErrors).length === 0) {
            delete newErrors[index];
          } else {
            newErrors[index] = restErrors;
          }
        }
        setOptionalHolidayErrors(newErrors);
      }
    }
  };

  const handleAddHoliday = isoptionalHoliday => {
    if (!isoptionalHoliday) {
      setHolidayList([
        ...holidayList,
        ...[
          {
            date: "",
            name: "",
            category: "national",
          },
        ],
      ]);
    } else {
      setOptionalHolidaysList([
        ...optionalHolidaysList,
        ...[
          {
            date: "",
            name: "",
            category: "optional",
          },
        ],
      ]);
    }
  };

  const handleDeleteHoliday = (isoptionalHoliday, index) => {
    if (!isoptionalHoliday) {
      const updatedHolidayList = [...holidayList];
      updatedHolidayList.splice(index, 1);
      setHolidayList(updatedHolidayList);

      const newHolidayErrors: Record<number, Record<string, string[]>> = {};
      Object.entries(holidayErrors).forEach(([errorIndex, errorObj]) => {
        const errorIndexNum = parseInt(errorIndex, 10);
        if (errorIndexNum < index) {
          newHolidayErrors[errorIndexNum] = errorObj;
        } else if (errorIndexNum > index) {
          newHolidayErrors[errorIndexNum - 1] = errorObj;
        }
      });
      setHolidayErrors(newHolidayErrors);
    } else {
      const updatedHolidayList = [...optionalHolidaysList];
      updatedHolidayList.splice(index, 1);
      setOptionalHolidaysList(updatedHolidayList);

      const newOptionalHolidayErrors: Record<
        number,
        Record<string, string[]>
      > = {};

      Object.entries(optionalHolidayErrors).forEach(
        ([errorIndex, errorObj]) => {
          const errorIndexNum = parseInt(errorIndex, 10);
          if (errorIndexNum < index) {
            newOptionalHolidayErrors[errorIndexNum] = errorObj;
          } else if (errorIndexNum > index) {
            newOptionalHolidayErrors[errorIndexNum - 1] = errorObj;
          }
        }
      );
      setOptionalHolidayErrors(newOptionalHolidayErrors);
    }
  };

  const handleHolidateNameChange = (e, index, isoptionalHoliday) => {
    if (!isoptionalHoliday) {
      const holidayListDetail = [...holidayList];
      holidayListDetail[index].name = e.target.value;
      setHolidayList([...holidayListDetail]);
      if (holidayErrors[index]?.name) {
        const newErrors = { ...holidayErrors };
        if (newErrors[index]) {
          const { name: _name, ...restErrors } = newErrors[index];
          if (Object.keys(restErrors).length === 0) {
            delete newErrors[index];
          } else {
            newErrors[index] = restErrors;
          }
        }
        setHolidayErrors(newErrors);
      }
    } else {
      const holidayListDetail = [...optionalHolidaysList];
      holidayListDetail[index].name = e.target.value;
      setOptionalHolidaysList([...holidayListDetail]);
      if (optionalHolidayErrors[index]?.name) {
        const newErrors = { ...optionalHolidayErrors };
        if (newErrors[index]) {
          const { name: _name, ...restErrors } = newErrors[index];
          if (Object.keys(restErrors).length === 0) {
            delete newErrors[index];
          } else {
            newErrors[index] = restErrors;
          }
        }
        setOptionalHolidayErrors(newErrors);
      }
    }
  };

  const handleCheckboxClick = () => {
    setEnableOptionalHolidays(!enableOptionalHolidays);
  };

  const handleChangeTotalOpHoliday = e => {
    setTotalOptionalHolidays(e.target.value);
  };

  const handleChangeRepetitionOpHoliday = e => {
    setOptionalRepetitionType(e.value);
  };

  const handleUpdateHolidayDetails = () => {
    if (!canManageHolidays) return;

    const totalHolidayList = makePayload(
      [...holidayList, ...optionalHolidaysList],
      dateFormat
    );

    const payload = {
      holiday: {
        year: currentYear,
        enable_optional_holidays: enableOptionalHolidays,
        no_of_allowed_optional_holidays: totalOptionalHolidays,
        time_period_optional_holidays: optionalRepetitionType,
        holiday_types: ["national", "optional"],
      },
      add_holiday_infos: [],
      update_holiday_infos: [],
      remove_holiday_infos: [],
    };

    const removedHolidays = currentYearHolidaysList
      .filter(
        currentHoliday =>
          !totalHolidayList.some(leave => leave.id === currentHoliday.id)
      )
      .map(removedHoliday => removedHoliday.id);

    payload.remove_holiday_infos.push(...removedHolidays);

    const sortedHolidays = totalHolidayList.filter(
      holiday =>
        !currentYearHolidaysList.some(currentHoliday => {
          const holidayJSON = JSON.stringify(holiday);
          const currentHolidayJSON = JSON.stringify(currentHoliday);

          return holidayJSON === currentHolidayJSON;
        })
    );

    sortedHolidays.forEach(holiday => {
      if (holiday.id) {
        payload.update_holiday_infos.push(holiday);
      } else {
        payload.add_holiday_infos.push(holiday);
      }
    });

    saveUpdatedHolidayDetails(payload);
  };

  const saveUpdatedHolidayDetails = async payload => {
    try {
      setHolidayErrors({} as Record<number, Record<string, string[]>>);
      setOptionalHolidayErrors({} as Record<number, Record<string, string[]>>);
      await holidaysApi.updateHolidays(currentYear, payload);
      fetchHolidays();
      setIsEditable(false);
    } catch (error) {
      const fieldErrors = error.response?.data?.field_errors;
      if (fieldErrors) {
        const newHolidayErrors: Record<number, Record<string, string[]>> = {};
        const newOptionalHolidayErrors: Record<
          number,
          Record<string, string[]>
        > = {};

        if (fieldErrors.add_holiday_infos) {
          const addInfos = payload.add_holiday_infos;
          const matchedHolidayIndices = new Set<number>();
          const matchedOptionalIndices = new Set<number>();

          const payloadToListIndexMap: Record<
            number,
            { isOptional: boolean; listIndex: number }
          > = {};

          addInfos.forEach((info, payloadIndex) => {
            const isOptional = info.category === "optional";
            if (isOptional) {
              for (let i = 0; i < optionalHolidaysList.length; i++) {
                const h = optionalHolidaysList[i];
                if (
                  !h.id &&
                  h.name === info.name &&
                  h.date === info.date &&
                  !matchedOptionalIndices.has(i)
                ) {
                  matchedOptionalIndices.add(i);
                  payloadToListIndexMap[payloadIndex] = {
                    isOptional: true,
                    listIndex: i,
                  };
                  break;
                }
              }
            } else {
              for (let i = 0; i < holidayList.length; i++) {
                const h = holidayList[i];
                if (
                  !h.id &&
                  h.name === info.name &&
                  h.date === info.date &&
                  !matchedHolidayIndices.has(i)
                ) {
                  matchedHolidayIndices.add(i);
                  payloadToListIndexMap[payloadIndex] = {
                    isOptional: false,
                    listIndex: i,
                  };
                  break;
                }
              }
            }
          });

          Object.entries(fieldErrors.add_holiday_infos).forEach(
            ([indexStr, errors]: [string, any]) => {
              const payloadIndex = parseInt(indexStr, 10);
              const mapping = payloadToListIndexMap[payloadIndex];

              if (mapping) {
                if (mapping.isOptional) {
                  newOptionalHolidayErrors[mapping.listIndex] = errors;
                } else {
                  newHolidayErrors[mapping.listIndex] = errors;
                }
              }
            }
          );
        }

        if (fieldErrors.update_holiday_infos) {
          Object.entries(fieldErrors.update_holiday_infos).forEach(
            ([indexStr, errors]: [string, any]) => {
              const index = parseInt(indexStr, 10);

              const updateInfos = payload.update_holiday_infos;
              if (updateInfos[index]) {
                const holidayId = updateInfos[index].id;
                const holidayIndex = holidayList.findIndex(
                  h => h.id === holidayId
                );
                if (holidayIndex !== -1) {
                  newHolidayErrors[holidayIndex] = errors;
                } else {
                  const optionalIndex = optionalHolidaysList.findIndex(
                    h => h.id === holidayId
                  );
                  if (optionalIndex !== -1) {
                    newOptionalHolidayErrors[optionalIndex] = errors;
                  }
                }
              }
            }
          );
        }

        setHolidayErrors(newHolidayErrors);
        setOptionalHolidayErrors(newOptionalHolidayErrors);
      } else {
        Toastr.error("Failed to save holidays");
      }
    }
  };

  const handleCancelAction = () => {
    if (isDesktop) {
      if (holidays.length) {
        updateHolidaysList(holidays);
      }
      setIsEditable(false);
      setHolidayErrors({} as Record<number, Record<string, string[]>>);
      setOptionalHolidayErrors({} as Record<number, Record<string, string[]>>);
    } else {
      navigate("/settings/profile");
    }
  };

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className="flex h-full w-full flex-col">
      <OrganizationHolidaysEditor
        currentYear={currentYear}
        dateFormat={dateFormat}
        enableOptionalHolidays={enableOptionalHolidays}
        canManageHolidays={canManageHolidays}
        isEditable={isEditable}
        setIsEditable={setIsEditable}
        handleAddHoliday={handleAddHoliday}
        handleCancelAction={handleCancelAction}
        handleChangeRepetitionOpHoliday={handleChangeRepetitionOpHoliday}
        handleChangeTotalOpHoliday={handleChangeTotalOpHoliday}
        handleCheckboxClick={handleCheckboxClick}
        handleDatePicker={handleDatePicker}
        handleDeleteHoliday={handleDeleteHoliday}
        handleHolidateNameChange={handleHolidateNameChange}
        holidayList={holidayList}
        isDesktop={isDesktop}
        optionalHolidaysList={optionalHolidaysList}
        optionalRepetitionType={optionalRepetitionType}
        optionalWrapperRef={optionalWrapperRef}
        holidayErrors={holidayErrors}
        optionalHolidayErrors={optionalHolidayErrors}
        setCurrentYear={setCurrentYear}
        setEnableOptionalHolidays={setEnableOptionalHolidays}
        setShowDatePicker={setShowDatePicker}
        setShowOptionalDatePicker={setShowOptionalDatePicker}
        showDatePicker={showDatePicker}
        showOptionalDatePicker={showOptionalDatePicker}
        totalOptionalHolidays={totalOptionalHolidays}
        updateHolidayDetails={handleUpdateHolidayDetails}
        wrapperRef={wrapperRef}
      />
    </div>
  );
};

export default Holidays;
