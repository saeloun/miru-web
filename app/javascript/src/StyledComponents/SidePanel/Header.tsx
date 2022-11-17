import React from "react";

import classnames from "classnames";

type HeaderProps = {
  children: any;
  className: string;
};

const Header = ({ children, className }: HeaderProps) => (
  <div className={classnames(className)}>{children}</div>
);

export default Header;
