import { TeamModalType } from "constants/index";

import React from "react";

import { teamApi } from "apis/api";
import HoverMoreOptions from "common/HoverMoreOptions";
import { useList } from "context/TeamContext";
import { useUserContext } from "context/UserContext";
import { i18n } from "../../../../i18n";
import { DeleteIcon, EditIcon, ResendInviteIcon } from "miruIcons";
import { Button, MobileMoreOptions, Tooltip } from "StyledComponents";

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
      <Tooltip content={i18n.t("team.resendInvite")}>
        <Button
          disabled={item.status}
          style="ternary"
          onClick={handleResendInvite}
        >
          <ResendInviteIcon size={16} weight="bold" />
        </Button>
      </Tooltip>
      <Tooltip content={i18n.t("edit")}>
        <Button
          style="ternary"
          onClick={e => {
            handleAction(e, TeamModalType.ADD_EDIT);
          }}
        >
          <EditIcon size={16} weight="bold" />
        </Button>
      </Tooltip>
      <Tooltip content={i18n.t("delete")}>
        <Button
          style="ternary"
          onClick={e => {
            handleAction(e, TeamModalType.DELETE);
          }}
        >
          <DeleteIcon className="text-destructive" size={16} weight="bold" />
        </Button>
      </Tooltip>
    </HoverMoreOptions>
  ) : (
    <MobileMoreOptions
      setVisibilty={setShowMoreOptions}
      visibilty={showMoreOptions}
    >
      <li
        className="flex items-center px-2 pt-3 text-sm leading-5 text-primary"
        onClick={e => {
          setShowMoreOptions(false);
          handleAction(e, TeamModalType.ADD_EDIT);
        }}
      >
        <EditIcon className="mr-4" color="#5E58F1" size={16} />
        {i18n.t("edit")}
      </li>
      <li
        className="flex items-center px-2 pt-3 text-sm leading-5 text-destructive"
        onClick={e => {
          setShowMoreOptions(false);
          handleAction(e, TeamModalType.DELETE);
        }}
      >
        <DeleteIcon className="mr-4" size={16} />
        {i18n.t("delete")}
      </li>
    </MobileMoreOptions>
  );
};

export default MoreOptions;
