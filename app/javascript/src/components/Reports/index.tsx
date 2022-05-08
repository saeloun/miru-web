import React, { useState, useEffect } from "react";

import { setAuthHeaders, registerIntercepts } from "apis/axios";
import reports from "apis/reports";
import EntryContext from './context/EntryContext';

import Header from './Header';
import Container from "./Container";
import Filters from './Filters';

import { ITimeEntry } from "./interface";

const Reports = () => {
  const [timeEntries, setTimeEntries] = useState<Array<ITimeEntry>>([]);
  const [isFilterVisible, setFilterVisibilty] = useState<Boolean>(false)
  const fetchTimeEntries = async () => {
    const res = await reports.get();
    if (res.status == 200) {
      setTimeEntries(res.data.entries);
    }
  };

  useEffect(() => {
    setAuthHeaders();
    registerIntercepts();
    fetchTimeEntries();
  }, []);

  return (
    <div>
      <EntryContext.Provider value={{ entries: timeEntries }}>
        <Header setFilterVisibilty={setFilterVisibilty} isFilterVisible={isFilterVisible} />
        <Container />
        {isFilterVisible && <Filters setFilterVisibilty={setFilterVisibilty} />}
      </EntryContext.Provider>
    </div>
  )
}

export default Reports;
