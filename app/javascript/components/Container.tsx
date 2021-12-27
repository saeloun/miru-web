import * as React from "react";

const Container = ({ children }) => (
  <div className="pt-10/100 px-10 xsm:px-20/100 sm:px-26/100 md:px-30/100 lg:px-32/100 xl:px-36/100">
    <div className="font-jakartasans">{children}</div>
  </div>
);

export default Container;
