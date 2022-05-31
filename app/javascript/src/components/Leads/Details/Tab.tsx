import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import LineItems from "./../LineItems";
import Quotes from "./../Quotes";
import DetailsContent from "./DetailsContent";
import SummaryContent from "./SummaryContent";

const Tab = ({ leadDetails }) => {

  const defaultClassName = "inline-flex p-4 rounded-t-lg border-b-2 border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300 group";
  const activeClassName = "inline-flex p-4 text-blue-600 rounded-t-lg border-b-2 border-blue-600 active dark:text-blue-500 dark:border-blue-500 group";

  const [renderTabData, setRenderTabData] = useState<any>(null);
  const [tabClassName, setTabClassName] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<any>(null);
  const navigate = useNavigate();
  const { leadId } = useParams();
  const [activeTab, setActiveTab] = useState<string>("");

  useEffect(() => {
    if (activeTab === ""){
      setActiveTab("summary");
    }
  }, []);

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

  const handleTabChange = (activeItem) => {
    if (activeItem) {
      setActiveTab(activeItem)
    }
    switch (activeItem) {
      case "lineItems":
        navigate(`/leads/${leadId}/line-items`);
        break
      case "quotes":
        navigate(`/leads/${leadId}/quotes`);
        break
      default:
        break
    }

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
