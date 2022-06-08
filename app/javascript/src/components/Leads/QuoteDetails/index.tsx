import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { setAuthHeaders, registerIntercepts } from "apis/axios";
import leadQuotes from "apis/lead-quotes";
import leads from "apis/leads";
import Header from "../../../components/Leads/Details/Header";
import Tab from "../../../components/Leads/Details/Tab";
import { TOASTER_DURATION } from "../../../constants/index";
import { unmapLeadDetails } from "../../../mapper/lead.mapper";
import { unmapLeadQuoteDetails } from "../../../mapper/lead.quote.mapper";

const LeadList = () => {

  const [leadDetails, setLeadDetails] = useState<any>({});
  const [leadInfo, setLeadInfo] = useState<any>({});
  const { leadId } = useParams();
  const { quoteId } = useParams();

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
    <>
      <ToastContainer autoClose={TOASTER_DURATION} />
      <Header leadDetails={leadInfo} />
      <Tab leadDetails={leadDetails} forItem="quoteDetails" quoteId={quoteId} />
    </>
  );
};

export default LeadList;
