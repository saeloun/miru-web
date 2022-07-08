import React from "react";

interface Props {
  color: string;
  text: string;
}

const BillTag: React.FC<Props> = ({ color, text }) => (
  <p
    className={`bg-${color} text-miru-alert-green-1000 px-1 mr-6 text-xs flex justify-center font-semibold tracking-widest rounded-lg w-auto h-auto`}
  >
    {text.toUpperCase()}
  </p>
);

export default BillTag;
