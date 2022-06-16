import React, { useEffect } from "react";
import { ToastContainer } from "react-toastify";
import { TOASTER_DURATION } from "../../../constants/index";

const Timeline = ({ leadDetails }) => {
  useEffect(() => {
    // setAuthHeaders();
  }, [leadDetails.id]);

  return (
    <>
      <ToastContainer autoClose={TOASTER_DURATION} />
      <div>
        <div className="flex flex-col">
          <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
              <div className="overflow-hidden">
                <code>Coming Soon...</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Timeline;
