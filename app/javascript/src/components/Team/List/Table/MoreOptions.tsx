import React from "react";

import { DeleteIcon, EditIcon, ResendInviteIcon } from "miruIcons";
import { Button, MobileMoreOptions, Tooltip } from "StyledComponents";

import teamApi from "apis/team";
import HoverMoreOptions from "common/HoverMoreOptions";
import { TeamModalType } from "constants/index";
import { useList } from "context/TeamContext";
import { useUserContext } from "context/UserContext";

type Iprops = {
  item: any;
  setShowMoreOptions?: React.Dispatch<React.SetStateAction<boolean>>;
  showMoreOptions?: boolean;
};

const MoreOptions = ({ item, setShowMoreOptions, showMoreOptions }: Iprops) => {
  const { setModalState } = useList();
  const { isDesktop } = useUserContext();

  const handleResendInvite = async () => {
    await teamApi.resendInvite(item.id);
  };

  const handleAction = (e, action) => {
    e.preventDefault();
    e.stopPropagation();
    setModalState(action, item);
  };

  return isDesktop ? (
    <HoverMoreOptions position="bottom-10 right-0">
      <Tooltip content="Re-Invite">
        <Button
          disabled={item.status}
          style="ternary"
          onClick={handleResendInvite}
        >
          <ResendInviteIcon size={16} weight="bold" />
        </Button>
      </Tooltip>
      <Tooltip content="Edit">
        <Button
          style="ternary"
          onClick={e => {
            handleAction(e, TeamModalType.ADD_EDIT);
          }}
        >
          <EditIcon size={16} weight="bold" />
        </Button>
      </Tooltip>
      <Tooltip content="Delete">
        <Button
          style="ternary"
          onClick={e => {
            handleAction(e, TeamModalType.DELETE);
          }}
        >
          <DeleteIcon className="text-miru-red-400" size={16} weight="bold" />
        </Button>
      </Tooltip>
    </HoverMoreOptions>
  ) : (
    <MobileMoreOptions
      setVisibilty={setShowMoreOptions}
      visibilty={showMoreOptions}
    >
      <li
        className="flex items-center px-2 pt-3 text-sm leading-5 text-miru-han-purple-1000"
        onClick={e => {
          setShowMoreOptions(false);
          handleAction(e, TeamModalType.ADD_EDIT);
        }}
      >
        <EditIcon className="mr-4" color="#5B34EA" size={16} />
        Edit
      </li>
      <li
        className="flex items-center px-2 pt-3 text-sm leading-5 text-miru-red-400"
        onClick={e => {
          setShowMoreOptions(false);
          handleAction(e, TeamModalType.DELETE);
        }}
      >
        <DeleteIcon className="mr-4" size={16} />
        Delete
      </li>
    </MobileMoreOptions>
  );
};

export default MoreOptions;
