import React, { } from "react";

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

  return (
    <div className="ac-clone-col">
      {spaceUsages && spaceUsages.map((space, _index) => {
        const displayTitle = `${space.user_name} • ${space.purpose_name}`;
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
