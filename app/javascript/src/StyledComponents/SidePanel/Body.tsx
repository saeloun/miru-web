import React from "react";

import classnames from "classnames";

type BodyProps = {
  children: any;
  className: string;
};

const Body = ({ children, className }: BodyProps) => (
  <div className={classnames(className)}>{children}</div>
);

export default Body;
