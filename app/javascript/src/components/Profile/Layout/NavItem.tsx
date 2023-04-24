import React from "react";

import { RightArrowIcon } from "miruIcons";

interface NavItemProps {
  icon?: any;
  text: string;
  url: string;
}

const NavItem = ({ icon, text, url }: NavItemProps) => (
  <a href={url} key={url}>
    <li className="flex items-center justify-between py-5">
      <div className="flex w-3/4 items-center gap-x-4 pl-4">
        <div>{icon}</div>
        <p className="font-manrope text-sm font-medium uppercase tracking-2 text-miru-dark-purple-1000">
          {text}
        </p>
      </div>
      <div className="pr-4">
        <RightArrowIcon size={16} />
      </div>
    </li>
  </a>
);

export default NavItem;
