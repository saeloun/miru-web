import * as React from "react";
import ReactTooltip from "react-tooltip";

const getRandomColor = (index) => {
  const chartColor = ["miru-chart-green", "miru-chart-blue", "miru-chart-pink", "miru-chart-orange"];
  const chartColorIndex = index%4;
  return chartColor[chartColorIndex];
};
  
const GetClientBar = ({ client, totalHours, index }) => {
  const hourPercentage = (client.hoursLogged * 100)/totalHours;
  const divStyle = {
    width: `${hourPercentage}%`
  };
  const randomColor = getRandomColor(index);
  
  return (
    <div style={divStyle}>
      <ReactTooltip id={`registerTip-${index}`} effect="solid" backgroundColor="white" textColor="black" place="top">
        <p>{client.name}</p>
        <p className="text-center">{client.hoursLogged}</p>
      </ReactTooltip>
      <button data-tip data-for={`registerTip-${index}`} type="button" className={`bg-${randomColor}-600 w-full h-4 block border-b border-t hover:border-transparent`}></button>
    </div>
  );
};

const ClientBarGraph = ({ clients , totalHours }) => {
  return (
    <div className="bg-miru-gray-100 py-10 px-10">
      <div className="flex justify-end">
        <select className="px-3
          py-1.5
          text-base
          font-normal
          bg-transparent bg-clip-padding bg-no-repeat
          border-none
          transition
          ease-in-out
          m-0
          focus:outline-none
          text-miru-han-purple-1000">
          <option className="text-miru-dark-purple-1000" value="Jon Smith">
            THIS WEEK
          </option>
        </select>
      </div>
      <p className="mb-3">
          TOTAL HOURS: <span>{totalHours}</span>
      </p>
      <div className="w-full bg-gray-200 flex h-1">
        {clients.map((client, index) => {
          return <GetClientBar 
            client={client} 
            key={index} 
            index={index} 
            totalHours={totalHours} 
          />;
        })
        }
      </div>
      <div className="flex border-b-2 border-miru-gray-1000 border-b-miru-gray-1000 pb-6 justify-between mt-3">
        <span>
            0
        </span>
        <span>
          {totalHours}
        </span>
      </div>
      <div className="flex pt-6">
        <div className="flex-auto border-r-2 py-2 border-miru-gray-1000 border-r-miru-gray-1000">
          <p>
                OVERDUE
          </p>
          <h4 className="text-4xl mt-3">
                $35.3K
          </h4>
        </div>
        <div className="flex-auto py-2 pl-5">
          <p>
                OUTSTANDING
          </p>
          <h4 className="text-4xl mt-3">
                $35.3K
          </h4>  
        </div>
      </div>
    </div>
  );
};

export default ClientBarGraph;