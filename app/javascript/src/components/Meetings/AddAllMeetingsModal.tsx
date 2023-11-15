import React from "react";

import { Modal, Button } from "StyledComponents";

import { removeFromLocalStorage } from "utils/storage";

const AddAllMeetingsModal = ({
  showDialog,
  setShowDialog,
  formatDataForTimeTracking,
  meetings,
  setMeetings,
}) => (
  <Modal
    customStyle="sm:my-8 sm:w-full sm:max-w-lg sm:align-middle"
    isOpen={showDialog}
    onClose={() => setShowDialog(false)}
  >
    <div className="my-8 flex-col">
      <h6 className="mb-2 text-2xl font-bold">Add all meetings</h6>
      <p className="mt-2 font-normal">
        Are you sure you want to add all {meetings.length} meetings as time
        entries?
      </p>
    </div>
    <div className="flex justify-between">
      <Button
        className="mr-2 w-1/2"
        size="medium"
        style="secondary"
        onClick={() => setShowDialog(false)}
      >
        CANCEL
      </Button>
      <Button
        className="ml-2 w-1/2"
        size="medium"
        style="primary"
        onClick={() => {
          formatDataForTimeTracking(meetings, true);
          removeFromLocalStorage("calendarEvents");
          setMeetings([]);
          setShowDialog(false);
        }}
      >
        Add {meetings.length} meetings
      </Button>
    </div>
  </Modal>
);

export default AddAllMeetingsModal;
