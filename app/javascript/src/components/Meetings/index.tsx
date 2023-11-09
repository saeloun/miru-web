import React, { useEffect, useState } from "react";

import { CalendarIcon } from "miruIcons";
import { useNavigate } from "react-router-dom";
import { Button } from "StyledComponents";

import EmptyStates from "common/EmptyStates";
import { useUserContext } from "context/UserContext";
import { getValueFromLocalStorage, setToLocalStorage } from "utils/storage";

import Header from "./Header";
import MeetingList from "./MeetingList";

const Meetings = () => {
  const [meetings, setMeetings] = useState<any[]>(
    JSON.parse(getValueFromLocalStorage("calendarEvents") || "[]")
  );
  const { calendarConnected } = useUserContext();
  const navigate = useNavigate();

  useEffect(() => {
    setToLocalStorage("calendarEvents", JSON.stringify(meetings));
  }, [meetings]);

  return (
    <>
      <Header />
      {meetings?.length >= 1 ? (
        <MeetingList meetings={meetings} setMeetings={setMeetings} />
      ) : (
        <EmptyStates
          containerClassName="h-1/2"
          showNoSearchResultState={false}
          Message={
            calendarConnected
              ? "You don't have any pending meetings that can be added as time entries"
              : "You have not connected any meeting app to track your meetings"
          }
        >
          {!calendarConnected && (
            <Button
              className="flex h-14 w-96 items-center justify-center text-xl font-bold"
              style="primary"
              onClick={() => navigate("/settings/integrations")}
            >
              <CalendarIcon className="mr-2" />
              <span>Connect Meeting apps</span>
            </Button>
          )}
        </EmptyStates>
      )}
    </>
  );
};

export default Meetings;
