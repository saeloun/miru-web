import React from "react";

import { XIcon } from "miruIcons";

const Recipient: React.FC<{
  email: string;
  handleClick: any;
  recipientsCount: any;
}> = ({ email, handleClick, recipientsCount }) => (
  <div className="space-XIcon-2 m-0.5 mr-2 flex w-fit items-center rounded-full border bg-miru-gray-400 px-2 py-1">
    <p>{email}</p>
    {recipientsCount > 1 && (
      <button
        className="ml-2 text-miru-black-1000 hover:text-miru-red-400"
        type="button"
        onClick={handleClick}
      >
        <XIcon size={14} weight="bold" />
      </button>
    )}
  </div>
);

export default Recipient;
