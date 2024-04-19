import React, { useState } from "react";

import { XIcon } from "miruIcons";
import Steps from "rc-steps";
import { Button, Toastr } from "StyledComponents";

import clientApi from "apis/clients";

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
    subject: "Reminder to complete payments for unpaid invoices",
    message:
      "This is a gentle reminder to complete payments for the following invoices. You can find the respective payment links along with the invoice details given below",
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
      <div className="flex w-full bg-miru-han-purple-1000 pl-4">
        <div className="flex h-12 w-full items-center justify-center bg-miru-han-purple-1000 px-3 text-white">
          Send Payment Reminder
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
        <div className="flex w-full items-center justify-between bg-miru-gray-100 p-3">
          <small>
            {selectedInvoices.length > 1
              ? `${selectedInvoices.length} invoices selected`
              : `${selectedInvoices.length} invoice selected`}
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
            Continue
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
            Back
          </Button>
          <Button
            className="w-2/5 py-2 px-2/100 text-base"
            disabled={selectedInvoices.length < 1}
            style="primary"
            onClick={() => {
              handleSendReminder();
            }}
          >
            Send Reminder
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
