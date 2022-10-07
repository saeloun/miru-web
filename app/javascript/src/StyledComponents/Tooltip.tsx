import React, { useState } from "react";

const Tooltip = (props) => {
  let timeout;
  const [active, setActive] = useState<boolean>(false);

  const showTip = () => {
    timeout = setTimeout(() => {
      setActive(true);
    }, props.delay || 400);
  };

  const hideTip = () => {
    clearInterval(timeout);
    setActive(false);
  };

  return (
    <div
      className="Tooltip__Wrapper"
      onMouseEnter={showTip}
      onMouseLeave={hideTip}
    >
      {props.children}
      {active && (
        <div className={`Tooltip__Tip ${props.placeBottom ? "bottom" : "top"}`}>
          {props.content}
        </div>
      )}
    </div>
  );
};

export default Tooltip;
