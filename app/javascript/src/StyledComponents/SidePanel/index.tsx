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
};

const SidePanel = ({
  WrapperClassname,
  setFilterVisibilty,
  children
}: SidePanelProps) => {
  const wrapperRef = useRef(null);

  useOutsideClick(wrapperRef, () => setFilterVisibilty(false));

  return (
    <div
      ref={wrapperRef}
      className={classnames(
        "sidebar__container flex flex-col w-1/5",
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
