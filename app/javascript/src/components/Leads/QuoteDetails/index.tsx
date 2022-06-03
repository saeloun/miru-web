import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { setAuthHeaders, registerIntercepts } from "apis/axios";
import leadQuotes from "apis/lead-quotes";
import Header from "./Header";
import Tab from "../../../components/Leads/Details/Tab";
import { TOASTER_DURATION } from "../../../constants/index";
import { unmapLeadQuoteDetails } from "../../../mapper/lead.quote.mapper";

const LeadList = () => {

  const [leadDetails, setLeadDetails] = useState<any>({});
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
  }, [leadId]);

  return (
    <>
      <ToastContainer autoClose={TOASTER_DURATION} />
      <Header leadDetails={leadDetails} />
      <Tab leadDetails={leadDetails} forItem="quoteDetails" quoteId={quoteId} />
    </>
  );
};

export default LeadList;
