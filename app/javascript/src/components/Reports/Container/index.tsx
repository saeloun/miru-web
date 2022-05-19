import React, { forwardRef } from "react";
import TableRow from "./TableRow";
import { useEntry } from "../context/EntryContext";

// eslint-disable-next-line react/display-name
const Container = forwardRef<HTMLTableElement>((props, ref) => {
  const { entries } = useEntry();

  const getEntryList = () => {
    if (entries.length > 0) {
      return entries.map((timeEntry, index) => (
        <TableRow key={index} {...timeEntry} />
      ));
    }
  };

  return (
    <table className='min-w-full divide-y divide-gray-200 mt-4' ref={ref}>
      <thead>
        <tr className='flex flex-row items-center'>
          <th
            scope='col'
            className='w-2/5 px-6 py-5 text-left text-xs font-normal text-miru-dark-purple-600 tracking-widest'
          >
                PROJECT/
            <br />
                CLIENT
          </th>
          <th
            scope='col'
            className='w-3/5 px-6 py-5 text-left text-xs font-normal text-miru-dark-purple-600 tracking-widest'
          >
                NOTE
          </th>
          <th
            scope='col'
            className='w-1/5 px-6 py-5 text-left text-xs font-normal text-miru-dark-purple-600 tracking-widest'
          >
                TEAM MEMBER/
            <br />
                DATE
          </th>
          <th
            scope='col'
            className='px-6 py-5 text-left text-xs font-normal text-miru-dark-purple-600 tracking-widest'
          >
                HOURS
            <br />
                LOGGED
          </th>
        </tr>
      </thead>
      <tbody className='bg-white divide-y divide-gray-200'>
        {getEntryList()}
      </tbody>
    </table>
  );
}
);

export default Container;
