import React, { useState } from "react";

import { clientApi } from "apis/api";
import { XIcon } from "miruIcons";
import Steps from "rc-steps";
import { Button, Toastr } from "StyledComponents";
import { i18n } from "../../../../../i18n";

import MobileTable from "./MobileTable";

import EmailPreview from "../EmailPreview";
import Step from "../Step";
import { TOTAL_NUMBER_OF_STEPS, organizationSetupSteps } from "../utils";

const MobilePaymentReminder = ({
  setSendPaymentReminder,
  client,
  clientInvoices,
  isDesktop,
}) => {
  const invoiceStatus = ["overdue", "viewed", "sent"];
  const invoices = clientInvoices.filter(invoice =>
    invoiceStatus.includes(invoice.status)
  );

  const sortByStatus = (a, b) => {
    const statusAIndex = invoiceStatus.indexOf(a.status);
    const statusBIndex = invoiceStatus.indexOf(b.status);

    return statusAIndex - statusBIndex;
  };

  const [selectedInvoices, setSelectedInvoices] = useState<any[]>(
    invoices
      .sort(sortByStatus)
      .filter(invoice => invoice.status === "overdue")
      .map(invoice => invoice.id)
  );
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [stepNoOfLastSubmittedForm, setStepNoOfLastSubmittedForm] =
    useState<number>(0);

  const [emailParams, setEmailParams] = useState<SendPaymentReminderEmail>({
    subject: i18n.t("clients.paymentReminderSubject"),
    message: i18n.t("clients.paymentReminderMessage"),
    recipients: client.clientMembersEmails,
  });

  const isStepFormSubmittedOrVisited = stepNo => {
    if (stepNo == currentStep) {
      return true;
    }

    return (
      stepNo <= TOTAL_NUMBER_OF_STEPS &&
      stepNo > 0 &&
      stepNo <= stepNoOfLastSubmittedForm
    );
  };

  const updateStepNumber = (stepNo: number) => {
    if (isStepFormSubmittedOrVisited(stepNo)) {
      setCurrentStep(stepNo);
    }
  };

  const onNextBtnClick = () => {
    const nextStepNo = currentStep + 1;
    setStepNoOfLastSubmittedForm(currentStep);
    setCurrentStep(nextStepNo);
  };

  const renderSelectedForm = () => {
    // render invoices list
    if (currentStep === 1) {
      return (
        <MobileTable
          invoices={invoices}
          selectedInvoices={selectedInvoices}
          setSelectedInvoices={setSelectedInvoices}
        />
      );
    }

    // render email preview
    return (
      <EmailPreview
        emailParams={emailParams}
        invoices={invoices}
        isDesktop={isDesktop}
        selectedInvoices={selectedInvoices}
        setEmailParams={setEmailParams}
      />
    );
  };

  const handleSendReminder = async () => {
    try {
      await clientApi.sendPaymentReminder(client.id, {
        client_email: {
          email_params: emailParams,
          selected_invoices: selectedInvoices,
        },
      });
      setSendPaymentReminder(false);
    } catch (error) {
      Toastr.error(error.message);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex w-full bg-primary pl-4">
        <div className="flex h-12 w-full items-center justify-center bg-primary px-3 text-white">
          {i18n.t("clients.sendPaymentReminder")}
        </div>
        <Button
          className="pr-4"
          style="ternary"
          onClick={() => {
            setSendPaymentReminder(false);
          }}
        >
          <XIcon className="text-white" size={16} weight="bold" />
        </Button>
      </div>
      <div className="bg-gray-100">
        <div className="mx-auto my-2 flex px-10 py-1">
          <Steps
            current={currentStep - 1}
            items={organizationSetupSteps}
            labelPlacement="horizontal"
            itemRender={props => (
              <Step
                {...props}
                isActiveStep={isStepFormSubmittedOrVisited}
                updateStepNumber={updateStepNumber}
              />
            )}
          />
        </div>
      </div>
      {renderSelectedForm()}
      {currentStep === 1 ? (
        <div className="flex w-full items-center justify-between bg-muted p-3">
          <small>
            {selectedInvoices.length > 1
              ? i18n.t("clients.invoicesSelected", {
                  count: selectedInvoices.length,
                })
              : i18n.t("clients.invoiceSelected", {
                  count: selectedInvoices.length,
                })}
          </small>
          <Button
            className="py-2 px-10 text-base"
            disabled={selectedInvoices.length < 1}
            style="primary"
            onClick={() => {
              onNextBtnClick();
              setCurrentStep(2);
            }}
          >
            {i18n.t("continue")}
          </Button>
        </div>
      ) : (
        <div className="mx-auto flex w-full justify-between py-3 px-7">
          <Button
            className="mr-4 w-2/5 py-2 px-2/100 text-base"
            disabled={selectedInvoices.length < 1}
            style="secondary"
            onClick={() => {
              setCurrentStep(1);
            }}
          >
            {i18n.t("back")}
          </Button>
          <Button
            className="w-2/5 py-2 px-2/100 text-base"
            disabled={selectedInvoices.length < 1}
            style="primary"
            onClick={() => {
              handleSendReminder();
            }}
          >
            {i18n.t("clients.sendReminder")}
          </Button>
        </div>
      )}
    </div>
  );
};

interface SendPaymentReminderEmail {
  subject: string;
  message: string;
  recipients: string[];
}

export default MobilePaymentReminder;
