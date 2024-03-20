import React from "react";

import AddEditModalHeader from "common/Mobile/AddEditModalHeader";

import ExpenseForm from "../ExpenseForm";

const AddExpense = ({
  expenseData,
  handleAddExpense,
  setShowAddExpenseModal,
}) => (
  <div className="z-50 flex h-full w-full flex-col">
    <AddEditModalHeader
      title="Add New Expense"
      handleOnClose={() => {
        setShowAddExpenseModal(false);
      }}
    />
    <ExpenseForm
      dateFormat="MM-DD-YYYY"
      expenseData={expenseData}
      handleFormAction={handleAddExpense}
    />
  </div>
);

export default AddExpense;
