import React from "react";

import { XIcon } from "miruIcons";
import { Button, Modal } from "StyledComponents";

import { i18n } from "../../../i18n";
import ExpenseForm from "./ExpenseForm";

const AddExpenseModal = ({
  showAddExpenseModal,
  setShowAddExpenseModal,
  expenseData,
  handleAddExpense,
}) => (
  <Modal
    customStyle="sm:my-8 sm:w-full sm:max-w-lg sm:align-middle overflow-visible"
    isOpen={showAddExpenseModal}
    onClose={() => setShowAddExpenseModal(false)}
  >
    <div className="modal__position m-0">
      <span className="modal__title">{i18n.t("expenses.newExpense")}</span>
      <Button style="ternary" onClick={() => setShowAddExpenseModal(false)}>
        <XIcon className="text-foreground" size={15} />
      </Button>
    </div>
    <div className="modal__form m-0 flex-col">
      <ExpenseForm
        dateFormat="MM-DD-YYYY"
        expenseData={expenseData}
        handleFormAction={handleAddExpense}
      />
    </div>
  </Modal>
);

export default AddExpenseModal;
