import React from "react";

import EmptyStates from "common/EmptyStates";

import ExpensesSummary from "./ExpensesSummary";
import Table from "./Table";

const Container = ({ expenseData }) => (
  <div className="mt-6">
    <ExpensesSummary />
    {expenseData?.expenses?.length > 0 ? (
      <Table expenses={expenseData?.expenses} />
    ) : (
      <EmptyStates
        Message="Looks like there aren’t any expenses added yet."
        messageClassName="w-full lg:mt-5"
        showNoSearchResultState={false}
        wrapperClassName="mt-5"
      />
    )}
  </div>
);

export default Container;
