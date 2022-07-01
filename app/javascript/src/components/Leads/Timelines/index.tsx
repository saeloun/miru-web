import React, { useEffect, useState } from "react";
import { ToastContainer } from "react-toastify";
import { setAuthHeaders } from "apis/axios";
import leadTimelines from "apis/lead-timelines";
import NewCommentTimeline from "./../Modals/NewCommentTimeline";
import Header from "./Header";
import { TOASTER_DURATION } from "../../../constants/index";
import { unmapLeadTimelineList } from "../../../mapper/lead.timeline.mapper";

const Timelines = ({ leadDetails }) => {
  const [timelineData, setTimelineData] = useState<any>(null);
  const [newCommentTimeline, setNewCommentTimeline] = useState<boolean>(false);
  const [newAppointmentTimeline, setNewAppointmentTimeline] = useState<boolean>(false);

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
        <Header isAdminUser={true} setNewCommentTimeline={setNewCommentTimeline} setNewAppointmentTimeline={setNewAppointmentTimeline} />
        <div className="my-6">
          <div className="flex flex-col w-full">
            {timelineData && timelineData.map((timeline) => (
              <div className="flex justify-beetween w-full h-full bg-white dark:bg-gray-800">
                <div className="w-full bg-white dark:bg-gray-800 text-black dark:text-gray-200 p-4 antialiased flex">
                  <img className="rounded-full h-8 w-8 mr-2 mt-1 " src={`${timeline.action_created_by && timeline.action_created_by.avatar_url ? timeline.action_created_by.avatar_url : "/assets/avatar.svg"}`}/>
                  <div className="w-full">
                    <div className="bg-gray-100 dark:bg-gray-700 rounded-3xl px-4 pt-2 pb-2.5">
                      <div className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: timeline.index_system_display_title }} />
                      <div className="mt-0.5 text-normal leading-snug md:leading-normal" dangerouslySetInnerHTML={{ __html: timeline.index_system_display_message }} />
                    </div>
                    <div className="text-sm ml-4 mt-0.5 text-gray-500 dark:text-gray-400">{timeline.created_at_formated}</div>
                    {/* <div className="bg-white dark:bg-gray-700 border border-white dark:border-gray-700 rounded-full float-right -mt-8 mr-0.5 flex shadow items-center ">
                      <svg className="p-0.5 h-5 w-5 rounded-full z-20 bg-white dark:bg-gray-700" />
                      <svg className="p-0.5 h-5 w-5 rounded-full -ml-1.5 bg-white dark:bg-gray-700" />
                      <span className="text-sm ml-1 pr-1.5 text-gray-500 dark:text-gray-300">3</span>
                    </div> */}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        {newCommentTimeline && (
          <NewCommentTimeline
            leadDetails={leadDetails}
            timelineData={timelineData}
            setNewCommentTimeline={setNewCommentTimeline}
            setTimelineData={setTimelineData}
          />
        )}
        {newAppointmentTimeline && ('')}
      </React.Fragment>
    </>
  );
};

export default Timelines;
