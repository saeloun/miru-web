import React, { Fragment, useEffect, useState } from "react";

import expensesApi from "apis/expenses";
import Loader from "common/Loader";
import withLayout from "common/Mobile/HOC/withLayout";
import { useUserContext } from "context/UserContext";

import Container from "./Container";
import Header from "./Header";

import AddExpenseModal from "../Modals/AddExpenseModal";
import AddExpense from "../Modals/Mobile/AddExpense";
import { setCategoryData, setVendorData } from "../utils";

const Expenses = () => {
  const { isDesktop } = useUserContext();
  const [showAddExpenseModal, setShowAddExpenseModal] =
    useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [expenseData, setExpenseData] = useState<Array<object>>([]);

  const fetchExpenses = async () => {
    const res = await expensesApi.index();
    const data = setCategoryData(res.data.categories);
    res.data.categories = data;
    setVendorData(res.data.vendors);
    setExpenseData(res.data);
    setIsLoading(false);
  };

  const handleAddExpense = async payload => {
    await expensesApi.create(payload);
    setShowAddExpenseModal(false);
    fetchExpenses();
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const ExpensesLayout = () => (
    <div className="h-full p-4 lg:p-0">
      {isLoading ? (
        <Loader />
      ) : (
        <Fragment>
          <Header setShowAddExpenseModal={setShowAddExpenseModal} />
          <Container expenseData={expenseData} />
          {showAddExpenseModal && (
            <AddExpenseModal
              expenseData={expenseData}
              handleAddExpense={handleAddExpense}
              setShowAddExpenseModal={setShowAddExpenseModal}
              showAddExpenseModal={showAddExpenseModal}
            />
          )}
        </Fragment>
      )}
    </div>
  );

  const Main = withLayout(ExpensesLayout, !isDesktop, !isDesktop);

  if (!isDesktop) {
    if (showAddExpenseModal) {
      return (
        <AddExpense
          expenseData={expenseData}
          handleAddExpense={handleAddExpense}
          setShowAddExpenseModal={setShowAddExpenseModal}
        />
      );
    }

    return <Main />;
  }

  return isDesktop ? ExpensesLayout() : <Main />;
};

export default Expenses;
