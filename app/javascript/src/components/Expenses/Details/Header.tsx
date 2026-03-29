import React from "react";

import { ArrowLeftIcon, EditIcon, DeleteIcon } from "miruIcons";
import { useNavigate } from "react-router-dom";
import { Button } from "StyledComponents";

const Header = ({ expense, handleEdit, handleDelete }) => {
  const navigate = useNavigate();
  const showDelete = expense?.status !== "paid";

  return (
    <div className="flex h-12 items-center justify-between px-4 shadow-c1 lg:my-6 lg:h-auto lg:px-0 lg:shadow-none">
      <div className="flex items-center">
        <Button
          className="mr-2"
          style="ternary"
          onClick={() => navigate("/expenses")}
        >
          <ArrowLeftIcon className="text-foreground" size={20} weight="bold" />
        </Button>
        <span className="text-base font-bold text-foreground lg:text-32">
          {expense?.categoryName}
        </span>
      </div>
      <div className="hidden lg:flex">
        <Button
          className="mr-4 flex w-24 items-center justify-center rounded p-2"
          style="secondary"
          onClick={handleEdit}
        >
          <EditIcon className="mr-2" size={16} weight="bold" />
          <span className="text-base font-medium"> Edit</span>
        </Button>
        {showDelete && (
          <Button
            className="flex w-24 items-center justify-center rounded border border-destructive p-2 text-destructive"
            style="ternary"
            onClick={handleDelete}
          >
            <DeleteIcon
              className="mr-2 text-destructive"
              size={16}
              weight="bold"
            />
            <span className="text-base font-medium text-destructive">
              Delete
            </span>
          </Button>
        )}
      </div>
      <div className="flex lg:hidden">
        <Button className="p-2" style="ternary" onClick={handleEdit}>
          <EditIcon size={16} weight="bold" />
        </Button>
        {showDelete && (
          <Button className="p-2" style="ternary" onClick={handleDelete}>
            <DeleteIcon className="text-destructive" size={16} weight="bold" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default Header;
