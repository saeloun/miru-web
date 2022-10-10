import React, { Fragment } from "react";

import { minToHHMM } from "helpers";
import ReactTooltip from "react-tooltip";

import { IChartBarGraph, ISingleClient } from "./interface";

const Client = ({ element, totalMinutes, index }:ISingleClient) => {
  const chartColor = ["miru-chart-green", "miru-chart-blue", "miru-chart-pink", "miru-chart-orange"];
  const chartColorIndex = index%4;
  const randomColor = chartColor[chartColorIndex];
  const hourPercentage = (element.minutes * 100)/totalMinutes;

  const divStyle = {
    width: `${hourPercentage}%`
  };

  return (
    <div style={divStyle}>
      <ReactTooltip id={`registerTip-${index}`} effect="solid" backgroundColor="white" textColor="#1D1A31" place="top">
        <p className="text-xs">{element.name}</p>
        <p className="text-2xl text-center">{minToHHMM(element.minutes)}</p>
      </ReactTooltip>
      <button
        data-tip
        data-for={`registerTip-${index}`}
        type="button"
        className={`bg-${randomColor}-600 w-full h-4 block border-b border-t hover:border-transparent`}>
      </button>
    </div>
  );
};

const GetClientBar = ({ data, totalMinutes }:IChartBarGraph) => (
  <Fragment>
    <p className="mb-3 text-tiny text-miru-dark-purple-600 tracking-widest">
      TOTAL HOURS: <span className="font-medium">{minToHHMM(totalMinutes)}</span>
    </p>
    <div className="w-full bg-gray-200 flex h-1">
      {data.map((element, index) => <Client
        element={element}
        key={index}
        index={index}
        totalMinutes={totalMinutes}
      />)
      }
    </div>
    <div className="flex text-tiny text-miru-dark-purple-400 tracking-widest pb-6 justify-between mt-3">
      <span>
        0
      </span>
      <span>
        {minToHHMM(totalMinutes)}
      </span>
    </div>
  </Fragment>
);

export default GetClientBar;
