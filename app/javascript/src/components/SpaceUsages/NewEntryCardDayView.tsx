import React, { useEffect } from "react";

const NewEntryCardDayView = ({
  spaceUsages,
  departments,
  userDepartmentId
}) => {
  useEffect(() => {
    if (spaceUsages.length) {
      document.getElementById('newSpace0').scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [spaceUsages])

  return (
    <div className="ac-clone-col">
      {spaceUsages && spaceUsages.map((space: any, _index: number) => {
        const displayTitle = `Occupying new space for you`;
        const department = departments.find((i) => i.id === userDepartmentId )
        const displayColor = department ? department.color : "#1D1A31"

        return (
          <div id={`newSpace${space.id}`}
            className="relative z-2 cursor-pointer as-meeting-point w-7 opacity-90"
            key={_index}
            title={displayTitle}
            style={ { height: `${space.end_duration - space.start_duration}px`, top: `${space.start_duration}px`, backgroundColor: displayColor, border: "1px solid red" } }
          >
            <h6 className="text-white text-xxs">{displayTitle}</h6>
          </div>
        )
      })}
    </div>
  );
};

export default NewEntryCardDayView;
