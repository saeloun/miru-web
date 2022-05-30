import React, { useEffect, useState } from "react";
import DetailsContent from "./DetailsContent";
import LineItemsContent from "./LineItemsContent";
import QuotesContent from "./QuotesContent";
import SummaryContent from "./SummaryContent";

const Tab = ({ leadDetails }) => {

  const defaultClassName = "inline-flex p-4 rounded-t-lg border-b-2 border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300 group";
  const activeClassName = "inline-flex p-4 text-blue-600 rounded-t-lg border-b-2 border-blue-600 active dark:text-blue-500 dark:border-blue-500 group";

  const [renderTabData, setRenderTabData] = useState<any>(null);
  const [tabClassName, setTabClassName] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<any>(null);

  useEffect(() => {
    if (activeTab === "summary"){
      setTabClassName({
        summaryTab: activeClassName,
        detailsTab: defaultClassName,
        lineItemsTab: defaultClassName,
        quotesTab: defaultClassName
      });
      setRenderTabData(<SummaryContent leadDetails={leadDetails} />);
    } else if (activeTab === "details"){
      setTabClassName({
        summaryTab: defaultClassName,
        detailsTab: activeClassName,
        lineItemsTab: defaultClassName,
        quotesTab: defaultClassName
      });
      setRenderTabData(<DetailsContent />);
    } else if (activeTab === "lineItems"){
      setTabClassName({
        summaryTab: defaultClassName,
        detailsTab: defaultClassName,
        lineItemsTab: activeClassName,
        quotesTab: defaultClassName
      });
      setRenderTabData(<LineItemsContent />);
    } else if (activeTab === "quotes"){
      setTabClassName({
        summaryTab: defaultClassName,
        detailsTab: defaultClassName,
        lineItemsTab: defaultClassName,
        quotesTab: activeClassName
      });
      setRenderTabData(<QuotesContent />);
    }
  }, [activeTab]);

  return (
    <>
      <div className="flex flex-col">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <ul className="flex flex-wrap -mb-px text-sm font-medium text-center text-gray-500 dark:text-gray-400">
            <li className="mr-3">
              <a href="#summary" className={tabClassName ? tabClassName.summaryTab : activeClassName} onClick={() => { setActiveTab("summary"); }} >
              Summary
              </a>
            </li>
            <li className="mr-3">
              <a href="#details" className={tabClassName ? tabClassName.detailsTab : defaultClassName} onClick={() => { setActiveTab("details"); }} >
              Details
              </a>
            </li>
            <li className="mr-3">
              <a href="#lineItems" className={tabClassName ? tabClassName.lineItemsTab : defaultClassName} onClick={() => { setActiveTab("lineItems"); }} >
              Line Items
              </a>
            </li>
            <li className="mr-3">
              <a href="#quotes" className={tabClassName ? tabClassName.quotesTab : defaultClassName} onClick={() => { setActiveTab("quotes"); }} >
              Quotes
              </a>
            </li>
          </ul>
        </div>
        {renderTabData ? renderTabData : <SummaryContent leadDetails={leadDetails} />}
      </div>
    </>
  );
};

export default Tab;
