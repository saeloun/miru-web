/* eslint-disable no-unused-vars */
import React, { useState } from "react";

import EmptyStates from "common/EmptyStates";

import Header from "./Header";
import MeetingList from "./MeetingList";

const Meetings = () => {
  const [meetings, setMeetings] = useState<any[]>(["a", "v", "c"]);

  return (
    <>
      <Header />
      {meetings.length >= 1 ? (
        <MeetingList />
      ) : (
        <EmptyStates
          Message="You don't have any pending meetings that can be added as time entries"
          showNoSearchResultState={false}
        />
      )}
    </>
  );
};

export default Meetings;
