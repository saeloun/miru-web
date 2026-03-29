import React from "react";

const AmountBoxContainer = ({ amountBox, cssClass = "" }) => (
  <ul
    className={`gap- grid w-full grid-cols-4 items-stretch gap-x-4 border-t border-border pt-5 text-foreground sm:flex-row md:grid-cols-12 ${cssClass}`}
  >
    {amountBox.map((data, index) => (
      <li
        key={index}
        className={`col-span-6 items-start px-2 md:px-0
            ${
              index < amountBox.length - 1 &&
              "md:mr-10 md:border-r md:border-border"
            }
          `}
      >
        <p className="text-sm font-normal tracking-wider">{data.title}</p>
        <p className="font-regular mt-3 text-3xl font-normal tracking-tight">
          {data.amount}
        </p>
      </li>
    ))}
  </ul>
);

export default AmountBoxContainer;
