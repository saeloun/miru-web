import React, { useEffect, useState } from "react";
import { ToastContainer } from "react-toastify";
import { setAuthHeaders } from "apis/axios";
import leadTimelines from "apis/lead-timelines";
import { TOASTER_DURATION } from "../../../constants/index";
import { unmapLeadTimelineList } from "../../../mapper/lead.timeline.mapper";

const Timelines = ({ leadDetails }) => {
  const [timelineData, setTimelineData] = useState<any>(null);

  useEffect(() => {
    setAuthHeaders();
    if (leadDetails && leadDetails.id) {
      leadTimelines.index(leadDetails.id, "")
        .then((res) => {
          const sanitized = unmapLeadTimelineList(res);
          setTimelineData(sanitized.itemList);
        });
    }
  }, [leadDetails.id]);

  return (
    <>
      <React.Fragment>
        <ToastContainer autoClose={TOASTER_DURATION} />
        <div className="my-6">
          <div className="flex flex-col w-full">
            {timelineData &&
              <div className="flex-1 flex flex-col py-3 bg-purple-200">
                <div>
                  {timelineData.map((timeline) => (
                    <div className="shadow-lg pt-4 ml-2 mr-2 rounded-lg">
                      <a href="#" className="block bg-white py-3 border-t pb-4">
                        <div className="px-4 py-2 flex  justify-between">
                          <span className="text-sm font-semibold text-gray-900">{timeline.action_created_by_name}</span>
                          <div className="flex">
                            <span className="px-4 text-sm font-semibold text-gray-600">{timeline.created_at_formated}</span>
                            <img className="h-6 w-6 rounded-full object-cover"
                              src="/avatar.svg"
                              alt="" />
                          </div>
                        </div>
                        <p className="px-4 py-2 text-sm font-semibold text-gray-700">{timeline.index_system_display_message}</p>
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            }
          </div>
        </div>
      </React.Fragment>
    </>
  );
};

export default Timelines;
