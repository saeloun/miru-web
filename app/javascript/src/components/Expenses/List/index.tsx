import React, { useEffect, useState } from "react";

import expensesApi from "apis/expenses";
import Loader from "common/Loader/index";
import withLayout from "common/Mobile/HOC/withLayout";
import { useUserContext } from "context/UserContext";
import { Toastr } from "StyledComponents";

import Container from "./Container";
import Header from "./Header";

import AddExpenseModal from "../Modals/AddExpenseModal";
import AddExpense from "../Modals/Mobile/AddExpense";
import {
  setCategoryData,
  setVendorData,
  unmapExpenseListForDropdown,
} from "../utils";

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

  const fetchSearchResults = async (
    searchString,
    updateExpenseData = false
  ) => {
    try {
      const res = await expensesApi.index(`query=${searchString}`);
      if (updateExpenseData) {
        setExpenseData(res.data);
      } else {
        const dropdownList = unmapExpenseListForDropdown(res);

        return dropdownList;
      }
    } catch {
      Toastr.error("Couldn't complete search");
    }
  };

  const handleAddExpense = async payload => {
    const res = await expensesApi.create(payload);
    setShowAddExpenseModal(false);
    setIsLoading(true);
    if (res.status == 200) {
      fetchExpenses();
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-80v w-full flex-col justify-center">
        <Loader />
      </div>
    );
  }

  const ExpensesLayout = () => (
    <div className="flex h-full flex-col justify-between p-4 lg:p-0">
      <Header
        clearSearch={fetchExpenses}
        fetchSearchResults={fetchSearchResults}
        setShowAddExpenseModal={setShowAddExpenseModal}
      />
      <Container expenseData={expenseData} fetchExpenses={fetchExpenses} />
      {/* TODO: Fix pagination backend (missing attributes: items,page) and uncomment
      <Pagination
        isPerPageVisible
        currentPage={pagy?.page}
        handleClick={handlePageChange}
        handleClickOnPerPage={handleClickOnPerPage}
        isFirstPage={isFirstPage()}
        isLastPage={isLastPage()}
        itemsPerPage={pagy?.items}
        nextPage={pagy?.next}
        prevPage={pagy?.prev}
        title="expenses/page"
        totalPages={pagy?.pages}
      /> */}
      {showAddExpenseModal && (
        <AddExpenseModal
          expenseData={expenseData}
          handleAddExpense={handleAddExpense}
          setShowAddExpenseModal={setShowAddExpenseModal}
          showAddExpenseModal={showAddExpenseModal}
        />
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
