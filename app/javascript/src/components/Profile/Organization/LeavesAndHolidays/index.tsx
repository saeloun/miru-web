/* eslint-disable @typescript-eslint/no-var-requires */
import React, { useEffect, useRef, useState } from "react";

import { useOutsideClick } from "helpers";
import { Toastr } from "StyledComponents";

import Loader from "common/Loader";
import DetailsHeader from "components/Profile/DetailsHeader";
import { sendGAPageView } from "utils/googleAnalytics";

import Details from "./Details";
import EditLeaves from "./EditLeaves";

import Header from "../../Header";

const Leaves = () => {
  const [leaveBalanceList, setLeaveBalanceList] = useState([]);
  const [isDetailUpdated, setIsDetailUpdated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const modalWrapperRef = useRef(null);

  const [isEditable, setIsEditable] = useState(true);

  const getData = async () => {
    setIsLoading(true);
  };

  useOutsideClick(modalWrapperRef, () => {
    setShowCalendar(false);
  });

  const toggleCalendarModal = () => setShowCalendar(!showCalendar);

  useEffect(() => {
    sendGAPageView();
  }, []);

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
          carryforwardedCount: 0,
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

  const handleupdateLeaveDetails = async () => {
    try {
      setIsEditable(false);
    } catch {
      setIsLoading(false);
      Toastr.error("Error in Updating Leave Details");
    }
  };

  const handleCancelAction = () => {
    getData();
    setIsDetailUpdated(false);
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

  const getLeavesContent = () => {
    if (isLoading) {
      return <Loader />;
    }

    if (isEditable) {
      return (
        <EditLeaves
          handleAddLeaveType={handleAddLeaveType}
          handleDeleteLeaveBalance={handleDeleteLeaveBalance}
          handleLeaveTypeChange={handleLeaveTypeChange}
          leaveBalanceList={leaveBalanceList}
          updateCondition={updateCondition}
        />
      );
    }

    return (
      <Details
        showCalendar={showCalendar}
        toggleCalendarModal={toggleCalendarModal}
        wrapperRef={modalWrapperRef}
      />
    );
  };

  return (
    <div className="flex w-4/5 flex-col">
      {isEditable ? (
        <Header
          showButtons
          cancelAction={handleCancelAction}
          isDisableUpdateBtn={isDetailUpdated}
          saveAction={handleupdateLeaveDetails}
          subTitle=""
          title="Leaves"
        />
      ) : (
        <DetailsHeader
          showButtons
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
