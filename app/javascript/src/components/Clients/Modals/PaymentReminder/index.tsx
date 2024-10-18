import React, { useState } from "react";

import { XIcon } from "miruIcons";
import Steps from "rc-steps";
import "rc-steps/assets/index.css";
import { Button, Modal, Toastr } from "StyledComponents";

import clientApi from "apis/clients";

import EmailPreview from "./EmailPreview";
import Step from "./Step";
import Table from "./Table";
import { organizationSetupSteps, TOTAL_NUMBER_OF_STEPS } from "./utils";

const PaymentReminder = ({
  sendPaymentReminder,
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
    recipients: client.subscribedRecipients,
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

  const renderSelectedForm = () => {
    // render invoices list
    if (currentStep === 1) {
      return (
        <Table
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

  return (
    <Modal
      customStyle="sm:my-8 sm:w-full sm:max-w-lg sm:align-middle min-w-1008 relative min-h-80v"
      isOpen={sendPaymentReminder}
      onClose={() => setSendPaymentReminder(false)}
    >
      <div className="h-full" onClick={e => e.stopPropagation()}>
        <div className="flex items-center">
          <h6 className="form__title">Send Payment Reminder</h6>
          <div className="mx-auto flex w-1/3 items-center">
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
          <button
            className="text-miru-gray-1000"
            type="button"
            onClick={() => setSendPaymentReminder(false)}
          >
            <XIcon size={16} weight="bold" />
          </button>
        </div>
        {renderSelectedForm()}
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between bg-white p-4 shadow-c1">
          {currentStep === 1 ? (
            <div className="flex w-full items-center justify-between">
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
            <div className="flex w-full items-center justify-end">
              <Button
                className="mr-4 py-2 px-10 text-base"
                disabled={selectedInvoices.length < 1}
                style="secondary"
                onClick={() => {
                  setCurrentStep(1);
                }}
              >
                Back
              </Button>
              <Button
                className="py-2 px-10 text-base"
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
      </div>
    </Modal>
  );
};

interface SendPaymentReminderEmail {
  subject: string;
  message: string;
  recipients: string[];
}

export default PaymentReminder;
