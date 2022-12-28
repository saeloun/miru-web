/* eslint-disable @typescript-eslint/no-unused-vars */
import accountsAgingApi from "apis/reports/accountsAging";
import { Toastr } from "common/Toastr";

const getReportData = async ({
  setClientList,
  setTotalAmount,
  setCurrency,
}) => {
  try {
    const res = await accountsAgingApi.get();
    const { clients, total_amount_overdue, base_currency } = res.data.report;

    setClientList(clients);
    setTotalAmount(total_amount_overdue);
    setCurrency(base_currency);
  } catch (error) {
    Toastr.error(error.message);
  }
};

export default getReportData;
