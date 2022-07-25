import React, { useEffect, useState } from "react";
import { minutesToHHMM } from "helpers/hhmm-parser";
import './style.scss';

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
      <div className="ac-calendar-view">
        <div className="ac-calendar">
          <div className="ac-cv-time-row"><div className="ac-cv-time"><span>12 AM</span></div></div>
          <div className="ac-cv-time-row"><div className="ac-cv-time"><span>01 AM</span></div></div>
          <div className="ac-cv-time-row"><div className="ac-cv-time"><span>02 AM</span></div></div>
          <div className="ac-cv-time-row"><div className="ac-cv-time"><span>03 AM</span></div></div>
          <div className="ac-cv-time-row"><div className="ac-cv-time"><span>04 AM</span></div></div>
          <div className="ac-cv-time-row"><div className="ac-cv-time"><span>05 AM</span></div></div>
          <div className="ac-cv-time-row"><div className="ac-cv-time"><span>06 AM</span></div></div>
          <div className="ac-cv-time-row"><div className="ac-cv-time"><span>07 AM</span></div></div>
          <div className="ac-cv-time-row"><div className="ac-cv-time"><span>08 AM</span></div></div>
          <div className="ac-cv-time-row"><div className="ac-cv-time"><span>09 AM</span></div></div>
          <div className="ac-cv-time-row"><div className="ac-cv-time"><span>10 AM</span></div></div>
          <div className="ac-cv-time-row"><div className="ac-cv-time"><span>11 AM</span></div></div>
          <div className="ac-cv-time-row"><div className="ac-cv-time"><span>12 PM</span></div></div>
          <div className="ac-cv-time-row"><div className="ac-cv-time"><span>01 PM</span></div></div>
          <div className="ac-cv-time-row"><div className="ac-cv-time"><span>02 PM</span></div></div>
          <div className="ac-cv-time-row"><div className="ac-cv-time"><span>03 PM</span></div></div>
          <div className="ac-cv-time-row"><div className="ac-cv-time"><span>04 PM</span></div></div>
          <div className="ac-cv-time-row"><div className="ac-cv-time"><span>05 PM</span></div></div>
          <div className="ac-cv-time-row"><div className="ac-cv-time"><span>06 PM</span></div></div>
          <div className="ac-cv-time-row"><div className="ac-cv-time"><span>07 PM</span></div></div>
          <div className="ac-cv-time-row"><div className="ac-cv-time"><span>08 PM</span></div></div>
          <div className="ac-cv-time-row"><div className="ac-cv-time"><span>09 PM</span></div></div>
          <div className="ac-cv-time-row"><div className="ac-cv-time"><span>10 PM</span></div></div>
          <div className="ac-cv-time-row"><div className="ac-cv-time"><span>11 PM</span></div></div>
          <div className="ac-cv-time-row"><div className="ac-cv-time"><span>12 AM</span></div></div>
        </div>

        {/* {[{ id: "1", name: "Conference Room" },
          { id: "2", name: "HR Cabin" },
          { id: "3", name: "Sales Cabin" }].map((a) => (
          <option key={`space-${a.id}`} value={a.id}>{a["name"]}</option>
        ))} */}
        <div className="ac-calendar-clone grid grid-cols-4 gap-0">
          <div className="ac-clone-col">
            <div className="ac-user-name">
              <span>Conference Room</span>
              <i>CR</i>
            </div>
            <div className="as-meeting-point bg-blue-500 bg-opacity-80">
              <h6>Booking HR Cabin</h6>
              <span>3:30 PM - 5:00 PM</span>
            </div>

            <div className="as-meeting-point bg-red-500 bg-opacity-80" style={ { height: "24px", top: "12px" } }>
              <h6>Booking HR Cabin</h6>
              <span>3:30 PM - 5:00 PM</span>
            </div>

            <div className="as-meeting-point bg-pink-500 bg-opacity-80" style={ { height: "48px", top: "48px", width: "50%" }}>
              <h6>Booking HR Cabin</h6>
              <span>3:30 PM - 5:00 PM</span>
            </div>

            <div className="as-meeting-point bg-indigo-500 bg-opacity-80" style={ { height: "48px", top: "48px", left: "50%", width: "50%" }}>
              <h6>Booking HR Cabin</h6>
              <span>3:30 PM - 5:00 PM</span>
            </div>
          </div>

          <div className="ac-clone-col">
            <div className="ac-user-name">
              <span>HR Cabin</span>
              <i>HRC</i>
            </div>

            <div className="as-meeting-point bg-red-600 bg-opacity-80" style={{ height: "48px", top: "192px" }}>
              <h6>Booking HR Cabin 123</h6>
              <span>3:30 PM - 5:00 PM</span>
            </div>
          </div>
          <div className="ac-clone-col">
            <div className="ac-user-name">
              <span>Sales Cabin</span>
              <i>SC</i>
            </div>
          </div>
          <div className="ac-clone-col">
            <div className="ac-user-name">
              <span>My Place</span>
              <i>MP</i>
            </div>
          </div>
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
