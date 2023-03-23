import React, { useState } from "react";

import Steps from "rc-steps";
import "rc-steps/assets/index.css";
import { ToastContainer } from "react-toastify";

import companiesApi from "apis/companies";
import { Paths, TOASTER_DURATION } from "constants/index";

import CompanyDetailsForm from "./CompanyDetailsForm";
import { CompanyDetailsFormValues } from "./CompanyDetailsForm/interface";
import { companyDetailsFormInitialValues } from "./CompanyDetailsForm/utils";
import FinancialDetailsForm from "./FinancialDetailsForm";
import { FinancialDetailsFormValues } from "./FinancialDetailsForm/interface";
import { financialDetailsFormInitialValues } from "./FinancialDetailsForm/utils";
import Step from "./Step";
import { organizationSetupSteps, TOTAL_NUMBER_OF_STEPS } from "./utils";

const OrganizationSetup = () => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [stepNoOfLastSubmittedForm, setStepNoOfLastSubmittedForm] =
    useState<number>(0);

  const [companyDetails, setCompanyDetails] =
    useState<CompanyDetailsFormValues>(companyDetailsFormInitialValues);

  const [financialDetails, setFinancialDetails] =
    useState<FinancialDetailsFormValues>(financialDetailsFormInitialValues);

  const onNextBtnClick = (companyDetails: CompanyDetailsFormValues) => {
    const nextStepNo = currentStep + 1;
    setStepNoOfLastSubmittedForm(currentStep);
    setCurrentStep(nextStepNo);
    setCompanyDetails(companyDetails);
  };

  const generatePayload = (
    companyDetails: CompanyDetailsFormValues,
    financialDetails: FinancialDetailsFormValues
  ) => {
    const formD = new FormData();
    const addressForm = {
      address_line_1: companyDetails.address_line_1,
      address_line_2: companyDetails.address_line_2,
      state: companyDetails.state?.value,
      city: companyDetails.city?.value,
      country: companyDetails.country?.value,
      pin: companyDetails.zipcode,
    };
    const addressessAttributes = [addressForm];

    formD.append("company[name]", companyDetails.company_name);
    formD.append("company[business_phone]", companyDetails.business_phone);
    formD.append("company[country]", companyDetails.country?.value);
    formD.append(
      "company[base_currency]",
      financialDetails.base_currency?.value || ""
    );

    formD.append(
      "company[standard_price]",
      financialDetails.standard_rate.toString()
    );

    formD.append(
      "company[addresses_attributes]",
      JSON.stringify(addressessAttributes)
    );

    // formD.append(
    //   "company[addresses_attributes][address_line_1]",
    //   companyDetails.address_line_1
    // );

    // formD.append(
    //   "company[addresses_attributes][address_line_2]",
    //   companyDetails.address_line_2
    // );

    // formD.append(
    //   "company[addresses_attributes][state]",
    //   companyDetails.state?.value
    // );

    // formD.append(
    //   "company[addresses_attributes][city]",
    //   companyDetails.city?.value
    // );

    // formD.append(
    //   "company[addresses_attributes][country]",
    //   companyDetails.country?.value
    // );
    // formD.append("company[addresses_attributes][pin]", companyDetails.zipcode);

    formD.append("company[fiscal_year_end]", financialDetails.year_end?.value);
    formD.append("company[date_format]", financialDetails.date_format?.value);
    formD.append("company[timezone]", companyDetails.timezone?.value);
    if (companyDetails.logo) {
      formD.append("company[logo]", companyDetails.logo);
    }

    // const company = {
    //   company: {
    //     name: companyDetails.company_name,
    //     // address: "test address",
    //     business_phone: companyDetails.business_phone,
    //     country: companyDetails.country?.value,
    //     timezone: companyDetails.timezone?.value,
    //     base_currency: financialDetails.base_currency?.value || "",
    //     standard_price: financialDetails.standard_rate.toString(),
    //     fiscal_year_end: financialDetails.year_end?.value,
    //     date_format: financialDetails.date_format?.value,
    //     addresses_attributes: addressessAttributes,
    //     logo: URL.createObjectURL(companyDetails.logo)
    //   }
    // }

    return formD;
  };

  const onSaveBtnClick = async (
    financialDetails: FinancialDetailsFormValues
  ) => {
    setStepNoOfLastSubmittedForm(currentStep);
    const payload = generatePayload(companyDetails, financialDetails);
    const res = await companiesApi.create(payload);
    if (res?.status == 200) {
      window.location.href = Paths.TIME_TRACKING;
    }
  };

  const updateStepNumber = (stepNo: number) => {
    if (isStepFormSubmittedOrVisited(stepNo)) {
      setCurrentStep(stepNo);
    }
  };

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

  return (
    <>
      <ToastContainer autoClose={TOASTER_DURATION} />
      <div className="w-full px-8 pt-16 pb-4 md:px-0 md:pt-28">
        <div className="org-setup-form-wrapper mx-auto min-h-full md:w-1/2 lg:w-352">
          <h1 className="text-center font-manrope text-4.75xl font-extrabold not-italic text-miru-han-purple-1000">
            Setup Org
          </h1>
          <div className="mx-auto mt-6 mb-11 w-full">
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
          {currentStep == 1 ? (
            <CompanyDetailsForm
              isFormAlreadySubmitted={stepNoOfLastSubmittedForm >= 1}
              previousSubmittedValues={companyDetails}
              onNextBtnClick={onNextBtnClick}
            />
          ) : (
            <FinancialDetailsForm
              isUpdatedFormValues={stepNoOfLastSubmittedForm >= 1}
              prevFormValues={financialDetails}
              setFinancialDetails={setFinancialDetails}
              onSaveBtnClick={onSaveBtnClick}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default OrganizationSetup;
