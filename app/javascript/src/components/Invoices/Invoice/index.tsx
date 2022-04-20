import React from "react";
import Header from "./Header";

const Invoice = ({ invoice }) => (
  <>
    <div className="max-w-6xl mx-auto px-2 md:px-11 font-manrope">
      <Header invoice={invoice} />
    </div>
  </>
);

export default Invoice;
