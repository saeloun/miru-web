/* eslint-disable */
import React from "react";

import { minToHHMM } from "helpers";
import { DeleteIcon, EditIcon, CopyIcon } from "miruIcons";
import { Badge } from "StyledComponents";

import { useUserContext } from "context/UserContext";

import { Roles } from "../../constants";

interface props {
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

const canEditTimeEntry = (billStatus, role) =>
  billStatus != "billed" || role == Roles["OWNER"] || role == Roles["ADMIN"];

const showUpdateAction = (billStatus, role, id, setEditEntryId) => {
  if (canEditTimeEntry(billStatus, role)) {
    return (
      <button
        className="icon-hover"
        id="editIcon"
        onClick={() => setEditEntryId(id)}
      >
        <EditIcon className="text-miru-han-purple-1000" size={20} />
      </button>
    );
  }

  return <div className="mx-10 h-4 w-4" />;
};

const showDeleteAction = (billStatus, role, id, handleDeleteEntry) => {
  if (canEditTimeEntry(billStatus, role)) {
    return (
      <button
        className="icon-hover "
        id="deleteIcon"
        onClick={() => handleDeleteEntry(id)}
      >
        <DeleteIcon className="text-miru-han-purple-1000" size={20} />
      </button>
    );
  }

  return <div className="mr-10 h-4 w-4" />;
};

const showDuplicateAction = (billStatus, role, id, handleDuplicate) => {
  if (canEditTimeEntry(billStatus, role)) {
    return (
      <button className="icon-hover " onClick={() => handleDuplicate(id)}>
        <CopyIcon className="text-miru-han-purple-1000" size={20} />
      </button>
    );
  }

  return <div className="mr-10 h-4 w-4" />;
};

const EntryCard: React.FC<props> = ({
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
}) => {
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
          {bill_status === "unbilled" ? (
            <Badge
              bgColor="bg-miru-alert-yellow-400"
              className="uppercase"
              color="text-miru-alert-green-1000"
              text="unbilled"
            />
          ) : bill_status === "non_billable" ? (
            <Badge
              bgColor="bg-miru-dark-purple-100"
              className="uppercase"
              color="text-miru-dark-purple-600"
              text="non billable"
            />
          ) : (
            <Badge
              bgColor="bg-miru-alert-green-400"
              className="uppercase"
              color="text-miru-alert-green-800"
              text="billed"
            />
          )}
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
          <div>
            {bill_status === "unbilled" ? (
              <Badge
                bgColor="bg-miru-alert-yellow-400"
                className="uppercase"
                color="text-miru-alert-green-1000"
                text="unbilled"
              />
            ) : bill_status === "non_billable" ? (
              <Badge
                bgColor="bg-miru-dark-purple-100"
                className="uppercase"
                color="text-miru-dark-purple-600"
                text="non billable"
              />
            ) : (
              <Badge
                bgColor="bg-miru-alert-green-400"
                className="uppercase"
                color="text-miru-alert-green-800"
                text="billed"
              />
            )}
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

export default EntryCard;
