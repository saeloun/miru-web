import React from "react";

const AmountBoxContainer = ({ amountBox, cssClass="" }) => (
  <ul className={`page-display__wrap ${cssClass}`}>
    { amountBox.map((data, index) => (
      <li key={index} className="page-display__box">
        <p className="font-normal text-sm tracking-widest">{data.title}</p>
        <p className="text-5xl font-normal mt-3 tracking-widest">{data.amount}</p>
      </li>
    )
    )}
  </ul>
);

export default AmountBoxContainer;
