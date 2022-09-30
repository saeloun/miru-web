import React, { useState, useEffect, useCallback } from "react";

import { useNavigate, useParams } from "react-router-dom";

import Timelines from "./../Timelines";
import Summary from "./Summary";

const Tab = ({
  candidateDetails,
  setCandidateDetails,
  setForItem,
  isEdit,
  setIsEdit,
  setFormRef,
}) => {
  // const defaultClassName = "inline-flex p-4 rounded-t-lg border-b-2 border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300 group";
  // const activeClassName = "inline-flex p-4 text-blue-600 rounded-t-lg border-b-2 border-blue-600 active dark:text-blue-500 dark:border-blue-500 group";

  const defaultClassName = "mr-10 text-base tracking-widest font-medium text-miru-han-purple-600";
  const activeClassName = "mr-10 text-base tracking-widest font-bold text-miru-han-purple-1000 border-b-2 border-miru-han-purple-1000";

  const [renderTabData, setRenderTabData] = useState<any>(null);
  const [tabClassName, setTabClassName] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<any>(null);
  const navigate = useNavigate();
  const { candidateId } = useParams();

  const PATHS = {
    summary: `/recruitment/candidates/${candidateId}`,
    timelines: `/recruitment/candidates/${candidateId}/timelines`,
  };

  useEffect(() => {
    if (candidateId) setActiveTabKey();
  }, [location.pathname]);

  const setActiveTabKey = useCallback(async () => {
    if (candidateId) {
      const filterPath = ["summary", "timelines"].filter((key, _index) => (location.pathname.replace(/\/+$/, "") === PATHS[key]));
      if (filterPath[0]) {
        setActiveTab(filterPath[0]);
        return null;
      }
    }
  }, [candidateId]);

  useEffect(() => {
    if (activeTab === "summary"){
      setForItem("summary");
      setTabClassName({
        summaryTab: activeClassName,
        timelinesTab: defaultClassName,
      });
      setRenderTabData(<Summary
        candidateDetails={candidateDetails}
        setCandidateDetails={setCandidateDetails}
        isEdit={isEdit}
        setFormRef={setFormRef} />);
    } else if (activeTab === "timelines"){
      setForItem("timelines");
      setTabClassName({
        summaryTab: defaultClassName,
        timelinesTab: activeClassName,
      });
      setRenderTabData(<Timelines candidateDetails={candidateDetails} />);
    }
  }, [activeTab, candidateDetails, isEdit]);

  const handleTabChange = (key: string) => {
    const path = PATHS[key];

    if (location.pathname.replace(/\/+$/, "") !== path) {
      navigate(path);
    }
    setIsEdit(false)
  };

  return (
    <>
      <div className="flex flex-col">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <ul className="flex flex-wrap -mb-px text-sm font-medium text-center text-gray-500 dark:text-gray-400">
            <li className="mr-3">
              <button className={tabClassName ? tabClassName.summaryTab : activeClassName} onClick={() => handleTabChange('summary')} >
                SUMMARY
              </button>
            </li>
            <li className="mr-3">
              <button className={tabClassName ? tabClassName.timelinesTab : defaultClassName} onClick={() => handleTabChange('timelines')} >
                TIMELINES
              </button>
            </li>
          </ul>
        </div>
        {''}
        {renderTabData ? renderTabData : <Summary
          candidateDetails={candidateDetails}
          setCandidateDetails={setCandidateDetails}
          isEdit={isEdit}
          setFormRef={setFormRef} />}
      </div>
    </>
  );
};

export default Tab;
