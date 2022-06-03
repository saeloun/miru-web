import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { setAuthHeaders, registerIntercepts } from "apis/axios";
import leads from "apis/leads";
import Header from "./Header";
import Tab from "./Tab";
import { TOASTER_DURATION } from "../../../constants/index";
import { unmapLeadDetails } from "../../../mapper/lead.mapper";

const LeadList = () => {
  const [leadDetails, setLeadDetails] = useState<any>({});
  const { leadId } = useParams();

  useEffect(() => {
    setAuthHeaders();
    registerIntercepts();
    leads.show(leadId)
      .then((res) => {
        const sanitized = unmapLeadDetails(res);
        setLeadDetails(sanitized.leadDetails);
      });
  }, [leadId]);

  return (
    <>
      <ToastContainer autoClose={TOASTER_DURATION} />
      <Header leadDetails={leadDetails} />
      <Tab leadDetails={leadDetails} forItem="leads" quoteId={null} />
    </>
  );
};

export default LeadList;
