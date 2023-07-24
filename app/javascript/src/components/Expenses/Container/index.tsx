import React from "react";

import ExpensesSummary from "./ExpensesSummary";
import Table from "./Table";

const Container = () => (
  <div className="mt-6">
    <ExpensesSummary />
    <Table />
  </div>
);

export default Container;
