import React, { } from "react";
import { minutesToHHMM } from "helpers/hhmm-parser";

const EntryCardDayView = ({
  spaceCode,
  spaceUsages,
  setEditEntryId,
  setEditEntryColor
}) => {
  const SPACES = [
    { id: "1", name: "Conference Room", alias: "CR" },
    { id: "2", name: "HR Cabin", alias: "HRC" },
    { id: "3", name: "Sales Cabin", alias: "SC" }
  ];

  const currentSpace = SPACES.find(i => i.id === spaceCode)

  const getRandomColor = (spaceID) => {
    const letters = 'BCDEF'.split('');
    let color = '#';
    for (let i = 0; i < 6; i++ ) {
      color += letters[(spaceID * i) % letters.length];
    }
    return color;
  }

  return (
    <div className="ac-clone-col">
      <div className="ac-user-name">
        <span>{currentSpace.name}</span>
        <i>{currentSpace.alias}</i>
      </div>

      {spaceUsages && spaceUsages.map((space, _index) => {
        const displayTitle = `${minutesToHHMM(space.start_duration)} ~ ${minutesToHHMM(space.end_duration)} • ${space.purpose_name}`;
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
