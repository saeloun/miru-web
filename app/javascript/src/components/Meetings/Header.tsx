import React from "react";

import { MeetingIconSVG } from "miruIcons";

import BackButton from "components/Invoices/Invoice/BackButton";

const Header = () => (
  <>
    <div className="flex items-center text-xl font-bold">
      <BackButton href="/time-tracking" />
      Meetings
    </div>
    <div className="flex h-1/5 items-center rounded-xl bg-miru-han-purple-1000 text-white">
      <span className="px-10 text-xl">
        Add your meetings from your meeting apps as time entries with a single
        <br />
        click.
      </span>
      <img
        alt="meeting-icon"
        className="absolute right-50 top-6"
        src={MeetingIconSVG}
      />
    </div>
  </>
);

export default Header;
