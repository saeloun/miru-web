import React, { useState } from "react";

import classnames from "classnames";

const Tooltip = ({
  content,
  placeBottom = false,
  delay = 400,
  ...restprops
}) => {
  let timeout;
  const [active, setActive] = useState<boolean>(false);

  const showTip = () => {
    timeout = setTimeout(() => {
      setActive(true);
    }, delay );
  };

  const hideTip = () => {
    clearInterval(timeout);
    setActive(false);
  };

  return (
    <div
      className={classnames("block relative")}
      onMouseEnter={showTip}
      onMouseLeave={hideTip}
    >
      {restprops.children}
      {active && (
        <div className={classnames(`before:h-0 before:w-0 before:absolute before:pointer-events-none before:border-4 before:mr-4 before:content-none before:left-1/2 absolute left-1/2 z-10 rounded-md p-2 text-miru-dark-purple-1000 bg-miru-gray-1000 text-sm leading-none whitespace-nowrap ${placeBottom ? "top-full mt-2" : "bottom-full mb-2"}`)}>
          {content}
        </div>
      )}
    </div>
  );
};

export default Tooltip;
