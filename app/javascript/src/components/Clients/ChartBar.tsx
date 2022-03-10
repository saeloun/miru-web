import * as React from "react";
import ReactTooltip from "react-tooltip";
import { IChartBarGraph } from './interface';

const GetClientBar = ({ client, totalHours, index }:IChartBarGraph) => {
  const chartColor = ["miru-chart-green", "miru-chart-blue", "miru-chart-pink", "miru-chart-orange"];
  const chartColorIndex = index%4;
  const randomColor = chartColor[chartColorIndex];

  const hourPercentage = (client.hours_spend * 100)/totalHours;

  const divStyle = {
    width: `${hourPercentage}%`
  };
  return (
    <div style={divStyle}>
      <ReactTooltip id={`registerTip-${index}`} effect="solid" backgroundColor="white" textColor="#1D1A31" place="top">
        <p className="text-xs">{client.name}</p>
        <p className="text-2xl text-center">{client.hours_spend}</p>
      </ReactTooltip>
      <button data-tip data-for={`registerTip-${index}`} type="button" className={`bg-${randomColor}-600 w-full h-4 block border-b border-t hover:border-transparent`}></button>
    </div>
  );
};

export default GetClientBar;
