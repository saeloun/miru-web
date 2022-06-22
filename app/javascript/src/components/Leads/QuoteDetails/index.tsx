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
      <Header leadDetails={leadInfo} setShowLeadSetting={setShowLeadSetting} handleSubmit={null} forItem="quoteDetails" apiError={null} />
      <Tab leadDetails={leadDetails} forItem="quoteDetails"
        quoteId={quoteId}
        setTitle={null}
        setFirstName={null}
        setLastName={null}
        setEmail={null}
        setBudgetAmount={null}
        setDescription={null}
        setAddress={null}
        setSkypeId={null}
        setLinkedinId={null}
        setEmails={null}
        setMobilePhone={null}
        setTelePhone={null}
        setDoNotEmail={null}
        setDoNotBulkEmail={null}
        setDoNotFax={null}
        setDoNotPhone={null}
        setBudgetStatusCode={null}
        setIndustryCode={null}
        setNeed={null}
        setPreferredContactMethodCode={null}
        setInitialCommunication={null}
        setSourceCode={null}
        setCountry={null}
        setTechStacks={null}
        handleSubmit={null}
        setForItem="quoteDetails" />
      {showLeadSetting && (
        <LeadSettings leadDetails={leadInfo} setLeadDetails={setLeadDetails} setShowLeadSetting={setShowLeadSetting} />
      )}
    </React.Fragment>
  );
};

export default LeadList;
