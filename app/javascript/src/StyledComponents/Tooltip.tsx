import React, { useState } from "react";

import classnames from "classnames";

type TooltipProps = {
  content?: string;
  placeBottom?: boolean;
  delay?: number;
  className?: string;
  children?: React.ReactNode;
};

const Tooltip = ({
  content,
  placeBottom = false,
  delay = 400,
  className,
  children
}: TooltipProps) => {
  let timeout;
  const [active, setActive] = useState<boolean>(false);
  const DEFAULT_STYLE = `before:h-0 before:w-0 before:absolute before:pointer-events-none before:border-4 before:mr-4 before:content-none before:left-1/2
                        absolute left-1/2 z-10 rounded-md p-2 text-miru-dark-purple-1000 bg-miru-gray-1000 text-sm leading-none whitespace-nowrap ${
  placeBottom ? "top-full mt-2" : "bottom-full mb-2"
}`;

  const showTip = () => {
    timeout = setTimeout(() => {
      setActive(true);
    }, delay);
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
      {children}
      {active && (
        <div className={classnames(DEFAULT_STYLE, className)}>{content}</div>
      )}
    </div>
  );
};

export default Tooltip;
