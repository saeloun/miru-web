import React from "react";

import { CaretCircleLeftIcon, CaretCircleRightIcon } from "miruIcons";

const NavArrowBtn = ({
  id,
  direction = NavArrowBtnDirections.prev,
  iconSize = 20,
  handleClick,
}: Iprops) => (
  <button
    className="flex flex-col items-center justify-center"
    id={id}
    onClick={handleClick}
  >
    {direction === NavArrowBtnDirections.prev ? (
      <CaretCircleLeftIcon size={iconSize} />
    ) : (
      <CaretCircleRightIcon size={iconSize} />
    )}
  </button>
);

interface Iprops {
  id?: string;
  iconSize?: number | string;
  direction: NavArrowBtnDirections;
  handleClick: () => void | any;
}

export enum NavArrowBtnDirections {
  prev,
  next,
}
export default NavArrowBtn;
