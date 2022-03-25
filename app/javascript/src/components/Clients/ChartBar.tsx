import React from "react";
import ReactTooltip from "react-tooltip";
import { IChartBarGraph } from "./interface";
import { minutesToHHMM } from "../../helpers/hhmm-parser";

const GetClientBar = ({ client, totalMinutes, index }:IChartBarGraph) => {
  const chartColor = ["miru-chart-green", "miru-chart-blue", "miru-chart-pink", "miru-chart-orange"];
  const chartColorIndex = index%4;
  const randomColor = chartColor[chartColorIndex];
  const hourPercentage = (client.minutes_spent * 100)/totalMinutes;

  const divStyle = {
    width: `${hourPercentage}%`
  };

  return (
    <div style={divStyle}>
      <ReactTooltip id={`registerTip-${index}`} effect="solid" backgroundColor="white" textColor="#1D1A31" place="top">
        <p className="text-xs">{client.name}</p>
        <p className="text-2xl text-center">{minutesToHHMM(client.minutes_spent)}</p>
      </ReactTooltip>
      <button data-tip data-for={`registerTip-${index}`} type="button" className={`bg-${randomColor}-600 w-full h-4 block border-b border-t hover:border-transparent`}></button>
    </div>
  );
};

export default GetClientBar;
