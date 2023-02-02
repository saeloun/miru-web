import React, { useRef } from "react";

import classnames from "classnames";
import { useOutsideClick } from "helpers";

const DEFAULT_STYLE = "shadow-2 w-full rounded-lg bg-white p-4";
type MobileMoreOptionsProps = {
  children?: any;
  className?: string;
  setVisibilty;
};

const MobileMoreOptions = ({
  children,
  className = "",
  setVisibilty,
}: MobileMoreOptionsProps) => {
  const wrapperRef = useRef(null);
  useOutsideClick(wrapperRef, () => setVisibilty(false));

  return (
    <div
      className="modal__modal main-modal "
      style={{ background: "rgba(29, 26, 49,0.6)" }}
    >
      <ul className={classnames(DEFAULT_STYLE, className)} ref={wrapperRef}>
        {children}
      </ul>
    </div>
  );
};

export default MobileMoreOptions;
