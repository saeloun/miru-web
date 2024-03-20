import React from "react";

import { XIcon } from "miruIcons";
import { Button, Modal } from "StyledComponents";

import ExpenseForm from "./ExpenseForm";

const EditExpenseModal = ({
  showEditExpenseModal,
  setShowEditExpenseModal,
  expenseData,
  handleEditExpense,
  expense,
}) => (
  <Modal
    customStyle="sm:my-8 sm:w-full sm:max-w-lg sm:align-middle overflow-visible"
    isOpen={showEditExpenseModal}
    onClose={() => setShowEditExpenseModal(false)}
  >
    <div className="modal__position m-0">
      <span className="modal__title">Edit Expense</span>
      <Button style="ternary" onClick={() => setShowEditExpenseModal(false)}>
        <XIcon className="text-miru-dark-purple-1000" size={15} />
      </Button>
    </div>
    <div className="modal__form m-0 flex-col">
      <ExpenseForm
        dateFormat="MM-DD-YYYY"
        expense={expense}
        expenseData={expenseData}
        handleFormAction={handleEditExpense}
      />
    </div>
  </Modal>
);

export default EditExpenseModal;
