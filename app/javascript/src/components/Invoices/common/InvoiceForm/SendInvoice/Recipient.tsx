import React from "react";

import { XIcon } from "miruIcons";

const Recipient: React.FC<{
  email: string;
  handleClick: any;
  recipientsCount: any;
}> = ({ email, handleClick, recipientsCount }) => (
  <div className="space-XIcon-2 m-0.5 mr-2 flex w-fit items-center rounded-full border bg-secondary px-2 py-1">
    <p>{email}</p>
    {recipientsCount > 1 && (
      <button
        className="ml-2 text-foreground hover:text-destructive"
        type="button"
        onClick={handleClick}
      >
        <XIcon size={14} weight="bold" />
      </button>
    )}
  </div>
);

export default Recipient;
