import React from "react";

import { Modal, Button } from "StyledComponents";

const DeleteExpenseModal = ({
  setShowDeleteExpenseModal,
  showDeleteExpenseModal,
  handleDeleteExpense,
}) => (
  <Modal
    customStyle="sm:my-8 sm:w-full sm:max-w-lg sm:align-middle"
    isOpen={showDeleteExpenseModal}
    onClose={() => setShowDeleteExpenseModal(false)}
  >
    <div className="my-8 flex-col">
      <h6 className="mb-2 text-2xl font-bold">Delete Expense</h6>
      <p className="mt-2 font-normal">
        Are you sure you want to delete this expense?
        <br /> This action cannot be reversed.
      </p>
    </div>
    <div className="flex justify-between">
      <Button
        className="mr-2 w-1/2"
        size="medium"
        style="secondary"
        onClick={() => {
          setShowDeleteExpenseModal(false);
        }}
      >
        CANCEL
      </Button>
      <Button
        className="ml-2 w-1/2 bg-miru-red-400 xsm:text-white"
        size="medium"
        style="ternary"
        onClick={handleDeleteExpense}
      >
        DELETE
      </Button>
    </div>
  </Modal>
);

export default DeleteExpenseModal;
