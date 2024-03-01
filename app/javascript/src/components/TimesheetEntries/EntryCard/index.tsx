/* eslint-disable @typescript-eslint/no-var-requires */
import React from "react";

import { minToHHMM } from "helpers";
import { Badge } from "StyledComponents";

import { useUserContext } from "context/UserContext";
import getStatusCssClass from "utils/getBadgeStatus";

import {
  showDeleteAction,
  showDuplicateAction,
  showUpdateAction,
} from "./utils";

const EntryCard = ({
  id,
  client,
  project,
  note,
  duration,
  handleDeleteEntry,
  setEditEntryId,
  bill_status,
  setNewEntryView,
  handleDuplicate,
}: Iprops) => {
  const { isDesktop, companyRole } = useUserContext();

  const handleCardClick = () => {
    if (!isDesktop) {
      setEditEntryId(id);
      setNewEntryView(true);
    }
  };

  return (
    <div
      className="week-card flex w-full items-center justify-between border-b border-miru-gray-200 py-4 lg:mt-10 lg:rounded-lg lg:border-b-0 lg:p-6 lg:shadow-2xl"
      onClick={handleCardClick}
    >
      <div className="w-7/12 flex-auto">
        <div className="text-miu-dark-Purple-1000 flex">
          <p className="text-base font-normal lg:text-lg">{client}</p>
          <p className="mx-2 text-lg">•</p>
          <p className="text-base font-normal lg:text-lg">{project}</p>
        </div>
        <div className="flex py-2 lg:hidden">
          <Badge
            className={`${getStatusCssClass(bill_status)} uppercase`}
            text={bill_status}
          />
        </div>
        <p className="max-h-32 overflow-auto whitespace-pre-wrap break-words text-sm text-miru-dark-purple-200 lg:w-160">
          {note}
        </p>
      </div>
      <p className="text-miu-dark-Purple-1000 flex self-start text-2xl lg:hidden">
        {minToHHMM(duration)}
      </p>
      <div className="hidden w-5/12 items-center justify-between lg:flex">
        <div className="flex w-7/12 items-center justify-between">
          <div className="w-1/3">
            <Badge
              className={`${getStatusCssClass(bill_status)} uppercase`}
              text={bill_status}
            />
          </div>
          <p className="mx-auto text-2xl xl:text-4xl">{minToHHMM(duration)}</p>
        </div>
        <div className="flex w-5/12 items-center justify-evenly">
          {showDuplicateAction(bill_status, companyRole, id, handleDuplicate)}
          {showUpdateAction(bill_status, companyRole, id, setEditEntryId)}
          {showDeleteAction(bill_status, companyRole, id, handleDeleteEntry)}
        </div>
      </div>
    </div>
  );
};

interface Iprops {
  id: number;
  client: string;
  project: string;
  note: string;
  duration: number;
  handleDeleteEntry: (id: number) => void; // eslint-disable-line
  setEditEntryId: React.Dispatch<React.SetStateAction<number>>;
  bill_status: string;
  setNewEntryView: any;
  handleDuplicate: any;
}

export default EntryCard;
