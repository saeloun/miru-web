import React, { forwardRef, useEffect, useRef, useState } from "react";

import { useUserContext } from "context/UserContext";
import { PencilIcon, DeleteIcon } from "miruIcons";

const IndeterminateCheckbox = forwardRef(
  ({ indeterminate, ...rest }: any, ref) => {
    const defaultRef = useRef<HTMLInputElement | null>(null);
    const resolvedRef: any = ref || defaultRef;

    useEffect(() => {
      resolvedRef.current.indeterminate = indeterminate;
    }, [resolvedRef, indeterminate]);

    return (
      <div className="flex items-center">
        <input
          ref={resolvedRef}
          type="checkbox"
          {...rest}
          className="custom__checkbox absolute h-8 w-8 opacity-0"
        />
        <div className="mr-2 flex h-5 w-5 flex-shrink-0 items-center justify-center border-2 border-primary bg-white focus-within:border-blue-500">
          <svg
            className="custom__checkbox-tick pointer-events-none hidden h-2 w-2 fill-current text-primary"
            version="1.1"
            viewBox="0 0 17 12"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g fill="none" fillRule="evenodd">
              <g
                fill="#5B34EA"
                fillRule="nonzero"
                transform="translate(-9 -11)"
              >
                <path d="m25.576 11.414c0.56558 0.55188 0.56558 1.4439 0 1.9961l-9.404 9.176c-0.28213 0.27529-0.65247 0.41385-1.0228 0.41385-0.37034 0-0.74068-0.13855-1.0228-0.41385l-4.7019-4.588c-0.56584-0.55188-0.56584-1.4442 0-1.9961 0.56558-0.55214 1.4798-0.55214 2.0456 0l3.679 3.5899 8.3812-8.1779c0.56558-0.55214 1.4798-0.55214 2.0456 0z" />
              </g>
            </g>
          </svg>
        </div>
      </div>
    );
  }
);

interface TableProps {
  tableHeader: any[];
  tableRowArray: any[];
  hasCheckbox?: boolean;
  hasRowIcons?: boolean;
  handleDeleteClick?: (id: any) => void;
  handleEditClick?: (id: any) => void;
  rowOnClick?: (id: any) => void;
}

const HeaderCheckbox = ({
  rows,
  selectedRows,
  toggleAll,
}: {
  rows: any[];
  selectedRows: Set<any>;
  toggleAll: () => void;
}) => {
  const selectedCount = rows.filter(row => selectedRows.has(row.rowId)).length;
  const allSelected = rows.length > 0 && selectedCount === rows.length;
  const someSelected = selectedCount > 0 && !allSelected;

  return (
    <IndeterminateCheckbox
      checked={allSelected}
      indeterminate={someSelected}
      onChange={toggleAll}
    />
  );
};

const Table = ({
  tableHeader,
  tableRowArray,
  hasCheckbox = false,
  hasRowIcons = false,
  handleDeleteClick = _id => {
    /* Default empty handler */
  },
  handleEditClick = _id => {
    /* Default empty handler */
  },
  rowOnClick = _id => {
    /* Default empty handler */
  },
}: TableProps) => {
  const { isDesktop } = useUserContext();
  const rows = tableRowArray || [];
  const [selectedRows, setSelectedRows] = useState<Set<any>>(new Set());

  const toggleAll = () => {
    const allSelected =
      rows.length > 0 && rows.every(row => selectedRows.has(row.rowId));
    if (allSelected) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(rows.map(row => row.rowId)));
    }
  };

  const toggleRow = (rowId: any) => {
    setSelectedRows(previous => {
      const next = new Set(previous);
      if (next.has(rowId)) {
        next.delete(rowId);
      } else {
        next.add(rowId);
      }

      return next;
    });
  };

  return (
    <table className="mt-4 min-w-full divide-y divide-gray-200 md:w-full md:table-fixed">
      <thead>
        <tr>
          {hasCheckbox && (
            <th className="table__header">
              <HeaderCheckbox
                rows={rows}
                selectedRows={selectedRows}
                toggleAll={toggleAll}
              />
            </th>
          )}
          {tableHeader.map((column, idx) => (
            <th
              className={`table__header ${column.cssClass}`}
              key={`${column.accessor}-${idx}`}
            >
              {column.Header}
            </th>
          ))}
          {hasRowIcons && isDesktop && (
            <th className="table__header md:w-1/5" />
          )}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => {
          const cssClassLastRow = rows.length - 1 !== index ? "border-b" : "";
          const cssClassRowHover = hasRowIcons ? "hoverIcon" : "";

          return (
            <tr
              className={`${cssClassLastRow} ${cssClassRowHover}`}
              key={row.rowId || index}
              onClick={() => rowOnClick(row.rowId)}
            >
              {hasCheckbox && (
                <td className="table__cell md:w-1/3">
                  <IndeterminateCheckbox
                    checked={selectedRows.has(row.rowId)}
                    indeterminate={false}
                    onChange={() => toggleRow(row.rowId)}
                  />
                </td>
              )}
              {tableHeader.map((column, idx) => (
                <td
                  className="table__cell md:w-1/3"
                  key={`${column.accessor}-${idx}`}
                >
                  {row[column.accessor]}
                </td>
              ))}
              {hasRowIcons && isDesktop && (
                <td className="table__cell md:w-1/5">
                  <div className="iconWrapper invisible flex items-center justify-evenly">
                    <button
                      onClick={e => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleEditClick(row.rowId);
                      }}
                    >
                      <PencilIcon color="#5b34ea" size={16} weight="bold" />
                    </button>
                    <button
                      className="ml-10"
                      onClick={e => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDeleteClick(row.rowId);
                      }}
                    >
                      <DeleteIcon color="#5b34ea" size={16} weight="bold" />
                    </button>
                  </div>
                </td>
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default Table;
