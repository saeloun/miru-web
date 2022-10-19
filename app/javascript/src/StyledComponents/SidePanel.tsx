import React, { useRef } from "react";

import classnames from "classnames";
import { useOutsideClick } from "helpers";
import { X } from "phosphor-react";

type SidePanelProps = {
  handleCancel?;
  handleProcced?;
  setFilterVisibilty;
  HeaderTitle: string;
  HeaderLogo;
  hasFooter: boolean;
  children: object;
  proceedButtonText: string;
  cancelButtonText: string;
  WrapperClassname?: string;
  headerClassname?: string;
  footerWrapperClassname?: string;
  cancelButtonClassname?: string;
  proceedButtonClassname?: string;
};

const SidePanel = ({
  handleCancel = () => {},   //eslint-disable-line
  handleProcced = () => {}, //eslint-disable-line
  setFilterVisibilty,
  HeaderTitle,
  HeaderLogo,
  hasFooter = false,
  proceedButtonText,
  cancelButtonText,
  WrapperClassname = "",
  headerClassname = "",
  footerWrapperClassname = "",
  cancelButtonClassname = "",
  proceedButtonClassname = "",
  ...restprops
}: SidePanelProps) => {
  const wrapperRef = useRef(null);

  useOutsideClick(wrapperRef, () => setFilterVisibilty(false));

  return (
    <div
      ref={wrapperRef}
      className={classnames(
        "sidebar__container flex flex-col",
        WrapperClassname
      )}
    >
      <div>
        <div
          className={classnames(
            "flex px-5 pt-5 mb-7 justify-between items-center text-miru-dark-purple-1000 font-bold",
            headerClassname
          )}
        >
          <h4 className={classnames("text-base flex items-center")}>
            {HeaderLogo}
            {HeaderTitle}
          </h4>
          <button onClick={() => setFilterVisibilty(false)}>
            <X size={16} />
          </button>
        </div>
      </div>
      {restprops.children}
      {hasFooter && (
        <div className={classnames("sidebar__footer", footerWrapperClassname)}>
          <button
            className={classnames("sidebar__reset", cancelButtonClassname)}
            onClick={handleCancel}
          >
            {cancelButtonText}
          </button>
          <button
            className={classnames("sidebar__apply", proceedButtonClassname)}
            onClick={handleProcced}
          >
            {proceedButtonText}
          </button>
        </div>
      )}
    </div>
  );
};

export default SidePanel;
