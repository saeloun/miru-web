import React, { useEffect } from "react";

import { minFromHHMM, minToHHMM } from "helpers";

const EntryCardDayView = ({
  spaceUsages,
  setEditEntryId,
  setEditEntryColor,
  editEntryId,
  setNewEntryView,
  setSelectedSpaceId,
  spaceCode,
  setNewEntryId,
  newEntryId,
  setSelectedTime,
  isPastDate,
  departments
}) => {
  useEffect(() => {
    if (newEntryId) {
      document.getElementById(`${newEntryId.toString()}`).scrollIntoView({ behavior: 'smooth', block: 'center' })
      setNewEntryId(undefined)
    }
  }, [newEntryId])

  return (
    <div className="ac-clone-col" onClick={(event: React.MouseEvent<HTMLElement>): void => {
      if (!isPastDate && !editEntryId) {
        setNewEntryView(true)
        setSelectedSpaceId(spaceCode.split('/')[0])
        const minutes = event.clientY - event.currentTarget.getBoundingClientRect().top
        const timeHHMM = (minutes / 60) + ":" + (minutes % 60)
        const selectedTime = minToHHMM(minFromHHMM(timeHHMM) - (minFromHHMM(timeHHMM) % 15))
        setSelectedTime(selectedTime)
      }
    }}>
      {spaceUsages && spaceUsages.map((space, _index) => {
        const displayTitle = `${space.user_name} • ${space.purpose_name}`;
        const borderDisplayColor = space.user_color ? `${space.user_color}` : "#1D1A31"
        const department = departments.find((i) => i.id === space.department_id )
        const displayColor = department ? department.color : "#1D1A31"

        return (<div id={space.id}
          className="relative cursor-pointer z-1 as-meeting-point w-7 opacity-80"
          key={_index}
          title={displayTitle}
          style={ {
            height: `${space.end_duration - space.start_duration}px`,
            top: `${space.start_duration}px`,
            backgroundColor: displayColor,
            borderLeft: `10px solid ${borderDisplayColor}`,
          } }
          onClick={() => {setEditEntryColor(displayColor); setEditEntryId(space.id);}} >
          <h6 className="text-white text-xxs">{displayTitle}</h6>
        </div>)
      })
      }
    </div>
  );
};

export default EntryCardDayView;
