import React from "react";

type Iprops = {
  children: any;
  position?: string;
};

const HoverMoreOptions = ({ children, position }: Iprops) => (
  <div
    className={`absolute ${
      position || "bottom-16 right-0"
    } hidden items-center justify-between rounded-xl border-2 border-miru-gray-200 bg-white lg:w-28 lg:p-2 lg:group-hover:flex xl:w-40 xl:p-3`}
    onClick={e => e.stopPropagation()}
  >
    {children}
  </div>
);

export default HoverMoreOptions;
