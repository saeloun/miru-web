import React, { useEffect } from "react";

const NewEntryCardDayView = ({
  spaceUsages,
}) => {
  const getRandomColor = (userId: number) => {
    const letters = 'BCDEF'.split('');
    let color = '#';
    for (let i = 0; i < 6; i++ ) {
      color += letters[(userId * i) % letters.length];
    }
    return color;
  }

  useEffect(() => {
    if (spaceUsages.length) {
      document.getElementById('newSpace0').scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [spaceUsages])

  return (
    <div className="ac-clone-col">
      {spaceUsages && spaceUsages.map((space: any, _index: number) => {
        const displayTitle = `New`;
        const displayColor = getRandomColor(space.user_id)
        return (
          <div id={`newSpace${space.id}`}
            className="relative z-50 cursor-pointer as-meeting-point w-7 opacity-90"
            key={_index}
            title={displayTitle}
            style={ { height: `${space.end_duration - space.start_duration}px`, top: `${space.start_duration}px`, backgroundColor: displayColor, border: "1px solid red" } }
          >
            <h6>{displayTitle}</h6>
          </div>
        )
      })}
    </div>
  );
};

export default NewEntryCardDayView;
