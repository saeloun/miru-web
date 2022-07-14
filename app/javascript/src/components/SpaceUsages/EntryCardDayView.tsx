import React, { useEffect, useState } from "react";

import { minutesToHHMM } from "helpers/hhmm-parser";

// import BillTag from "./BillTag";

const EntryCardDayView = ({ listIndex, groupingKey, groupingValues }) => {
  const [timeArray, setTimeArray] = useState<any>([]);

  const displayTimeArray = []

  useEffect(() => {

    if (groupingValues){
      const startDurations = groupingValues.map((groupingVal) => groupingVal.start_duration)

      const endDurations = groupingValues.map((groupingVal) => groupingVal.end_duration)

      const startDurationsArray = startDurations.filter((item,
        index) => startDurations.indexOf(item) === index).sort()

      const lowEnd = (startDurationsArray[0] / 60).toString().split(".")[0];

      const endDurationsArray = endDurations.filter((item,
        index) => endDurations.indexOf(item) === index).sort()

      const highEnd = (endDurationsArray[endDurationsArray.length - 1] / 60).toString().split(".")[0];

      const list = [];

      for (let i = parseInt(lowEnd); i <= parseInt(highEnd); i++) {
        list.push({ time: i, color_code: getRandomColor() });
      }

      setTimeArray(list)
    }

  }, [groupingValues]);

  const renderEventName = (foundSpace) => {

    let count = 0;

    const foundSpaceIds = displayTimeArray.map((arr) => arr.found_space_id)

    for (let i = 0; i < foundSpaceIds.length; i++) {
      if (foundSpaceIds[i] === foundSpace.id) {
        count++;
      }
    }

    if (count === 1){
      return <div className="absolute flex justify-between -bottom-8 w-max text-sm text-gray-500">
        {minutesToHHMM(foundSpace.start_duration)} ~ {minutesToHHMM(foundSpace.end_duration)} • {foundSpace.purpose_name}
      </div>
    } else {
      return '';
    }
  }

  const getRandomColor = () => {
    const letters = 'BCDEF'.split('');
    let color = '#';
    for (let i = 0; i < 6; i++ ) {
      color += letters[Math.floor(Math.random() * letters.length)];
    }
    return color;
  }

  return (
    <>
      <div key={listIndex} className="flex justify-between items-center w-full p-4 mt-10 rounded-sm">
        <div className="w-full bg-white rounded-xl p-1 flex h-4/5 divide-x divide-dashed divide-gray-300 shadow-lg">
          <div className="px-2 w-fit flex flex-col justify-center items-center">
            {groupingKey}
            <div className="text-sm text-gray-400"></div>
          </div>
          <div className="relative w-1/4">
            <div className="absolute -top-6 -left-2 text-xs">····</div>
          </div>
          {timeArray && timeArray.map((timeObj, index) => {
            const foundSpace = groupingValues.find(space => timeObj.time >= (space.start_duration / 60).toString().split(".")[0] && timeObj.time < (space.end_duration / 60).toString().split(".")[0]);
            {foundSpace && displayTimeArray.push({ found_space_id: foundSpace.id, color_code: timeObj.color_code })}
            const foundTimeObj = foundSpace ? displayTimeArray.find(obj => obj.found_space_id === foundSpace.id) : null;
            return (<>
              {foundSpace && foundTimeObj ?
                <div key={`${listIndex}_${timeObj}_${index}`} className="w-1/4 relative bg-opacity-100"
                  style={{ backgroundColor: foundTimeObj.color_code }}>
                  <div className="absolute -top-6 -left-4 text-xs">{timeObj.time}{': 00'}</div>
                  {renderEventName(foundSpace)}
                  {/* <div className="absolute -bottom-8 w-max text-sm text-gray-500">{space.purpose_name}</div> */}
                </div>
                :
                <div key={`${listIndex}_${timeObj}_${index}`} className="w-1/4 relative">
                  <div className="absolute -top-6 -left-4 text-xs">{timeObj.time}{': 00'}</div>
                </div>
              }
            </>)
          })}
          <div className="w-1/4 relative">
            <div className="absolute -top-6 -right-2 text-xs">····</div>
          </div>
        </div>
      </div>
    </>
  );
};

export default EntryCardDayView;
