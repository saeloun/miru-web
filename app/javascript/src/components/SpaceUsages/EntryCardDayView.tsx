import React, { useEffect } from "react";

const EntryCardDayView = ({
  spaceUsages,
  setEditEntryId,
  setEditEntryColor,
  editEntryId,
  setNewEntryView,
  setSelectedSpaceId,
  spaceCode,
  setNewEntryId,
  newEntryId
}) => {
  const getRandomColor = (spaceID) => {
    const letters = 'BCDEF'.split('');
    let color = '#';
    for (let i = 0; i < 6; i++ ) {
      color += letters[(spaceID * i) % letters.length];
    }
    return color;
  }

  useEffect(() => {
    if (newEntryId) {
      document.getElementById(`${newEntryId.toString()}`).scrollIntoView({ behavior: 'smooth', block: 'center' })
      setNewEntryId(undefined)
    }
  }, [newEntryId])

  return (
    <div className="ac-clone-col" onClick={() => {
      if (!editEntryId) {
        setNewEntryView(true)
        setSelectedSpaceId(spaceCode + 1)
      }
    }}>
      {spaceUsages && spaceUsages.map((space, _index) => {
        const displayTitle = `${space.user_name} • ${space.purpose_name}`;
        const displayColor = getRandomColor(space.user_id)

        return (<div id={space.id}
          className="relative cursor-pointer as-meeting-point w-7 opacity-90"
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
