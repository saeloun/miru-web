import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { setAuthHeaders, registerIntercepts } from "apis/axios";
import leads from "apis/leads";
import Header from "./Header";
import LeadSettings from "./LeadSettings";
import Tab from "./Tab";
import { TOASTER_DURATION } from "../../../constants/index";
import { unmapLeadDetails } from "../../../mapper/lead.mapper";

const LeadList = () => {
  const [leadDetails, setLeadDetails] = useState<any>({});
  const { leadId } = useParams();
  const [showLeadSetting, setShowLeadSetting] = useState<boolean>(false);

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
    <React.Fragment>
      <ToastContainer autoClose={TOASTER_DURATION} />
      <Header leadDetails={leadDetails} setShowLeadSetting={setShowLeadSetting} />
      <Tab leadDetails={leadDetails} forItem="leads" quoteId={null} />
      {showLeadSetting && (
        <LeadSettings leadDetails={leadDetails} setShowLeadSetting={setShowLeadSetting} />
      )}
    </React.Fragment>
  );
};

export default LeadList;
