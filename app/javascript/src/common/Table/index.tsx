import React from "react";
import { useTable, useRowSelect } from "react-table";
import PropTypes from "prop-types";
import { Pencil, Trash } from "phosphor-react";

const IndeterminateCheckbox = React.forwardRef( // eslint-disable-line react/display-name
  ({ indeterminate, ...rest }:any, ref) => {
    const defaultRef = React.useRef();
    const resolvedRef:any = ref || defaultRef;

    React.useEffect(() => {
      resolvedRef.current.indeterminate = indeterminate;
    }, [resolvedRef, indeterminate]);

    return (
      <div className="flex items-center">
        <input type="checkbox" ref={resolvedRef} {...rest} className="opacity-0 absolute h-8 w-8 custom__checkbox" />
        <div className="bg-white border-2 border-miru-han-purple-1000 w-5 h-5 flex flex-shrink-0 justify-center items-center mr-2 focus-within:border-blue-500">
          <svg className="custom__checkbox-tick fill-current hidden w-2 h-2 text-miru-han-purple-1000 pointer-events-none" version="1.1" viewBox="0 0 17 12" xmlns="http://www.w3.org/2000/svg">
            <g fill="none" fillRule="evenodd">
              <g transform="translate(-9 -11)" fill="#5B34EA" fillRule="nonzero">
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
      )
    },
    ...columns
  ]);
};

const Table = ({
  tableHeader,
  tableRowArray,
  hasCheckbox = false,
  hasRowIcons=false,
  handleDeleteClick = (id) => {}, // eslint-disable-line
  handleEditClick = (id) => {}, // eslint-disable-line
  rowOnClick = (id) => {} // eslint-disable-line
}) => {

  const data = React.useMemo(() => tableRowArray, [tableRowArray]);
  const columns = React.useMemo(() => tableHeader, []);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow
  } = useTable(
    {
      columns,
      data
    },
    useRowSelect,
    hasCheckbox ? getTableCheckbox : () => {} // eslint-disable-line  @typescript-eslint/no-empty-function
  );

  return (
    <>
      <table className="min-w-full divide-y divide-gray-200 mt-4" {...getTableProps()}>
        <thead>
          {headerGroups.map(headerGroup => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map(column => (
                <th className={`table__header ${column.cssClass}`} {...column.getHeaderProps()}>{column.render("Header")}</th>
              )
              )}
              {hasRowIcons && <th className="table__header"></th> }
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {/* {rows.slice(0, 10).map((row, index) => {  // this will be used when we add the pagination. */}
          {rows.map((row, index) => {
            prepareRow(row);
            const cssClassLastRow = rows.length - 1 !== index ? "border-b": "";
            const cssClassRowHover = hasRowIcons ? "hoverIcon" : "";
            return (
              <tr {...row.getRowProps()} onClick={() => rowOnClick(row.original.rowId)} className={`${cssClassLastRow} ${cssClassRowHover}`}>
                {row.cells.map(cell => <td className="table__cell" {...cell.getCellProps()}>{cell.render("Cell")}</td>)}

                {hasRowIcons && <td className="table__cell">
                  <div className="iconWrapper invisible">
                    <button data-cy="edit-icon" onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleEditClick(row.original.rowId);
                    }}>
                      <Pencil size={16} color="#5b34ea" weight="bold"  />
                    </button>
                    <button data-cy="delete-icon" onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDeleteClick(row.original.rowId);
                    }} className="ml-10">
                      <Trash size={16} color="#5b34ea" weight="bold" data-cy="delete-icon"/>
                    </button>
                  </div>
                </td>
                }
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
};

export default Table;

Table.proptypes = {
  tableHeader: PropTypes.array,
  tableRowArray: PropTypes.array,
  hasCheckbox: PropTypes.bool,
  hasRowIcons: PropTypes.bool,
  handleDeleteClick: PropTypes.func,
  handleEditClick: PropTypes.func,
  rowOnClick: PropTypes.func
};
