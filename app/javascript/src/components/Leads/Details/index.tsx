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
  const [forItem, setForItem] = useState<string>("summary");
  const [isEdit, setIsEdit] = useState<boolean>(false);

  const [formRef, setFormRef]  = useState<any>(React.createRef());

  useEffect(() => {
    setAuthHeaders();
    registerIntercepts();
    leads.show(leadId)
      .then((res) => {
        const sanitized = unmapLeadDetails(res);
        setLeadDetails(sanitized.leadDetails);
      });
  }, [leadId, isEdit]);

  const submitLeadForm = () => {
    formRef.dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true })
    )
  };

  const resetLeadForm = () => {
    formRef.dispatchEvent(
      new Event("reset", { bubbles: true, cancelable: true })
    )
  };

  return (
    <React.Fragment>
      <ToastContainer autoClose={TOASTER_DURATION} />
      <Header leadDetails={leadDetails} setShowLeadSetting={setShowLeadSetting} submitLeadForm={submitLeadForm} resetLeadForm={resetLeadForm} forItem={forItem} isEdit={isEdit} setIsEdit={setIsEdit} />
      <Tab
        leadDetails={leadDetails}
        setLeadDetails={setLeadDetails}
        forItem="leads"
        quoteId={null}
        setForItem={setForItem}
        isEdit={isEdit}
        setIsEdit={setIsEdit}
        setFormRef={setFormRef} />
      {showLeadSetting && (
        <LeadSettings leadDetails={leadDetails} setLeadDetails={setLeadDetails} setShowLeadSetting={setShowLeadSetting} />
      )}
    </React.Fragment>
  );
};

export default LeadList;
