import React, { useEffect, useState } from "react";

import Logger from "js-logger";
import { useNavigate, useParams } from "react-router-dom";

import expensesApi from "apis/expenses";
import { useUserContext } from "context/UserContext";

import Expense from "./Expense";
import Header from "./Header";

import DeleteExpenseModal from "../Modals/DeleteExpenseModal";
import EditExpenseModal from "../Modals/EditExpenseModal";
import EditExpense from "../Modals/Mobile/EditExpense";
import { setCategoryData, setVendorData } from "../utils";

const ExpenseDetails = () => {
  const [showDeleteExpenseModal, setShowDeleteExpenseModal] =
    useState<boolean>(false);

  const [showEditExpenseModal, setShowEditExpenseModal] =
    useState<boolean>(false);
  const [expense, setExpense] = useState<any>();
  const [expenseData, setExpenseData] = useState<any>();

  const params = useParams();
  const navigate = useNavigate();
  const { company, isDesktop } = useUserContext();

  const fetchExpense = async () => {
    try {
      const resData = await expensesApi.show(params.expenseId);
      const res = await expensesApi.index();
      const data = setCategoryData(res.data.categories);
      res.data.categories = data;
      setVendorData(res.data.vendors);
      setExpenseData(res.data);
      setExpense(resData.data);
    } catch (e) {
      Logger.error(e);
      navigate("/expenses");
    }
  };

  const getExpenseData = async () => {
    try {
      const res = await expensesApi.index();
      const data = setCategoryData(res.data.categories);
      res.data.categories = data;
      setVendorData(res.data.vendors);
      setExpenseData(res.data);
    } catch (e) {
      Logger.error(e);
      setShowEditExpenseModal(false);
    }
  };

  const handleEditExpense = async payload => {
    await expensesApi.update(expense.id, payload);
    setShowEditExpenseModal(false);
    fetchExpense();
  };

  const handleDeleteExpense = async () => {
    await expensesApi.destroy(expense.id);
    navigate("/expenses");
  };

  const handleDelete = () => {
    setShowDeleteExpenseModal(true);
  };

  const handleEdit = () => {
    setShowEditExpenseModal(true);
  };

  useEffect(() => {
    fetchExpense();
    getExpenseData();
  }, []);

  return (
    <div>
      {!isDesktop && showEditExpenseModal ? null : (
        <div>
          <Header
            expense={expense}
            handleDelete={handleDelete}
            handleEdit={handleEdit}
          />
          <Expense currency={company.base_currency} expense={expense} />
        </div>
      )}
      {showEditExpenseModal &&
        (isDesktop ? (
          <EditExpenseModal
            expense={expense}
            expenseData={expenseData}
            handleEditExpense={handleEditExpense}
            setShowEditExpenseModal={setShowEditExpenseModal}
            showEditExpenseModal={showEditExpenseModal}
          />
        ) : (
          <EditExpense
            expense={expense}
            expenseData={expenseData}
            handleEditExpense={handleEditExpense}
            setShowEditExpenseModal={setShowEditExpenseModal}
          />
        ))}
      {showDeleteExpenseModal && (
        <DeleteExpenseModal
          handleDeleteExpense={handleDeleteExpense}
          setShowDeleteExpenseModal={setShowDeleteExpenseModal}
          showDeleteExpenseModal={showDeleteExpenseModal}
        />
      )}
    </div>
  );
};

export default ExpenseDetails;
