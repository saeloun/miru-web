import React from "react";

import { XIcon } from "miruIcons";

import { useUserContext } from "context/UserContext";

const Recipient: React.FC<{ email: string; handleClick: any }> = ({
  email,
  handleClick,
}) => {
  const { user } = useUserContext();

  return (
    <div className="space-XIcon-2 m-0.5 flex w-fit items-center rounded-full border bg-miru-gray-400 px-2 py-1">
      <p>{email}</p>
      {user.email == "supriya@saeloun.com" && (
        <button
          className="text-miru-black-1000 hover:text-miru-red-400"
          type="button"
          onClick={handleClick}
        >
          <XIcon size={14} weight="bold" />
        </button>
      )}
    </div>
  );
};

export default Recipient;
