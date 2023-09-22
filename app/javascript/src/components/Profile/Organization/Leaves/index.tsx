/* eslint-disable @typescript-eslint/no-var-requires */
import React, { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";
import { Toastr } from "StyledComponents";

import Loader from "common/Loader";
import DetailsHeader from "components/Profile/DetailsHeader";
import { leaveIcons, leaveColors } from "constants/leaveType";
import { useUserContext } from "context/UserContext";
import { sendGAPageView } from "utils/googleAnalytics";

import Details from "./Details";
import EditLeaves from "./EditLeaves";

import Header from "../../Header";

const Leaves = () => {
  const [leaveBalanceList, setLeaveBalanceList] = useState([]);
  const [iconOptions, setIconOptions] = useState(leaveIcons);
  const [colorOptions, setColorOptions] = useState(leaveColors);
  const [isDetailUpdated, setIsDetailUpdated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [isEditable, setIsEditable] = useState(true);
  const { isDesktop } = useUserContext();
  const navigate = useNavigate();

  useEffect(() => {
    sendGAPageView();
  }, []);

  useEffect(() => {
    if (leaveBalanceList) {
      handleIconSelect();
      handleColorSelect();
    }
  }, [leaveBalanceList]);

  const handleAddLeaveType = () => {
    setLeaveBalanceList([
      ...leaveBalanceList,
      ...[
        {
          leaveType: "",
          leaveIcon: "",
          leaveColor: "",
          total: 0,
          countType: "days",
          repetitionType: "per_year",
          carryForwardDays: 0,
        },
      ],
    ]);
  };

  const updateCondition = (type, value, index) => {
    const editLeaveList = [...leaveBalanceList];
    editLeaveList[index][type] = value;
    setLeaveBalanceList([...editLeaveList]);
    setIsDetailUpdated(true);
  };

  const updateLeaveDetails = async () => {
    try {
      setIsEditable(false);
    } catch {
      setIsLoading(false);
      Toastr.error("Error in Updating Leave Details");
    }
  };

  const handleCancelAction = () => {
    if (isDesktop) {
      setIsDetailUpdated(false);
      setIsEditable(false);
    } else {
      navigate("/profile/edit/option");
    }
  };

  const handleDeleteLeaveBalance = index => {
    const updatedLeaveBalance = leaveBalanceList;
    updatedLeaveBalance.splice(index, 1);
    setLeaveBalanceList([...updatedLeaveBalance]);
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

  const getLeavesContent = () => {
    if (isLoading) {
      return <Loader />;
    }

    if (isEditable) {
      return (
        <EditLeaves
          colorOptions={colorOptions}
          handleAddLeaveType={handleAddLeaveType}
          handleCancelAction={handleCancelAction}
          handleDeleteLeaveBalance={handleDeleteLeaveBalance}
          handleLeaveTypeChange={handleLeaveTypeChange}
          iconOptions={iconOptions}
          isDesktop={isDesktop}
          leaveBalanceList={leaveBalanceList}
          updateCondition={updateCondition}
          updateLeaveDetails={updateLeaveDetails}
        />
      );
    }

    return <Details leavesList={leaveBalanceList} />;
  };

  return (
    <div className="flex h-full w-full flex-col">
      {isEditable ? (
        <Header
          showButtons
          showYearPicker
          cancelAction={handleCancelAction}
          isDisableUpdateBtn={isDetailUpdated}
          saveAction={updateLeaveDetails}
          subTitle=""
          title="Leaves"
        />
      ) : (
        <DetailsHeader
          showButtons
          showYearPicker
          editAction={() => setIsEditable(true)}
          isDisableUpdateBtn={false}
          subTitle=""
          title="Leaves"
        />
      )}
      {getLeavesContent()}
    </div>
  );
};

export default Leaves;
