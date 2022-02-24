import * as React from "react";

const BillTag: React.FC<props> = ({ color, text }) => (
  <p
    className={`bg-${color} text-miru-alert-green-1000 px-1 mr-6 text-xs h-4 flex justify-center font-semibold tracking-widest rounded-lg`}
  >
    {text.toUpperCase()}
  </p>
);

export default BillTag;
