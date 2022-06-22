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
  const [apiError, setApiError] = useState<string>("");
  const [forItem, setForItem] = useState<string>("summary");
  const [isEdit, setIsEdit] = useState<boolean>(false);

  const [title, setTitle] = useState<any>(null);
  const [firstName, setFirstName] = useState<any>(null);
  const [lastName, setLastName] = useState<any>(null);
  const [email, setEmail] = useState<any>(null);
  const [budgetAmount, setBudgetAmount] = useState<any>(null);
  const [description, setDescription] = useState<any>(null);
  const [address, setAddress] = useState<any>(null);

  const [skypeId, setSkypeId] = useState<any>(null);
  const [linkedinId, setLinkedinId] = useState<any>(null);
  const [emails, setEmails] = useState<any>(null);
  const [mobilePhone, setMobilePhone] = useState<any>(null);
  const [telePhone, setTelePhone] = useState<any>(null);

  const [donotEmail, setDoNotEmail] = useState<any>(null);
  const [doNotBulkSmail, setDoNotBulkEmail] = useState<any>(null);
  const [doNotFax, setDoNotFax] = useState<any>(null);
  const [doNotPhone, setDoNotPhone] = useState<any>(null);

  const [budgetStatusCode, setBudgetStatusCode] = useState<any>(null);
  const [industryCode, setIndustryCode] = useState<any>(null);
  const [need, setNeed] = useState<any>(null);
  const [preferredContactMethodCode, setPreferredContactMethodCode] = useState<any>(null);
  const [initialCommunication, setInitialCommunication] = useState<any>(null);
  const [sourceCode, setSourceCode] = useState<any>(null);
  const [country, setCountry] = useState<any>(null);
  const [techStacks, setTechStacks] = useState<any>(null);

  useEffect(() => {
    setAuthHeaders();
    registerIntercepts();
    leads.show(leadId)
      .then((res) => {
        const sanitized = unmapLeadDetails(res);
        setLeadDetails(sanitized.leadDetails);
      });
  }, [leadId, isEdit]);

  const handleSubmit = async () => {

    await leads.update(leadDetails.id, {
      lead: {
        "title": title,
        "first_name": firstName,
        "last_name": lastName,
        "email": email,
        "budget_amount": budgetAmount,
        "description": description,
        "budget_status_code": budgetStatusCode,
        "industry_code": industryCode,
        "donotemail": donotEmail,
        "donotbulkemail": doNotBulkSmail,
        "donotfax": doNotFax,
        "donotphone": doNotPhone,
        "need": need,
        "preferred_contact_method_code": preferredContactMethodCode,
        "initial_communication": initialCommunication,
        "source_code": sourceCode,
        "address": address,
        "country": country,
        "skypeid": skypeId,
        "linkedinid": linkedinId,
        "emails": emails,
        "mobilephone": mobilePhone,
        "telephone": telePhone,
        "tech_stack_ids": techStacks.map(Number)
      }
    }).then((res) => {
      setLeadDetails(unmapLeadDetails(res).leadDetails);
    }).catch((e) => {
      setApiError(e.message);
    });
  };

  return (
    <React.Fragment>
      <ToastContainer autoClose={TOASTER_DURATION} />
      <Header leadDetails={leadDetails} setShowLeadSetting={setShowLeadSetting} handleSubmit={handleSubmit} forItem={forItem} apiError={apiError} isEdit={isEdit} setIsEdit={setIsEdit} />
      <Tab leadDetails={leadDetails} forItem="leads"
        quoteId={null}
        setTitle={setTitle}
        setFirstName={setFirstName}
        setLastName={setLastName}
        setEmail={setEmail}
        setBudgetAmount={setBudgetAmount}
        setDescription={setDescription}
        setAddress={setAddress}
        setSkypeId={setSkypeId}
        setLinkedinId={setLinkedinId}
        setEmails={setEmails}
        setMobilePhone={setMobilePhone}
        setTelePhone={setTelePhone}
        setDoNotEmail={setDoNotEmail}
        setDoNotBulkEmail={setDoNotBulkEmail}
        setDoNotFax={setDoNotFax}
        setDoNotPhone={setDoNotPhone}
        setBudgetStatusCode={setBudgetStatusCode}
        setIndustryCode={setIndustryCode}
        setNeed={setNeed}
        setPreferredContactMethodCode={setPreferredContactMethodCode}
        setInitialCommunication={setInitialCommunication}
        setSourceCode={setSourceCode}
        setCountry={setCountry}
        setTechStacks={setTechStacks}
        handleSubmit={handleSubmit}
        setForItem={setForItem}
        isEdit={isEdit} />
      {showLeadSetting && (
        <LeadSettings leadDetails={leadDetails} setLeadDetails={setLeadDetails} setShowLeadSetting={setShowLeadSetting} />
      )}
    </React.Fragment>
  );
};

export default LeadList;
