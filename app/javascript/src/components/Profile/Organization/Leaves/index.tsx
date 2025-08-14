import { leaveIcons, leaveColors } from "constants/leaveType";

import React, { useEffect, useState } from "react";

import leavesApi from "apis/leaves";
import teamApi from "apis/team";
import Loader from "common/Loader/index";
import { useUserContext } from "context/UserContext";
import { getYear } from "date-fns";
import { useNavigate } from "react-router-dom";
import { sendGAPageView } from "utils/googleAnalytics";

import Details from "./Details";
import EditLeaves from "./EditLeaves";
import {
  makeLeavePayload,
  makeLeavesList,
  makeCustomLeavesList,
  makeCustomLeavePayload,
} from "./utils";

const Leaves = () => {
  const [leaveBalanceList, setLeaveBalanceList] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [customLeavesList, setCustomLeavesList] = useState([]);
  const [iconOptions, setIconOptions] = useState(leaveIcons);
  const [colorOptions, setColorOptions] = useState(leaveColors);
  const [isLoading, setIsLoading] = useState(true);
  const [currentYear, setCurrentYear] = useState<number>(getYear(new Date()));
  const [currentYearLeaves, setCurrentYearLeaves] = useState([]);
  const [currentYearCustomLeaves, setCurrentYearCustomLeaves] = useState([]);
  const [isEditable, setIsEditable] = useState(false);
  const [isDisableUpdateBtn, setIsDisableUpdateBtn] = useState(false);
  const [employees, setEmployees] = useState<Array<any>>([]);

  const { isDesktop } = useUserContext();
  const navigate = useNavigate();

  useEffect(() => sendGAPageView(), []);

  useEffect(() => {
    fetchLeaves();
    fetchEmployees();
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

  const fetchEmployees = async () => {
    const res = await teamApi.get();
    const empData = res.data.combinedDetails;
    const empList = empData
      .filter(emp => emp.isTeamMember)
      .map(emp => ({
        value: emp.id,
        label: emp.name,
      }));

    setEmployees(empList);
  };

  useEffect(() => {
    if (leaves.length) {
      updateLeaveBalanceList();
    }
  }, [currentYear]);

  const updateLeaveBalanceList = (allLeaves = leaves) => {
    const currentLeaves = allLeaves.find(leave => leave.year == currentYear);
    if (currentLeaves) {
      if (currentLeaves?.leave_types.length) {
        setLeaveBalanceList(makeLeavesList(currentLeaves?.leave_types));
        setCurrentYearLeaves(makeLeavesList(currentLeaves?.leave_types));
      }

      if (currentLeaves?.custom_leaves.length) {
        setCustomLeavesList(makeCustomLeavesList(currentLeaves?.custom_leaves));
        setCurrentYearCustomLeaves(
          makeCustomLeavesList(currentLeaves?.custom_leaves)
        );
      }
    } else {
      setLeaveBalanceList([]);
      setCustomLeavesList([]);
      setCurrentYearLeaves([]);
      setCurrentYearCustomLeaves([]);
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

  const handleAddCustomLeave = () => {
    setCustomLeavesList([
      ...customLeavesList,
      ...[
        {
          customLeaveType: "",
          customLeaveTotal: 0,
          customAllocationPeriod: "days",
          employees: [],
        },
      ],
    ]);
  };

  const handleOnChangeLeaves = (type, value, index) => {
    const editLeaveList = [...leaveBalanceList];
    editLeaveList[index][type] = value;
    setLeaveBalanceList([...editLeaveList]);
  };

  const handleOnChangeCustomLeaves = (type, value, index) => {
    const editCustomLeaveList = [...customLeavesList];
    editCustomLeaveList[index][type] = value;
    setCustomLeavesList([...editCustomLeaveList]);
  };

  const handleUpdateDetails = async () => {
    const payload = {
      add_leave_types: [],
      updated_leave_types: [],
      removed_leave_type_ids: [],
    };

    const customPayload = {
      add_custom_leaves: [],
      update_custom_leaves: [],
      remove_custom_leaves: [],
    };

    setIsDisableUpdateBtn(true);

    //filtering out removed leaves
    const removedLeaves = currentYearLeaves
      .filter(
        currentLeave =>
          !leaveBalanceList.some(leave => leave.id === currentLeave.id)
      )
      .map(removedLeave => removedLeave.id);

    //filtering out removed custom leaves
    const removedCustomLeaves = currentYearCustomLeaves
      .filter(
        currentLeave =>
          !customLeavesList.some(leave => leave.id === currentLeave.id)
      )
      .map(removedLeave => removedLeave.id);

    //updating payload
    payload.removed_leave_type_ids.push(...removedLeaves);
    customPayload.remove_custom_leaves.push(...removedCustomLeaves);

    const leavesList = leaveBalanceList.filter(
      leave =>
        !currentYearLeaves.some(currentLeave => {
          const leaveJSON = JSON.stringify(leave);
          const currentLeaveJSON = JSON.stringify(currentLeave);

          return leaveJSON === currentLeaveJSON;
        })
    );

    //updating leaves payload for add and update
    leavesList.forEach(leave => {
      if (leave.id) {
        payload.updated_leave_types.push(makeLeavePayload(leave));
      } else {
        payload.add_leave_types.push(makeLeavePayload(leave));
      }
    });

    const customLeaves = customLeavesList.filter(
      customLeave =>
        !currentYearCustomLeaves.some(currentLeave => {
          const leaveJSON = JSON.stringify(customLeave);
          const currentLeaveJSON = JSON.stringify(currentLeave);

          return leaveJSON === currentLeaveJSON;
        })
    );

    //updating custom leaves payload for add and update
    customLeaves.forEach(customLeave => {
      if (customLeave.id) {
        customPayload.update_custom_leaves.push(
          makeCustomLeavePayload(customLeave)
        );
      } else {
        customPayload.add_custom_leaves.push(
          makeCustomLeavePayload(customLeave)
        );
      }
    });

    updateLeaveDetails(payload, customPayload);
  };

  const updateLeaveDetails = async (payload, customPayload) => {
    try {
      await leavesApi.updateLeaveWithLeaveTypes(currentYear, payload);
      await leavesApi.customLeaves(currentYear, {
        custom_leaves: customPayload,
      });
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

  const handleDeleteLeave = (leave, isCustom = false) => {
    if (isCustom) {
      setCustomLeavesList(customLeavesList.filter(prev => prev !== leave));
    } else {
      setLeaveBalanceList(leaveBalanceList.filter(prev => prev !== leave));
    }
  };

  const handleLeaveTypeChange = (e, index, isCustom = false) => {
    const result = e.target.value.replace(/[^a-zA-Z- ]/g, "");
    if (isCustom) {
      handleOnChangeCustomLeaves("customLeaveType", result, index);
    } else {
      handleOnChangeLeaves("leaveType", result, index);
    }
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
          customLeavesList={customLeavesList}
          employees={employees}
          handleAddCustomLeave={handleAddCustomLeave}
          handleAddLeaveType={handleAddLeaveType}
          handleCancelAction={handleCancelAction}
          handleDeleteLeave={handleDeleteLeave}
          handleLeaveTypeChange={handleLeaveTypeChange}
          handleOnChangeCustomLeaves={handleOnChangeCustomLeaves}
          handleOnChangeLeaves={handleOnChangeLeaves}
          iconOptions={iconOptions}
          isDesktop={isDesktop}
          isDisableUpdateBtn={isDisableUpdateBtn}
          leaveBalanceList={leaveBalanceList}
          setCurrentYear={setCurrentYear}
          updateLeaveDetails={handleUpdateDetails}
        />
      ) : (
        <Details
          showYearPicker
          currentYear={currentYear}
          customLeavesList={currentYearCustomLeaves}
          editAction={() => setIsEditable(true)}
          leavesList={currentYearLeaves}
          setCurrentYear={setCurrentYear}
        />
      )}
    </div>
  );
};

export default Leaves;
