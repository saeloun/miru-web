import React, { useEffect } from "react";
import { useTable, useRowSelect } from "react-table";

const IndeterminateCheckbox = React.forwardRef( // eslint-disable-line react/display-name
  ({ cssClass, indeterminate, ...rest }: any, ref) => {
    const defaultRef = React.useRef();
    const resolvedRef: any = ref || defaultRef;

    React.useEffect(() => {
      resolvedRef.current.indeterminate = indeterminate;
    }, [resolvedRef, indeterminate]);

    return (
      <div className="flex items-center">
        <input type="checkbox" ref={resolvedRef} {...rest} className="opacity-0 absolute h-8 w-8 custom__checkbox" />
        <div className={`bg-white border-2 border-miru-han-purple-1000 flex flex-shrink-0 justify-center items-center mr-2 focus-within:border-blue-500 ${cssClass}`}>
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

const getTableCheckbox = checkboxCss => hooks => {
  hooks.visibleColumns.push(columns => [
    {
      id: "selection",
      Header: ({ getToggleAllRowsSelectedProps }) => (
        <div>
          <IndeterminateCheckbox cssClass={checkboxCss} {...getToggleAllRowsSelectedProps()} />
        </div>
      ),
      Cell: ({ row }) => (
        <div>
          <IndeterminateCheckbox cssClass={checkboxCss} {...row.getToggleRowSelectedProps()} />
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
  checkboxCss = "",
  tableCss = "",
  showRowBorder = true,
  setSelectedRows = null
}) => {

  const data = React.useMemo(() => tableRowArray, []);
  const columns = React.useMemo(() => tableHeader, []);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    selectedFlatRows
  } = useTable(
    {
      columns,
      data
    },
    useRowSelect,
    hasCheckbox ? getTableCheckbox(checkboxCss) : () => { } // eslint-disable-line  @typescript-eslint/no-empty-function
  );

  useEffect(() => {
    setSelectedRows(selectedFlatRows);
  }, [selectedFlatRows]);

  return (
    <>
      <table className={`min-w-full ${tableCss}`} {...getTableProps()}>
        <thead>
          {headerGroups.map(headerGroup => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map(column => (
                <th className={`table__header px-0 py-3 ${column.cssClass}`} {...column.getHeaderProps()}>{column.render("Header")}</th>
              )
              )}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {rows.slice(0, 10).map((row, index) => {
            prepareRow(row);
            const isLastChild = rows.length - 1 !== index;
            return (
              <tr {...row.getRowProps()} className={showRowBorder ? isLastChild ? "border-b" : "" : ""}>
                {row.cells.map(cell => <td className={`table__cell px-0 py-3 ${cell.cssClass}`} {...cell.getCellProps()}>{cell.render("Cell")}</td>)}
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
};

export default Table;
