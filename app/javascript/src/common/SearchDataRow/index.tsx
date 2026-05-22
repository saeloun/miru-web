import React from "react";

import { useNavigate } from "react-router-dom";
import { HighlightText } from "../../components/ui/highlight-text";

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
  searchQuery?: string;
}

const SearchDataRow = ({
  item,
  urlPrefix,
  displayField = "name",
  idField = "id",
  searchQuery = "",
}: ISearchDataRowProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    const identifier = item[idField] || item.value || item.id;
    navigate(`/${urlPrefix}/${identifier}`);
  };

  const displayText = item[displayField] || item.label || item.name || "";

  return (
    <div
      className="group flex cursor-pointer items-center py-2 last:border-b-0 hover:bg-muted"
      onClick={handleClick}
    >
      <p className="w-5/12 whitespace-nowrap pl-3 pr-6 text-base font-normal tracking-wider text-foreground">
        <HighlightText text={displayText} query={searchQuery} />
      </p>
    </div>
  );
};

export default SearchDataRow;
