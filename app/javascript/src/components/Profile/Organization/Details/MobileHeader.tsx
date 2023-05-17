import React from "react";

import { ArrowLeftIcon } from "miruIcons";

interface MobileHeaderProps {
  title: string;
  onBackArrowClick?: () => void;
  onEditBtnClick: () => void;
}

const MobileHeader = ({
  title,
  onBackArrowClick,
  onEditBtnClick,
}: MobileHeaderProps) => (
  <section className="flex h-12 w-full items-center justify-between bg-miru-white-1000 p-3 shadow-c1">
    <div className="flex items-center gap-3">
      <div>
        <button
          className="outline-none border-none bg-transparent text-miru-dark-purple-1000"
          onClick={onBackArrowClick}
        >
          <ArrowLeftIcon color="#1D1A31" size={16} />
        </button>
      </div>
      <div>
        <h1 className="font-manrope text-base font-medium leading-5.5">
          {title}
        </h1>
      </div>
    </div>
    <div>
      <button
        className="outline-none border-none bg-transparent font-manrope font-bold capitalize text-miru-han-purple-1000"
        onClick={onEditBtnClick}
      >
        Edit
      </button>
    </div>
  </section>
);

export default MobileHeader;
