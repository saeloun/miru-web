import React from "react";

const AmountBoxContainer = ({ amountBox, cssClass = "" }) => (
  <ul
    className={`gap- grid w-full grid-cols-4 items-stretch gap-x-4 border-t border-miru-gray-1000 pt-5 text-miru-dark-purple-1000 sm:flex-row md:grid-cols-12 ${cssClass}`}
  >
    {amountBox.map((data, index) => (
      <li
        key={index}
        className={`col-span-6 items-start px-2 md:px-0
            ${
              index < amountBox.length - 1 &&
              "md:mr-10 md:border-r md:border-miru-gray-1000"
            }
          `}
      >
        <p className="text-sm font-normal tracking-widest">{data.title}</p>
        <p className="font-regular mt-3 text-4.5xl font-normal tracking-widest">
          {data.amount}
        </p>
      </li>
    ))}
  </ul>
);

export default AmountBoxContainer;
