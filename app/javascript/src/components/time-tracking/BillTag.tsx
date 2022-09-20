import React from "react";

interface Props {
  color: string;
  text: string;
}

const BillTag: React.FC<Props> = ({ color, text }) => (
  <span className={`inline-flex items-center rounded-full bg-${color}-100 px-2.5 py-0.5 text-xs font-medium text-${color}-800`}>
    {text}
  </span>
);

export default BillTag;
