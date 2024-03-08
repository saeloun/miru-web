import React from "react";

import { DeleteIcon, EditIcon, DownloadSimpleIcon } from "miruIcons";
import { useNavigate } from "react-router-dom";
import { Tooltip, Modal, Button } from "StyledComponents";

const MoreOptions = ({
  expense,
  isDesktop,
  showMoreOptions,
  setShowMoreOptions,
}) => {
  const navigate = useNavigate();

  return isDesktop ? (
    <div
      className="absolute bottom-16 right-0 hidden items-center justify-between rounded-xl border-2 border-miru-gray-200 bg-white lg:w-28 lg:p-2 lg:group-hover:flex xl:w-40 xl:p-3"
      onClick={e => e.stopPropagation()}
    >
      <Tooltip content="Download">
        <Button disabled style="ternary">
          <DownloadSimpleIcon size={16} weight="bold" />
        </Button>
      </Tooltip>
      <Tooltip content="Edit">
        <Button
          className="rounded p-2 text-miru-han-purple-1000 hover:bg-miru-gray-100"
          style="ternary"
          onClick={e => {
            e.stopPropagation();
            navigate(`/expenses/${expense.id}`);
          }}
        >
          <EditIcon size={16} weight="bold" />
        </Button>
      </Tooltip>
      <Tooltip content="Delete">
        <Button
          style="ternary"
          onClick={e => {
            e.stopPropagation();
          }}
        >
          <DeleteIcon size={16} weight="bold" />
        </Button>
      </Tooltip>
    </div>
  ) : (
    <Modal
      customStyle="sm:my-8 sm:w-full sm:max-w-lg sm:align-middle overflow-visible"
      isOpen={showMoreOptions}
      onClose={() => setShowMoreOptions(false)}
    >
      <ul className="shadow-2 w-full rounded-lg bg-white">
        <li className="flex cursor-pointer items-center py-2 text-miru-han-purple-1000">
          <DownloadSimpleIcon className="mr-4" size={16} /> Download Expense
        </li>
      </ul>
    </Modal>
  );
};

export default MoreOptions;
