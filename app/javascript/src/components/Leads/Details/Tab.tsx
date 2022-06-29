import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import LineItems from "./../LineItems";
import Quotes from "./../Quotes";
import Timelines from "./../Timelines";
import Summary from "./Summary";
import LineItemTable from "../../../components/Leads/QuoteDetails/LineItemTable";

const Tab = ({
  leadDetails,
  setLeadDetails,
  forItem,
  quoteId,
  setForItem,
  isEdit,
  setIsEdit,
  setFormRef }) => {
  // const defaultClassName = "inline-flex p-4 rounded-t-lg border-b-2 border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300 group";
  // const activeClassName = "inline-flex p-4 text-blue-600 rounded-t-lg border-b-2 border-blue-600 active dark:text-blue-500 dark:border-blue-500 group";

  const defaultClassName = "mr-10 text-base tracking-widest font-medium text-miru-han-purple-600";
  const activeClassName = "mr-10 text-base tracking-widest font-bold text-miru-han-purple-1000 border-b-2 border-miru-han-purple-1000";

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
      if (quoteId){
        setActiveTab('quotes');
        return null;
      } else {
        const path = {
          summary: `/leads/${leadId}`,
          timelines: `/leads/${leadId}/timelines`,
          lineItems: `/leads/${leadId}/line-items`,
          quotes: `/leads/${leadId}/quotes`,
        };
        const filterPath = Object.keys(path).filter((key, _index) => (location.pathname === path[key]));
        if (filterPath[0]) {
          setActiveTab(filterPath[0]);
          return null;
        }
      }
    }
  }, [leadId]);

  useEffect(() => {
    if (activeTab === "summary"){
      setForItem("summary");
      setTabClassName({
        summaryTab: activeClassName,
        timelinesTab: defaultClassName,
        lineItemsTab: defaultClassName,
        quotesTab: defaultClassName
      });
      setRenderTabData(<Summary
        leadDetails={leadDetails}
        setLeadDetails={setLeadDetails}
        isEdit={isEdit}
        setFormRef={setFormRef} />);
    } else if (activeTab === "timelines"){
      setForItem("timelines");
      setTabClassName({
        summaryTab: defaultClassName,
        timelinesTab: activeClassName,
        lineItemsTab: defaultClassName,
        quotesTab: defaultClassName
      });
      setRenderTabData(<Timelines leadDetails={leadDetails} />);
    } else if (activeTab === "lineItems"){
      setForItem("lineItems");
      setTabClassName({
        summaryTab: defaultClassName,
        timelinesTab: defaultClassName,
        lineItemsTab: activeClassName,
        quotesTab: defaultClassName
      });
      setRenderTabData(<LineItems leadDetails={leadDetails} />);
    } else if (activeTab === "quotes"){
      setTabClassName({
        summaryTab: defaultClassName,
        timelinesTab: defaultClassName,
        lineItemsTab: defaultClassName,
        quotesTab: activeClassName
      });
      if (forItem == 'quoteDetails'){
        setRenderTabData(<LineItemTable />);
      } else {
        setForItem("quotes");
        setRenderTabData(<Quotes leadDetails={leadDetails} />);
      }
    }
  }, [activeTab, leadDetails]);

  const handleTabChange = (key) => {
    const path = {
      summary: `/leads/${leadId}`,
      timelines: `/leads/${leadId}/timelines`,
      lineItems: `/leads/${leadId}/line-items`,
      quotes: `/leads/${leadId}/quotes` + (quoteId ? `/${quoteId}` : ``),
    }[key];

    if (location.pathname !== path) {
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
                TIMELINEs
              </button>
            </li>
            <li className="mr-3">
              <button className={tabClassName ? tabClassName.lineItemsTab : defaultClassName} onClick={() => handleTabChange('lineItems')} >
                LINE ITEMS
              </button>
            </li>
            <li className="mr-3">
              <button className={tabClassName ? tabClassName.quotesTab : defaultClassName} onClick={() => handleTabChange('quotes')} >
                QUOTES
              </button>
            </li>
          </ul>
        </div>
        {renderTabData ? renderTabData : <Summary
          leadDetails={leadDetails}
          setLeadDetails={setLeadDetails}
          isEdit={isEdit}
          setFormRef={setFormRef} />}
      </div>
    </>
  );
};

export default Tab;
