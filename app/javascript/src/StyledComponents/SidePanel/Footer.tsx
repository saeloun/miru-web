import React from "react";

import classnames from "classnames";

type FooterProps = {
  children: any;
  className: string;
};

const Footer = ({ children, className }:FooterProps) => (
  <div className={classnames(className)}>{children}</div>
);

export default Footer;
