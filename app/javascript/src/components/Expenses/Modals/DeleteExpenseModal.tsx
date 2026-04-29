import React from "react";

import { expensesApi } from "apis/api";
import { i18n } from "../../../i18n";
import { useNavigate } from "react-router-dom";
import { Modal, Button } from "StyledComponents";

const DeleteExpenseModal = ({
  setShowDeleteExpenseModal,
  showDeleteExpenseModal,
  expense,
  fetchExpenses,
}) => {
  const navigate = useNavigate();

  const handleDeleteExpense = async () => {
    const res = await expensesApi.destroy(expense.id);
    if (res.status === 200) {
      navigate("/expenses/", { replace: true });
      fetchExpenses();
    }
    setShowDeleteExpenseModal(false);
  };

  return (
    <Modal
      customStyle="sm:my-8 sm:w-full sm:max-w-lg sm:align-middle"
      isOpen={showDeleteExpenseModal}
      onClose={() => setShowDeleteExpenseModal(false)}
    >
      <div className="my-8 flex-col">
        <h6 className="mb-2 text-2xl font-bold">
          {i18n.t("expenses.deleteExpense")}
        </h6>
        <p className="mt-2 font-normal">
          {i18n.t("expenses.deleteExpenseConfirm")}
        </p>
      </div>
      <div className="flex justify-between">
        <Button
          className="mr-2 w-1/2"
          size="medium"
          style="secondary"
          type="button"
          onClick={() => {
            setShowDeleteExpenseModal(false);
          }}
        >
          {i18n.t("cancel").toUpperCase()}
        </Button>
        <Button
          className="ml-2 w-1/2 bg-destructive xsm:text-white"
          size="medium"
          style="ternary"
          type="button"
          onClick={handleDeleteExpense}
        >
          {i18n.t("delete").toUpperCase()}
        </Button>
      </div>
    </Modal>
  );
};

export default DeleteExpenseModal;
