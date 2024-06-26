/* eslint-disable @typescript-eslint/no-var-requires */
import React, { useEffect, useState } from "react";

import { getYear } from "date-fns";
import { useNavigate } from "react-router-dom";

import leavesApi from "apis/leaves";
import Loader from "common/Loader/index";
import { leaveIcons, leaveColors } from "constants/leaveType";
import { useUserContext } from "context/UserContext";
import { sendGAPageView } from "utils/googleAnalytics";

import Details from "./Details";
import EditLeaves from "./EditLeaves";
import { makeLeavePayload, makeLeavesList } from "./utils";

const Leaves = () => {
  const [leaveBalanceList, setLeaveBalanceList] = useState([]);
  const [iconOptions, setIconOptions] = useState(leaveIcons);
  const [colorOptions, setColorOptions] = useState(leaveColors);
  const [isLoading, setIsLoading] = useState(true);
  const [currentYear, setCurrentYear] = useState<number>(getYear(new Date()));
  const [leaves, setLeaves] = useState([]);
  const [currentYearLeaves, setCurrentYearLeaves] = useState([]);
  const [isEditable, setIsEditable] = useState(false);
  const [isDisableUpdateBtn, setIsDisableUpdateBtn] = useState(false);

  const { isDesktop } = useUserContext();
  const navigate = useNavigate();

  useEffect(() => sendGAPageView(), []);

  useEffect(() => {
    fetchLeaves();
  }, []);

  useEffect(() => {
    if (leaveBalanceList) {
      handleIconSelect();
      handleColorSelect();
    }
  }, [leaveBalanceList]);

  const fetchLeaves = async () => {
    const res = await leavesApi.allLeaves();
    setLeaves(res.data.leaves);
    updateLeaveBalanceList(res.data.leaves);
    setIsLoading(false);
  };

  useEffect(() => {
    if (leaves.length) {
      updateLeaveBalanceList();
    }
  }, [currentYear]);

  const updateLeaveBalanceList = (allLeaves = leaves) => {
    const currentLeaves = allLeaves.find(leave => leave.year == currentYear);
    if (currentLeaves?.leave_types.length) {
      setLeaveBalanceList(makeLeavesList(currentLeaves?.leave_types));
      setCurrentYearLeaves(makeLeavesList(currentLeaves?.leave_types));
    } else {
      setLeaveBalanceList([]);
      setCurrentYearLeaves([]);
    }
  };

  const handleAddLeaveType = () => {
    setLeaveBalanceList([
      ...leaveBalanceList,
      ...[
        {
          leaveType: "",
          leaveIcon: "",
          leaveColor: "",
          total: 0,
          allocationPeriod: "days",
          allocationFrequency: "per_year",
          carryForwardDays: 0,
        },
      ],
    ]);
  };

  const updateCondition = (type, value, index) => {
    const editLeaveList = [...leaveBalanceList];
    editLeaveList[index][type] = value;
    setLeaveBalanceList([...editLeaveList]);
  };

  const handleUpdateDetails = async () => {
    const payload = {
      add_leave_types: [],
      updated_leave_types: [],
      removed_leave_type_ids: [],
    };

    setIsDisableUpdateBtn(true);

    const removedLeaves = currentYearLeaves
      .filter(
        currentLeave =>
          !leaveBalanceList.some(leave => leave.id === currentLeave.id)
      )
      .map(removedLeave => removedLeave.id);

    payload.removed_leave_type_ids.push(...removedLeaves);

    const leavesList = leaveBalanceList.filter(
      leave =>
        !currentYearLeaves.some(currentLeave => {
          const leaveJSON = JSON.stringify(leave);
          const currentLeaveJSON = JSON.stringify(currentLeave);

          return leaveJSON === currentLeaveJSON;
        })
    );

    leavesList.forEach(leave => {
      if (leave.id) {
        payload.updated_leave_types.push(makeLeavePayload(leave));
      } else {
        payload.add_leave_types.push(makeLeavePayload(leave));
      }
    });

    updateLeaveDetails(payload);
  };

  const updateLeaveDetails = async payload => {
    try {
      await leavesApi.updateLeaveWithLeaveTypes(currentYear, payload);
      setIsDisableUpdateBtn(false);
      setIsEditable(false);
      fetchLeaves();
    } catch {
      setIsLoading(false);
      setIsDisableUpdateBtn(false);
    }
  };

  const handleCancelAction = () => {
    if (isDesktop) {
      updateLeaveBalanceList();
      setIsEditable(false);
    } else {
      navigate("/settings/profile");
    }
  };

  const handleDeleteLeaveBalance = leave => {
    setLeaveBalanceList(leaveBalanceList.filter(prev => prev !== leave));
  };

  const handleLeaveTypeChange = (e, index) => {
    const result = e.target.value.replace(/[^a-zA-Z- ]/g, "");
    updateCondition("leaveType", result, index);
  };

  const handleIconSelect = () => {
    const selectedIcons = leaveBalanceList.map(item => item.leaveIcon);
    const filteredIconsList = leaveIcons.filter(
      icon => !selectedIcons.includes(icon)
    );
    setIconOptions(filteredIconsList);
  };

  const handleColorSelect = () => {
    const selectedColors = leaveBalanceList.map(item => item.leaveColor);
    const filteredColorsList = leaveColors.filter(
      icon => !selectedColors.includes(icon)
    );
    setColorOptions(filteredColorsList);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-70v items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col">
      {isEditable ? (
        <EditLeaves
          showYearPicker
          colorOptions={colorOptions}
          currentYear={currentYear}
          handleAddLeaveType={handleAddLeaveType}
          handleCancelAction={handleCancelAction}
          handleDeleteLeaveBalance={handleDeleteLeaveBalance}
          handleLeaveTypeChange={handleLeaveTypeChange}
          iconOptions={iconOptions}
          isDesktop={isDesktop}
          isDisableUpdateBtn={isDisableUpdateBtn}
          leaveBalanceList={leaveBalanceList}
          setCurrentYear={setCurrentYear}
          updateCondition={updateCondition}
          updateLeaveDetails={handleUpdateDetails}
        />
      ) : (
        <Details
          showYearPicker
          currentYear={currentYear}
          editAction={() => setIsEditable(true)}
          leavesList={currentYearLeaves}
          setCurrentYear={setCurrentYear}
        />
      )}
    </div>
  );
};

export default Leaves;
