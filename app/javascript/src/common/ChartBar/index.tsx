import React, { Fragment } from "react";

import { minToHHMM } from "helpers";
import ReactTooltip from "react-tooltip";

import { IChartBarGraph, ISingleClient } from "./interface";

const Client = ({ element, totalMinutes, index }: ISingleClient) => {
  const chartColor = [
    "miru-chart-green",
    "miru-chart-blue",
    "miru-chart-pink",
    "miru-chart-orange",
  ];
  const chartColorIndex = index % 4;
  const randomColor = chartColor[chartColorIndex];
  const hourPercentage = (element.minutes * 100) / totalMinutes;

  const divStyle = {
    width: `${hourPercentage}%`,
  };

  return (
    <div style={divStyle}>
      <ReactTooltip
        backgroundColor="white"
        effect="solid"
        id={`registerTip-${index}`}
        place="top"
        textColor="#1D1A31"
      >
        <p className="text-xs">{element.name}</p>
        <p className="text-center text-2xl">{minToHHMM(element.minutes)}</p>
      </ReactTooltip>
      <button
        data-tip
        className={`bg-${randomColor}-600 block h-4 w-full border-b border-t hover:border-transparent`}
        data-for={`registerTip-${index}`}
        type="button"
      />
    </div>
  );
};

const GetClientBar = ({ data, totalMinutes }: IChartBarGraph) => (
  <Fragment>
    <p className="mb-3 text-tiny tracking-widest text-miru-dark-purple-600">
      TOTAL HOURS:{" "}
      <span className="font-medium">{minToHHMM(totalMinutes)}</span>
    </p>
    <div className="flex h-1 w-full bg-gray-200">
      {data.map((element, index) => (
        <Client
          element={element}
          index={index}
          key={index}
          totalMinutes={totalMinutes}
        />
      ))}
    </div>
    <div className="mt-3 flex justify-between pb-6 text-tiny tracking-widest text-miru-dark-purple-400">
      <span>0</span>
      <span>{minToHHMM(totalMinutes)}</span>
    </div>
  </Fragment>
);

export default GetClientBar;
