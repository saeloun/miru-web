import React from "react";

const AmountBoxContainer = ({ amountBox, cssClass = "" }) => (
  <ul className={`page-display__wrap ${cssClass}`}>
    {amountBox.map((data, index) => (
      <li className="page-display__box" key={index}>
        <p className="text-sm font-normal tracking-widest">{data.title}</p>
        <p className="mt-3 text-5xl font-normal tracking-widest">
          {data.amount}
        </p>
      </li>
    ))}
  </ul>
);

export default AmountBoxContainer;
