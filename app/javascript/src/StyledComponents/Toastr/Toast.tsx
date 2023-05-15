import React from "react";

import Linkify from "react-linkify";

const Toast = ({ message, buttonLabel = "" }) => (
  <div>
    <Linkify
      componentDecorator={(decoratedHref, decoratedText, key) => (
        <a href={decoratedHref} key={key} rel="noreferrer" target="_blank">
          {decoratedText}
        </a>
      )}
    >
      <p>{message}</p>
    </Linkify>
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
