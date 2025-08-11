import React, { useState } from "react";

import Steps from "rc-steps";
import "rc-steps/assets/index.css";
import { useNavigate } from "react-router-dom";
import companiesApi from "apis/companies";
import MiruLogoWatermark from "common/MiruLogoWatermark";

import { Paths } from "constants/index";

import { useUserContext } from "context/UserContext";

import CompanyDetailsForm from "./CompanyDetailsForm";
import { CompanyDetailsFormValues } from "./CompanyDetailsForm/interface";
import { companyDetailsFormInitialValues } from "./CompanyDetailsForm/utils";
import FinancialDetailsForm from "./FinancialDetailsForm";
import { FinancialDetailsFormValues } from "./FinancialDetailsForm/interface";
import MobileFinancialDetailForm from "./FinancialDetailsForm/MobileFinancialDetailForm";
import { financialDetailsFormInitialValues } from "./FinancialDetailsForm/utils";
import Step from "./Step";
import { organizationSetupSteps, TOTAL_NUMBER_OF_STEPS } from "./utils";

import Toastr from "../../StyledComponents/Toastr";

const OrganizationSetup = () => {
  const navigate = useNavigate();
  const { isDesktop } = useUserContext();

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

    formD.append(
      "company[addresses_attributes][0][address_line_1]",
      companyDetails.address_line_1
    );

    formD.append(
      "company[addresses_attributes][0][address_line_2]",
      companyDetails.address_line_2
    );

    formD.append(
      "company[addresses_attributes][0][state]",
      companyDetails.state
    );

    formD.append("company[addresses_attributes][0][city]", companyDetails.city);

    formD.append(
      "company[addresses_attributes][0][country]",
      companyDetails.country?.value
    );

    formD.append(
      "company[addresses_attributes][0][pin]",
      companyDetails.zipcode
    );

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

    formD.append("company[fiscal_year_end]", financialDetails.year_end?.value);
    formD.append("company[date_format]", financialDetails.date_format?.value);
    formD.append("company[timezone]", companyDetails.timezone?.value);
    if (companyDetails.logo) {
      formD.append("company[logo]", companyDetails.logo);
    }
    formD.append("company[working_hours]", financialDetails.working_hours);
    formD.append("company[working_days]", financialDetails.working_days);

    return formD;
  };

  const onSaveBtnClick = async (
    financialDetails: FinancialDetailsFormValues
  ) => {
    setStepNoOfLastSubmittedForm(currentStep);
    const payload = generatePayload(companyDetails, financialDetails);

    try {
      const res = await companiesApi.create(payload);
      if (res?.status == 200) {
        navigate(Paths.SIGNUP_SUCCESS);
      }
    } catch (error) {
      const { errors, error: err, notice } = error?.response?.data || {};
      const errorMessage = errors || err || notice;

      Toastr.error(errorMessage);
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
    <div
      className={`relative ${
        currentStep == 1 ? "min-h-screen" : "h-screen"
      } w-full px-8 ${isDesktop ? "pt-16" : "pt-8"} pb-4 md:px-0 md:pt-28`}
    >
      <div className="org-setup-form-wrapper mx-auto h-full md:w-1/2 lg:w-352">
        {isDesktop ? (
          <h1 className="text-center font-manrope text-4.75xl font-extrabold not-italic text-miru-han-purple-1000">
            Setup Org
          </h1>
        ) : (
          <div className="w-full text-center font-manrope text-2xl font-extrabold not-italic text-miru-han-purple-1000">
            {" "}
            Setup Org
          </div>
        )}
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
            formType="new"
            isDesktop={isDesktop}
            isFormAlreadySubmitted={stepNoOfLastSubmittedForm >= 1}
            previousSubmittedValues={companyDetails}
            onNextBtnClick={onNextBtnClick}
          />
        ) : (
          <>
            {isDesktop ? (
              <FinancialDetailsForm
                isUpdatedFormValues={stepNoOfLastSubmittedForm >= 1}
                prevFormValues={financialDetails}
                setFinancialDetails={setFinancialDetails}
                onSaveBtnClick={onSaveBtnClick}
              />
            ) : (
              <MobileFinancialDetailForm
                isUpdatedFormValues={stepNoOfLastSubmittedForm >= 1}
                prevFormValues={financialDetails}
                setFinancialDetails={setFinancialDetails}
                onSaveBtnClick={onSaveBtnClick}
              />
            )}
          </>
        )}
      </div>
      <MiruLogoWatermark />
    </div>
  );
};

export default OrganizationSetup;
