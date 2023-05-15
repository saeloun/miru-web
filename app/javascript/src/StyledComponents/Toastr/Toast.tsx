import React from "react";

const Toast = ({ message, buttonLabel = "" }) => (
  <div>
    <p>{message}</p>
    {buttonLabel && (
      <div className="toastr-message-container__btn-wrapper">
        <button
          onClick={e => {
            e.stopPropagation();
          }}
        >
          {buttonLabel}
        </button>
      </div>
    )}
  </div>
);

export default Toast;
