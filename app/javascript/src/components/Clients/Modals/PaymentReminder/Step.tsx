import React, { useEffect, useState } from "react";

import { CheckCircleIcon } from "miruIcons";

const Step = (props: any) => {
  const [stepNumber, setStepNumber] = useState<number>(1);
  const { title, status, updateStepNumber, isActiveStep } = props;

  useEffect(() => {
    getStepNumber();
  }, []);

  const getStepNumber = () => {
    if (title == "Select invoices") {
      setStepNumber(1);
    } else if (title == "Email preview") {
      setStepNumber(2);
    }
  };

  const stepIsFinished = (status: string) =>
    status?.toLowerCase()?.trim() == "finish";

  return (
    <div
      className={`rc-steps-item rc-steps-item-${status} ${
        isActiveStep(stepNumber) ? "cursor-pointer" : "cursor-not-allowed"
      } whitespace-nowrap`}
      onClick={() => updateStepNumber(stepNumber)}
    >
      <div className="rc-steps-item-container">
        <div className="rc-steps-item-tail" />
        {stepIsFinished(status) ? (
          <div className="rc-steps-item-icon flex items-center justify-center md:pb-0">
            <CheckCircleIcon
              className="green-tick block"
              color="#0DA163"
              size="30"
              weight="fill"
            />
          </div>
        ) : (
          <div className="rc-steps-item-icon bg-miru-han-purple-1000">
            <span className="rc-steps-icon font-manrope">{stepNumber}</span>
          </div>
        )}
      </div>
      <div className="rc-steps-item-content">
        <div
          className={`rc-steps-item-title font-manrope text-xs md:text-sm ${
            stepIsFinished(status) ? "text-miru-chart-green-400" : ""
          }`}
        >
          {title}
        </div>
      </div>
    </div>
  );
};

export default Step;
