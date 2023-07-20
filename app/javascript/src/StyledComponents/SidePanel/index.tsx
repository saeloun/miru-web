import React, { useRef } from "react";

import classnames from "classnames";
import { useOutsideClick } from "helpers";

import Body from "./Body";
import Footer from "./Footer";
import Header from "./Header";

type SidePanelProps = {
  WrapperClassname?: string;
  setFilterVisibilty;
  children;
  disableOutsideClick?: boolean;
};

const SidePanel = ({
  WrapperClassname,
  setFilterVisibilty,
  children,
  disableOutsideClick = false,
}: SidePanelProps) => {
  const wrapperRef = useRef(null);

  useOutsideClick(
    wrapperRef,
    () => setFilterVisibilty(false),
    !disableOutsideClick
  );

  return (
    <div
      ref={wrapperRef}
      className={classnames(
        "sidebar__container flex w-full flex-col lg:w-1/4",
        WrapperClassname
      )}
    >
      {children}
    </div>
  );
};

SidePanel.Header = Header;
SidePanel.Body = Body;
SidePanel.Footer = Footer;

export default SidePanel;
