import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { setAuthHeaders, registerIntercepts } from "apis/axios";
import leadQuotes from "apis/lead-quotes";
import leads from "apis/leads";
import Header from "../../../components/Leads/Details/Header";
import LeadSettings from "../../../components/Leads/Details/LeadSettings";
import Tab from "../../../components/Leads/Details/Tab";
import { TOASTER_DURATION } from "../../../constants/index";
import { unmapLeadDetails } from "../../../mapper/lead.mapper";
import { unmapLeadQuoteDetails } from "../../../mapper/lead.quote.mapper";

const LeadList = () => {

  const [leadDetails, setLeadDetails] = useState<any>({});
  const [leadInfo, setLeadInfo] = useState<any>({});
  const { leadId } = useParams();
  const { quoteId } = useParams();
  const [showLeadSetting, setShowLeadSetting] = useState<boolean>(false);

  useEffect(() => {
    setAuthHeaders();
    registerIntercepts();
    leadQuotes.show(leadId, quoteId, "")
      .then((res) => {
        const sanitized = unmapLeadQuoteDetails(res);
        setLeadDetails(sanitized.leadDetails);
      });
    leads.show(leadId)
      .then((res) => {
        const sanitized = unmapLeadDetails(res);
        setLeadInfo(sanitized.leadDetails);
      });
  }, [leadId]);

  return (
    <React.Fragment>
      <ToastContainer autoClose={TOASTER_DURATION} />
      <Header leadDetails={leadInfo} setShowLeadSetting={setShowLeadSetting} submitLeadForm={null} forItem="quoteDetails" isEdit={false} setIsEdit={null} />
      <Tab
        leadDetails={leadDetails}
        setLeadDetails={setLeadDetails}
        forItem="quoteDetails"
        quoteId={quoteId}
        setForItem="quoteDetails"
        isEdit={false}
        setFormRef={null} />
      {showLeadSetting && (
        <LeadSettings leadDetails={leadInfo} setLeadDetails={setLeadDetails} setShowLeadSetting={setShowLeadSetting} />
      )}
    </React.Fragment>
  );
};

export default LeadList;
