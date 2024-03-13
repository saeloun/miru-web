import React, { Fragment, useEffect, useState } from "react";

import { Pagination, Toastr } from "StyledComponents";

import expensesApi from "apis/expenses";
import Loader from "common/Loader/index";
import withLayout from "common/Mobile/HOC/withLayout";
import { useUserContext } from "context/UserContext";

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
  const [pagy, setPagy] = useState<any>(null);
  const [expenseData, setExpenseData] = useState<Array<object>>([]);

  const fetchExpenses = async () => {
    const res = await expensesApi.index();
    const data = setCategoryData(res.data.categories);
    res.data.categories = data;
    setVendorData(res.data.vendors);
    setExpenseData(res.data);
    setPagy(res.data.pagy);
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
    if (res.status == 200) {
      fetchExpenses();
    }
  };

  const isFirstPage = () => {
    if (typeof pagy?.first == "boolean") {
      return pagy?.first;
    }

    return pagy?.page == 1;
  };

  const isLastPage = () => {
    if (typeof pagy?.last == "boolean") {
      return pagy?.last;
    }

    return pagy?.last == pagy?.page;
  };

  const handlePageChange = async (pageData, items = pagy.items) => {
    if (pageData == "...") return;

    await expensesApi.index(`page=${pageData}&items=${items}`);
  };

  const handleClickOnPerPage = e => {
    handlePageChange(Number(1), Number(e.target.value));
    setPagy({ ...pagy, items: Number(e.target.value) });
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
          <Header
            clearSearch={fetchExpenses}
            fetchSearchResults={fetchSearchResults}
            setShowAddExpenseModal={setShowAddExpenseModal}
          />
          <Container expenseData={expenseData} />
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
          />
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
