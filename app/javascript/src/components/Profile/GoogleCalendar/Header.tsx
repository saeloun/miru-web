import React from "react";

const Header = ({ title }: Iprops) => (
  <>
    <div className="hidden h-16 w-0 justify-between bg-miru-han-purple-1000 p-4 pl-10 text-white md:flex md:w-full">
      <span className="text-2xl font-bold">{title}</span>
    </div>
    <div className="flex h-12 w-full items-center justify-between bg-miru-han-purple-1000 p-3 text-miru-white-1000 shadow-c1 md:hidden md:w-0">
      <h1 className="mx-auto w-full text-center font-manrope text-base font-medium leading-5.5">
        {title}
      </h1>
    </div>
  </>
);

interface Iprops {
  title: string;
}

export default Header;
