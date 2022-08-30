import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import CandidateList from "./Candidate";
import ConsultancyList from "./Consultancy";

const Tab = ({ isAdminUser }) => {

  // const defaultClassName = "inline-flex p-4 rounded-t-lg border-b-2 border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300 group";
  // const activeClassName = "inline-flex p-4 text-blue-600 rounded-t-lg border-b-2 border-blue-600 active dark:text-blue-500 dark:border-blue-500 group";

  const defaultClassName = "mr-10 text-base tracking-widest font-medium text-miru-han-purple-600";
  const activeClassName = "mr-10 text-base tracking-widest font-bold text-miru-han-purple-1000 border-b-2 border-miru-han-purple-1000";

  const [renderTabData, setRenderTabData] = useState<any>(null);
  const [tabClassName, setTabClassName] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setActiveTabKey();
  }, [location.pathname]);

  const setActiveTabKey = useCallback(async () => {
    const path = {
      consultancies: `/recruitments/consultancies`,
      candidates: `/recruitments/candidates`
    };
    const filterPath = ['consultancies', 'candidates'].filter((key, _index) => (location.pathname === path[key]));
    if (filterPath[0]) {
      setActiveTab(filterPath[0]);
      return null;
    }
  }, []);

  useEffect(() => {
    if (activeTab === "consultancies"){
      setTabClassName({
        consultanciesTab: activeClassName,
        candidatesTab: defaultClassName
      });
      setRenderTabData(<ConsultancyList isAdminUser={isAdminUser} />);
    } else if (activeTab === "candidates"){
      setTabClassName({
        consultanciesTab: defaultClassName,
        candidatesTab: activeClassName
      });
      setRenderTabData(<CandidateList isAdminUser={isAdminUser} />);
    }
  }, [activeTab]);

  const handleTabChange = (key) => {
    const path = {
      consultancies: `/recruitments/consultancies`,
      candidates: `/recruitments/candidates`
    }[key];

    if (location.pathname !== path) {
      navigate(path);
    }
  };

  return (
    <>
      <div className="flex flex-col mt-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <ul className="flex flex-wrap -mb-px text-sm font-medium text-center text-gray-500 dark:text-gray-400">
            <li className="mr-3">
              <button className={tabClassName ? tabClassName.consultanciesTab : activeClassName} onClick={() => handleTabChange('consultancies')} >
                CONSULTANCIES
              </button>
            </li>
            <li className="mr-3">
              <button className={tabClassName ? tabClassName.candidatesTab : defaultClassName} onClick={() => handleTabChange('candidates')} >
                CANDIDATES
              </button>
            </li>
          </ul>
        </div>
        {renderTabData ? renderTabData : <ConsultancyList isAdminUser={isAdminUser} />}
      </div>
    </>
  );
};

export default Tab;
