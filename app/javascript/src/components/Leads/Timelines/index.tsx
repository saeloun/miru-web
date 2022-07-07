/* eslint-disable @typescript-eslint/no-var-requires */
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { setAuthHeaders } from "apis/axios";
import leadTimelines from "apis/lead-timelines";
import Pagination from "common/Pagination";
// import { MessengerLogo } from "phosphor-react";
import NewAppointmentTimeline from "./../Modals/NewAppointmentTimeline";
import NewCommentTimeline from "./../Modals/NewCommentTimeline";
import NewEmailTimeline from "./../Modals/NewEmailTimeline";
import NewLinkedinDMTimeline from "./../Modals/NewLinkedinDMTimeline";
import NewOtherDMTimeline from "./../Modals/NewOtherDMTimeline";
import NewPhoneCallTimeline from "./../Modals/NewPhoneCallTimeline";
import NewSkypeDMTimeline from "./../Modals/NewSkypeDMTimeline";
import NewTaskTimeline from "./../Modals/NewTaskTimeline";
import Header from "./Header";
import { TOASTER_DURATION } from "../../../constants/index";
import { unmapLeadTimelineList } from "../../../mapper/lead.timeline.mapper";

const profileDefaultAvatar = require("../../../../../assets/images/avatar.svg");
const systemMessageIcon = require("../../../../../assets/images/system_message.svg");

const Timelines = ({ leadDetails }) => {
  const [showButton, setShowButton] = useState(false);

  const [toggleMenu, setToggleMenu] = useState<boolean>(false);
  const wrapperRef = React.useRef(null);

  const closeOpenToggleMenu = (e)=>{
    if (wrapperRef.current && toggleMenu && !wrapperRef.current.contains(e.target)){
      setToggleMenu(false)
    }
  };

  document.addEventListener('click',closeOpenToggleMenu)

  const [timelineData, setTimelineData] = useState<any>(null);
  const [newCommentTimeline, setNewCommentTimeline] = useState<boolean>(false);
  const [newAppointmentTimeline, setNewAppointmentTimeline] = useState<boolean>(false);
  const [newEmailTimeline, setNewEmailTimeline] = useState<boolean>(false);
  const [newPhoneCallTimeline, setNewPhoneCallTimeline] = useState<boolean>(false);
  const [newSkypeDMTimeline, setNewSkypeDMTimeline] = useState<boolean>(false);
  const [newLinkedinDMTimeline, setNewLinkedinDMTimeline] = useState<boolean>(false);
  const [newOtherDMTimeline, setNewOtherDMTimeline] = useState<boolean>(false);
  const [newTaskTimeline, setNewTaskTimeline] = useState<boolean>(false);

  const [pagy, setPagy] = React.useState<any>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [params, setParams] = React.useState<any>({
    timelines_per_page: searchParams.get("timelines_per_page") || 50,
    page: searchParams.get("page") || 1
  });
  const queryParams = () => new URLSearchParams(params).toString();

  const fetchLeadTimelines = () => {
    if (leadDetails && leadDetails.id) {
      leadTimelines.index(leadDetails.id, queryParams())
        .then((res) => {
          const sanitized = unmapLeadTimelineList(res);
          setTimelineData(sanitized.itemList);
          setPagy(res.data.pagy);
        });
    }
  };

  useEffect(() => {
    fetchLeadTimelines();
    setSearchParams(params);
  }, [params.timelines_per_page, params.page]);

  useEffect(() => {
    setAuthHeaders();
    fetchLeadTimelines();
  }, [leadDetails.id]);

  useEffect(() => {
    window.addEventListener("scroll", () => {
      if (window.pageYOffset > 300) {
        setShowButton(true);
      } else {
        setShowButton(false);
      }
    });
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <>
      <React.Fragment>
        <ToastContainer autoClose={TOASTER_DURATION} />
        <Header isAdminUser={true}
          setNewCommentTimeline={setNewCommentTimeline}
          setNewAppointmentTimeline={setNewAppointmentTimeline}
          setNewEmailTimeline={setNewEmailTimeline}
          setNewPhoneCallTimeline={setNewPhoneCallTimeline}
          setNewSkypeDMTimeline={setNewSkypeDMTimeline}
          setNewLinkedinDMTimeline={setNewLinkedinDMTimeline}
          setNewOtherDMTimeline={setNewOtherDMTimeline}
          setNewTaskTimeline={setNewTaskTimeline}
        />
        <div className="my-6">
          <div className="flex flex-col w-full">
            {timelineData && timelineData.map((timeline) => (
              <div className="flex justify-beetween w-full h-full bg-white dark:bg-gray-800">
                <div className="w-full bg-white dark:bg-gray-800 text-black dark:text-gray-200 p-4 antialiased flex">
                  {timeline.kind === 0 ?
                    <img className="rounded-lg h-8 w-8 mr-2 mt-1 " src={systemMessageIcon}/>
                    :
                    <img className="rounded-full h-8 w-8 mr-2 mt-1 " src={`${timeline.action_created_by && timeline.action_created_by.avatar_url ? timeline.action_created_by.avatar_url : profileDefaultAvatar}`}/>
                  }

                  <div className="w-full">
                    <div className="bg-gray-100 dark:bg-gray-700 rounded-3xl px-4 pt-2 pb-2.5">
                      <div className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: timeline.index_system_display_title }} />
                      <div className="mt-0.5 text-normal leading-snug md:leading-normal" dangerouslySetInnerHTML={{ __html: timeline.index_system_display_message }} />
                    </div>
                    <div className="text-sm ml-4 mt-0.5 text-gray-500 dark:text-gray-400">{timeline.created_at_formated}</div>
                    {/* <div className="bg-white dark:bg-gray-700 border border-white dark:border-gray-700 rounded-full float-right -mt-8 mr-0.5 flex shadow items-center ">
                      <svg className="p-0.5 h-5 w-5 rounded-full bg-white dark:bg-gray-700"></svg>
                      <svg className="p-0.5 h-5 w-5 rounded-full -ml-1.5 bg-white dark:bg-gray-700"></svg>
                      <span className="text-sm ml-1 pr-1.5 text-gray-500 dark:text-gray-300">0</span>
                    </div> */}
                  </div>
                </div>
              </div>
            ))}
            {timelineData && timelineData.length && (
              <Pagination pagy={pagy} params={params} setParams={setParams} forPage="lead_timelines" />
            )}
            {showButton && (
              <button
                type="button"
                onClick={scrollToTop}
                data-mdb-ripple="true"
                data-mdb-ripple-color="light"
                className="inline-block p-3 bg-miru-han-purple-1000 text-white font-medium text-xs leading-tight uppercase rounded-full shadow-md hover:bg-miru-han-purple-700 hover:shadow-lg focus:bg-miru-han-purple-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-red-800 active:shadow-lg transition duration-150 ease-in-out bottom-5 right-5 fixed"
                id="btn-back-to-top"
              >
                <svg
                  aria-hidden="true"
                  focusable="false"
                  data-prefix="fas"
                  className="w-4 h-4"
                  role="img"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 448 512"
                >
                  <path
                    fill="currentColor"
                    d="M34.9 289.5l-22.2-22.2c-9.4-9.4-9.4-24.6 0-33.9L207 39c9.4-9.4 24.6-9.4 33.9 0l194.3 194.3c9.4 9.4 9.4 24.6 0 33.9L413 289.4c-9.5 9.5-25 9.3-34.3-.4L264 168.6V456c0 13.3-10.7 24-24 24h-32c-13.3 0-24-10.7-24-24V168.6L69.2 289.1c-9.3 9.8-24.8 10-34.3.4z"
                  ></path>
                </svg>
              </button>
            )}
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
        {newAppointmentTimeline && (<NewAppointmentTimeline
          leadDetails={leadDetails}
          timelineData={timelineData}
          setNewAppointmentTimeline={setNewAppointmentTimeline}
          setTimelineData={setTimelineData}
        />)}
        {newEmailTimeline && (<NewEmailTimeline
          leadDetails={leadDetails}
          timelineData={timelineData}
          setNewEmailTimeline={setNewEmailTimeline}
          setTimelineData={setTimelineData}
        />)}
        {newPhoneCallTimeline && (<NewPhoneCallTimeline
          leadDetails={leadDetails}
          timelineData={timelineData}
          setNewPhoneCallTimeline={setNewPhoneCallTimeline}
          setTimelineData={setTimelineData}
        />)}
        {newSkypeDMTimeline && (<NewSkypeDMTimeline
          leadDetails={leadDetails}
          timelineData={timelineData}
          setNewSkypeDMTimeline={setNewSkypeDMTimeline}
          setTimelineData={setTimelineData}
        />)}
        {newLinkedinDMTimeline && (<NewLinkedinDMTimeline
          leadDetails={leadDetails}
          timelineData={timelineData}
          setNewLinkedinDMTimeline={setNewLinkedinDMTimeline}
          setTimelineData={setTimelineData}
        />)}
        {newOtherDMTimeline && (<NewOtherDMTimeline
          leadDetails={leadDetails}
          timelineData={timelineData}
          setNewOtherDMTimeline={setNewOtherDMTimeline}
          setTimelineData={setTimelineData}
        />)}
        {newTaskTimeline && (<NewTaskTimeline
          leadDetails={leadDetails}
          timelineData={timelineData}
          setNewTaskTimeline={setNewTaskTimeline}
          setTimelineData={setTimelineData}
        />)}

      </React.Fragment>
    </>
  );
};

export default Timelines;
