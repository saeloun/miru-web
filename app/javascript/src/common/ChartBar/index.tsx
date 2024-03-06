import React from "react";

import { minToHHMM } from "helpers";
import { Tooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";

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
  const finalHourPercentage =
    hourPercentage > 1 ? hourPercentage : Math.ceil(hourPercentage);

  const divStyle = {
    width: `${finalHourPercentage}%`,
  };

  return (
    <div style={divStyle}>
      <Tooltip
        anchorId={`registerTip-${index}`}
        className="tooltip"
        place="top"
      >
        <p className="text-xs">{element.name}</p>
        <p className="text-center text-2xl">{minToHHMM(element.minutes)}</p>
      </Tooltip>
      <button
        data-tip
        className={`bg-${randomColor}-600 block h-4 w-full border-b border-t hover:border-transparent`}
        id={`registerTip-${index}`}
        type="button"
      />
    </div>
  );
};

const GetClientBar = ({ data, totalMinutes }: IChartBarGraph) => {
  //removing elements whose minutes value is less than or equal to zero.
  const dataWithMinutes = data.filter(element => element.minutes > 0);

  return (
    <section>
      <div className="hidden md:block">
        <p className="mb-3 text-tiny tracking-widest text-miru-dark-purple-600">
          TOTAL HOURS:
          <span className="font-medium">{minToHHMM(totalMinutes)}</span>
        </p>
        <div className="flex h-1 w-full bg-gray-200">
          {dataWithMinutes.map((element, index) => {
            if (element.minutes > 0) {
              return (
                <Client
                  element={element}
                  index={index}
                  key={index}
                  totalMinutes={totalMinutes}
                />
              );
            }
          })}
        </div>
        <div className="mt-3 flex justify-between pb-6 text-tiny tracking-widest text-miru-dark-purple-400">
          <span>0</span>
          <span>{minToHHMM(totalMinutes)}</span>
        </div>
      </div>
    </section>
  );
};

export default GetClientBar;
