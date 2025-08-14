import React from "react";

import { useNavigate } from "react-router-dom";

interface ISearchDataRowProps {
  item: {
    id?: string | number;
    value?: string | number;
    label?: string;
    name?: string;
    [key: string]: any;
  };
  urlPrefix: string;
  displayField?: string;
  idField?: string;
}

const SearchDataRow = ({
  item,
  urlPrefix,
  displayField = "name",
  idField = "id",
}: ISearchDataRowProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    const identifier = item[idField] || item.value || item.id;
    navigate(`/${urlPrefix}/${identifier}`);
  };

  const displayText = item[displayField] || item.label || item.name || "";

  return (
    <div
      className="group flex cursor-pointer items-center py-2 last:border-b-0 hover:bg-miru-gray-100"
      onClick={handleClick}
    >
      <p className="w-5/12 whitespace-nowrap pl-3 pr-6 text-base font-normal tracking-wider text-miru-dark-purple-1000">
        {displayText}
      </p>
    </div>
  );
};

export default SearchDataRow;
