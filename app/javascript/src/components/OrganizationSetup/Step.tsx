import React from "react";

import { CheckCircle } from "phosphor-react";

const Step = (props: any) => {
  const { title, status, currentStep } = props;

  const stepIsFinished = (status: string) =>
    status?.toLowerCase()?.trim() == "finish";

  return (
    <div className={`rc-steps-item rc-steps-item-${status}`}>
      <div className="rc-steps-item-container">
        <div className="rc-steps-item-tail" />
        {stepIsFinished(status) ? (
          <div className="rc-steps-item-icon flex items-center justify-center">
            <CheckCircle
              className="green-tick block"
              color="#0DA163"
              size="32"
              weight="fill"
            />
          </div>
        ) : (
          <div className="rc-steps-item-icon bg-miru-han-purple-1000">
            <span className="rc-steps-icon font-manrope">{currentStep}</span>
          </div>
        )}
      </div>
      <div className="rc-steps-item-content">
        <div
          className={`rc-steps-item-title font-manrope text-sm ${
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
