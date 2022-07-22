import React, { useEffect, useState } from "react";
import { minutesToHHMM } from "helpers/hhmm-parser";

// import BillTag from "./BillTag";

const EntryCardDayView = ({
  timeArray,
  groupingKey,
  groupingValues,
  setEditEntryId,
  setEditEntryColor
}) => {
  const [timeSlots, setTimeSlots] = useState<any>([]);

  const displayTimeSlots = []

  const addMinutes = (time, minutes) => {
    const date = new Date(new Date('01/01/2015 ' + time).getTime() + minutes * 60000);
    const tempTime = ((date.getHours().toString().length == 1) ? '0' + date.getHours() : date.getHours()) + ':' +
      ((date.getMinutes().toString().length == 1) ? '0' + date.getMinutes() : date.getMinutes()) + ':' +
      ((date.getSeconds().toString().length == 1) ? '0' + date.getSeconds() : date.getSeconds());
    return tempTime;
  }

  const getRandomColor = () => {
    const letters = 'BCDEF'.split('');
    let color = '#';
    for (let i = 0; i < 6; i++ ) {
      color += letters[Math.floor(Math.random() * letters.length)];
    }
    return color;
  }

  useEffect(() => {

    if (timeArray){

      let startTime = minutesToHHMM(timeArray[0]) + ":00"
      const endTime = minutesToHHMM(timeArray.reverse()[0]) + ":00"
      const interval = "15";
      const timeslotsNew = [startTime];

      while (startTime != endTime) {
        startTime = addMinutes(startTime, interval);
        timeslotsNew.push(startTime);
      }

      const timeslotlist = [];

      timeslotsNew.map((tslot) => {
        timeslotlist.push({ time: tslot, color_code: getRandomColor() });
      })

      setTimeSlots(timeslotlist)
    }

  }, [timeArray]);

  // const renderEventName = (foundSpace) => {

  //   let count = 0;

  //   const foundSpaceIds = displayTimeSlots.map((arr) => arr.found_space_id)

  //   for (let i = 0; i < foundSpaceIds.length; i++) {
  //     if (foundSpaceIds[i] === foundSpace.id) {
  //       count++;
  //     }
  //   }

  //   if (count === 1){
  //     return <div className="absolute flex justify-between -bottom-8 w-max text-sm text-gray-500">
  //       {minutesToHHMM(foundSpace.start_duration)} ~ {minutesToHHMM(foundSpace.end_duration)} • {foundSpace.purpose_name}
  //     </div>
  //   } else {
  //     return '';
  //   }
  // }

  return (
    <>
      <div className="px-6 pb-6">
        <div className="container mx-auto grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 pt-6 gap-8">
          <div className="rounded border-gray-300 dark:border-gray-700 border-dashed border-2 h-24"></div>
          <div className="rounded border-gray-300 dark:border-gray-700 border-dashed border-2 h-24"></div>
          <div className="rounded border-gray-300 dark:border-gray-700 border-dashed border-2 h-24"></div>
        </div>
      </div>
      <div className="flex justify-between items-center w-full p-4 mt-10 rounded-sm">
        <div className="w-full overflow-x-auto bg-white rounded-xl p-1 flex h-4/5 divide-x divide-dashed divide-gray-300 shadow-lg">
          <div className="px-2 w-fit flex flex-col justify-center items-center">
            {groupingKey}
            <div className="text-sm text-gray-400"></div>
          </div>
          <div className="relative w-10">
            <div className="absolute -top-6 -left-2 text-xs">····</div>
          </div>
          {timeSlots && timeSlots.map((timeObj, index) => {
            const foundSpace = groupingValues.find(space => timeObj.time >= (minutesToHHMM(space.start_duration) + ":00") && timeObj.time < (minutesToHHMM(space.end_duration) + ":00"));
            {foundSpace && displayTimeSlots.push({ found_space_id: foundSpace.id, color_code: timeObj.color_code })}
            const foundTimeObj = foundSpace ? displayTimeSlots.find(obj => obj.found_space_id === foundSpace.id) : null;
            const displayTitle = foundSpace ? `${minutesToHHMM(foundSpace.start_duration)} ~ ${minutesToHHMM(foundSpace.end_duration)} • ${foundSpace.purpose_name}` : '';
            const displayColor = foundTimeObj ? foundTimeObj.color_code : '#FFFFFF';
            return (
              <>
                {foundSpace && foundTimeObj ?
                  <>
                    <div className="w-7 relative bg-opacity-100 cursor-pointer"
                      style={{ backgroundColor: displayColor }}
                      title={displayTitle}
                      onClick={() => {setEditEntryColor(displayColor); setEditEntryId(foundSpace.id);}} >

                      <div className="absolute -top-6 -left-4 text-xs">{timeObj.time}</div>

                      {/* {renderEventName(foundSpace)} */}
                      {/* <div className="absolute -bottom-8 w-max text-sm text-gray-500">{space.purpose_name}</div> */}
                    </div>
                    <div className="w-7 relative bg-opacity-100 cursor-pointer"
                      style={{ backgroundColor: displayColor }}
                      title={displayTitle}
                      onClick={() => {setEditEntryColor(displayColor); setEditEntryId(foundSpace.id);}} />
                    <div className="w-7 relative bg-opacity-100 cursor-pointer"
                      style={{ backgroundColor: displayColor }}
                      title={displayTitle}
                      onClick={() => {setEditEntryColor(displayColor); setEditEntryId(foundSpace.id);}} />
                  </>
                  :
                  <>
                    <div className="w-7 relative">
                      <div className="absolute -top-6 -left-4 text-xs">{timeObj.time}</div>
                    </div>
                    <div className="w-7 relative" /><div key={index} className="w-7 relative" />
                  </>
                }
              </>
            )
          })}
          <div className="w-10 relative">
            <div className="absolute -top-6 -right-2 text-xs">····</div>
          </div>
        </div>
      </div>
    </>
  );
};

export default EntryCardDayView;
