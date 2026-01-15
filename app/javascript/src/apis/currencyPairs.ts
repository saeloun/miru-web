import axios from "./api";

const getRate = async (from: string, to: string) =>
  axios.get("/currency_pairs/rate", {
    params: { from, to },
  });

const currencyPairsApi = {
  getRate,
};

export default currencyPairsApi;
