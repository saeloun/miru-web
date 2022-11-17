import React from "react";

import classnames from "classnames";

type BodyProps = {
  children: any;
  className: string;
  hasFooter: boolean;
};

const Body = ({ children, className, hasFooter = true }: BodyProps) => (
  <div className={classnames({ hasFooter, className })}>{children}</div>
);

export default Body;
