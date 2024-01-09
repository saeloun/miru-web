import React from "react";

import AddEditModalHeader from "common/Mobile/AddEditModalHeader";

import ExpenseForm from "../ExpenseForm";

const EditExpense = ({
  expenseData,
  handleEditExpense,
  setShowEditExpenseModal,
  expense,
}) => (
  <div className="z-50 flex h-full w-full flex-col">
    <AddEditModalHeader
      title="Edit Expense"
      handleOnClose={() => {
        setShowEditExpenseModal(false);
      }}
    />
    <ExpenseForm
      dateFormat="MM-DD-YYYY"
      expense={expense}
      expenseData={expenseData}
      handleFormAction={handleEditExpense}
    />
  </div>
);

export default EditExpense;
