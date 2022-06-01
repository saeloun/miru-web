import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import LineItems from "./../LineItems";
import Quotes from "./../Quotes";
import Summary from "./Summary";

const Tab = ({ leadDetails }) => {

  const defaultClassName = "inline-flex p-4 rounded-t-lg border-b-2 border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300 group";
  const activeClassName = "inline-flex p-4 text-blue-600 rounded-t-lg border-b-2 border-blue-600 active dark:text-blue-500 dark:border-blue-500 group";

  const [renderTabData, setRenderTabData] = useState<any>(null);
  const [tabClassName, setTabClassName] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<any>(null);
  const navigate = useNavigate();
  const { leadId } = useParams();

  useEffect(() => {
    if (leadId) setActiveTabKey();
  }, [location.pathname]);

  const setActiveTabKey = useCallback(async () => {
    if (leadId) {
      const path = {
        summary: `/leads/${leadId}`,
        lineItems: `/leads/${leadId}/line-items`,
        quotes: `/leads/${leadId}/quotes`,
      };
      const filterPath = Object.keys(path).filter((key, _index) => (location.pathname === path[key]));
      if (filterPath[0]) {
        setActiveTab(filterPath[0]);
        return null;
      }
    }
  }, [leadId]);

  useEffect(() => {
    if (activeTab === "summary"){
      setTabClassName({
        summaryTab: activeClassName,
        detailsTab: defaultClassName,
        lineItemsTab: defaultClassName,
        quotesTab: defaultClassName
      });
      setRenderTabData(<Summary leadDetails={leadDetails} />);
    } else if (activeTab === "lineItems"){
      setTabClassName({
        summaryTab: defaultClassName,
        detailsTab: defaultClassName,
        lineItemsTab: activeClassName,
        quotesTab: defaultClassName
      });
      setRenderTabData(<LineItems leadDetails={leadDetails} />);
    } else if (activeTab === "quotes"){
      setTabClassName({
        summaryTab: defaultClassName,
        detailsTab: defaultClassName,
        lineItemsTab: defaultClassName,
        quotesTab: activeClassName
      });
      setRenderTabData(<Quotes leadDetails={leadDetails} />);
    }
  }, [activeTab, leadDetails]);

  const handleTabChange = (key) => {
    const path = {
      summary: `/leads/${leadId}`,
      lineItems: `/leads/${leadId}/line-items`,
      quotes: `/leads/${leadId}/quotes`,
    }[key];

    if (location.pathname !== path) {
      navigate(path);
    }

    // switch (activeItem) {
    //   case "lineItems":
    //     navigate(`/leads/${leadId}/line-items`);
    //     break
    //   case "quotes":
    //     navigate(`/leads/${leadId}/quotes`);
    //     break
    //   default:
    //     break
    // }
  };

  return (
    <>
      <div className="flex flex-col">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <ul className="flex flex-wrap -mb-px text-sm font-medium text-center text-gray-500 dark:text-gray-400">
            <li className="mr-3">
              <button className={tabClassName ? tabClassName.summaryTab : activeClassName} onClick={() => handleTabChange('summary')} >
              Summary
              </button>
            </li>
            <li className="mr-3">
              <button className={tabClassName ? tabClassName.lineItemsTab : defaultClassName} onClick={() => handleTabChange('lineItems')} >
              Line Items
              </button>
            </li>
            <li className="mr-3">
              <button className={tabClassName ? tabClassName.quotesTab : defaultClassName} onClick={() => handleTabChange('quotes')} >
              Quotes
              </button>
            </li>
          </ul>
        </div>
        {renderTabData ? renderTabData : <Summary leadDetails={leadDetails} />}
      </div>
    </>
  );
};

export default Tab;
