import React, { } from "react";
import { minutesFromHHMM, minutesToHHMM } from "helpers/hhmm-parser";

const EntryCardDayView = ({
  spaceUsages,
  setEditEntryId,
  setEditEntryColor
}) => {
  const getRandomColor = (spaceID) => {
    const letters = 'BCDEF'.split('');
    let color = '#';
    for (let i = 0; i < 6; i++ ) {
      color += letters[(spaceID * i) % letters.length];
    }
    return color;
  }

  const calendarTimes = (durationFrom) => {
    durationFrom = durationFrom || "00:00"
    const product = (...a: any[][]) => a.reduce((a, b) => a.flatMap(d => b.map(e => [d, e].flat())));
    return product([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24], [0, 15, 30, 45]).map((k) => {
      const [i, m] = [k[0], k[1]]
      if (i>=24 && m > 0)
        return (null)

      let ii = i - 12
      ii = (i === 0 || ii === 0) ? 12 : (ii < 0) ? i : ii
      return ({
        id: `${i<10 ? 0 : '' }${i}:${m<10 ? 0 : ''}${m}`,
        name: `${ii < 10 ? 0 : '' }${ii}:${m<10 ? 0 : ''}${m} ${i < 12 || i == 24 ? 'AM' : 'PM'}`
      })
    }).filter((el) => (el != null && minutesFromHHMM(el.id) >= minutesFromHHMM(durationFrom)) )
  }

  return (
    <div className="ac-clone-col">
      {spaceUsages && spaceUsages.map((space, _index) => {
        const displayStartDuration = calendarTimes(null).filter((el) => minutesFromHHMM(minutesToHHMM(space.start_duration)) === minutesFromHHMM(el.id))[0].name
        const displayEndDuration = calendarTimes(null).filter((el) => minutesFromHHMM(minutesToHHMM(space.end_duration)) === minutesFromHHMM(el.id))[0].name
        const displayTitle = `${displayStartDuration} ~ ${displayEndDuration} • ${space.purpose_name}`;
        const displayColor = getRandomColor(space.user_id)

        return (<div className="as-meeting-point w-7 relative opacity-90 cursor-pointer"
          key={_index}
          title={displayTitle}
          style={ { height: `${space.end_duration - space.start_duration}px`, top: `${space.start_duration}px`, backgroundColor: displayColor } }
          onClick={() => {setEditEntryColor(displayColor); setEditEntryId(space.id);}} >
          <h6>{displayTitle}</h6>
        </div>)
      })
      }
    </div>
  );
};

export default EntryCardDayView;
