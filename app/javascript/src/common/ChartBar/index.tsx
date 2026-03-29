import React from "react";

import { minToHHMM } from "helpers";
import { Tooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";

import { IChartBarGraph, ISingleClient } from "./interface";

const Client = ({ element, totalMinutes, index }: ISingleClient) => {
  const chartColors = [
    "hsl(var(--foreground) / 0.7)",
    "hsl(var(--foreground) / 0.58)",
    "hsl(var(--foreground) / 0.46)",
    "hsl(var(--foreground) / 0.34)",
  ];
  const chartColorIndex = index % 4;
  const color = chartColors[chartColorIndex];
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
        className="block h-4 w-full border-b border-t border-transparent hover:border-border"
        id={`registerTip-${index}`}
        style={{ backgroundColor: color }}
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
        <p className="mb-3 text-tiny tracking-wider text-muted-foreground">
          TOTAL HOURS:{" "}
          <span className="font-medium text-foreground">
            {minToHHMM(totalMinutes)}
          </span>
        </p>
        <div className="flex h-1 w-full bg-muted/60">
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
        <div className="mt-3 flex justify-between pb-6 text-tiny tracking-wider text-muted-foreground">
          <span>0</span>
          <span>{minToHHMM(totalMinutes)}</span>
        </div>
      </div>
    </section>
  );
};

export default GetClientBar;
