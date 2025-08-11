/* eslint-disable react/display-name */
import React, { forwardRef, useEffect, useMemo, useRef } from "react";

import { useUserContext } from "context/UserContext";
import { PencilIcon, DeleteIcon } from "miruIcons";
import PropTypes from "prop-types";
import { useTable, useRowSelect } from "react-table";

const IndeterminateCheckbox = forwardRef(
  ({ indeterminate, ...rest }: any, ref) => {
    const defaultRef = useRef();
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
        <div className="mr-2 flex h-5 w-5 flex-shrink-0 items-center justify-center border-2 border-miru-han-purple-1000 bg-white focus-within:border-blue-500">
          <svg
            className="custom__checkbox-tick pointer-events-none hidden h-2 w-2 fill-current text-miru-han-purple-1000"
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

const getTableCheckbox = hooks => {
  hooks.visibleColumns.push(columns => [
    {
      id: "selection",
      Header: ({ getToggleAllRowsSelectedProps }) => (
        <div>
          <IndeterminateCheckbox {...getToggleAllRowsSelectedProps()} />
        </div>
      ),
      Cell: ({ row }) => (
        <div>
          <IndeterminateCheckbox {...row.getToggleRowSelectedProps()} />
        </div>
      ),
    },
    ...columns,
  ]);
};

const Table = ({
  tableHeader,
  tableRowArray,
  hasCheckbox = false,
  hasRowIcons = false,
  handleDeleteClick = id => {}, // eslint-disable-line
  handleEditClick = id => {}, // eslint-disable-line
  rowOnClick = id => {}, // eslint-disable-line
}) => {
  const data = useMemo(() => tableRowArray, [tableRowArray]);
  const columns = useMemo(() => tableHeader, []);
  const { isDesktop } = useUserContext();

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
    useTable(
      {
        columns,
        data,
      },
      useRowSelect,
      hasCheckbox ? getTableCheckbox : () => {} // eslint-disable-line  @typescript-eslint/no-empty-function
    );

  return (
    <table
      className="mt-4 min-w-full divide-y divide-gray-200 md:w-full md:table-fixed"
      {...getTableProps()}
    >
      <thead>
        {headerGroups.map((headerGroup, index) => (
          <tr {...headerGroup.getHeaderGroupProps()} key={index}>
            {headerGroup.headers.map((column, idx) => (
              <th
                className={`table__header ${column.cssClass}`}
                {...column.getHeaderProps()}
                key={idx}
              >
                {column.render("Header")}
              </th>
            ))}
            {hasRowIcons && isDesktop && (
              <th className="table__header md:w-1/5" />
            )}
          </tr>
        ))}
      </thead>
      <tbody {...getTableBodyProps()}>
        {/* {rows.slice(0, 10).map((row, index) => {  // this will be used when we add the pagination. */}
        {rows.map((row, index) => {
          prepareRow(row);
          const cssClassLastRow = rows.length - 1 !== index ? "border-b" : "";
          const cssClassRowHover = hasRowIcons ? "hoverIcon" : "";

          return (
            <tr
              {...row.getRowProps()}
              className={`${cssClassLastRow} ${cssClassRowHover}`}
              key={index}
              onClick={() => rowOnClick(row.original.rowId)}
            >
              {row.cells.map((cell, idx) => (
                <td
                  className="table__cell md:w-1/3"
                  {...cell.getCellProps()}
                  key={idx}
                >
                  {cell.render("Cell")}
                </td>
              ))}
              {hasRowIcons && isDesktop && (
                <td className="table__cell md:w-1/5">
                  <div className="iconWrapper invisible flex items-center justify-evenly">
                    <button
                      onClick={e => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleEditClick(row.original.rowId);
                      }}
                    >
                      <PencilIcon color="#5b34ea" size={16} weight="bold" />
                    </button>
                    <button
                      className="ml-10"
                      onClick={e => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDeleteClick(row.original.rowId);
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

Table.proptypes = {
  tableHeader: PropTypes.array,
  tableRowArray: PropTypes.array,
  hasCheckbox: PropTypes.bool,
  hasRowIcons: PropTypes.bool,
  handleDeleteClick: PropTypes.func,
  handleEditClick: PropTypes.func,
  rowOnClick: PropTypes.func,
};

export default Table;
