import axios from "./api";

const path = "/invoices";

const get = async (query = "") =>
  axios.get(query ? `${path}?${query}` : `${path}`);

const post = async body => axios.post(`${path}`, body);

const patch = async (id, body) => axios.post(`${path}/${id}`, body);

const destroy = id => axios.delete(`${path}/${id}`);

const destroyBulk = invoice_ids =>
  axios.post(`${path}/bulk_deletion`, invoice_ids);

const getInvoice = async id => axios.get(`${path}/${id}`);

const editInvoice = async id => axios.get(`${path}/${id}/edit`);

const downloadInvoice = async id =>
  await axios.get(`${path}/${id}/download`, { responseType: "blob" });

const bulkDownloadInvoices = async queryString =>
  await axios.get(`${path}/bulk_download?${queryString}`);

const updateInvoice = async (id, body) => axios.patch(`${path}/${id}/`, body);

const sendInvoice = async (id, payload) =>
  axios.post(`${path}/${id}/send_invoice`, payload);

const viewInvoice = async id => axios.get(`${path}/${id}/view`);

const paymentSuccess = async id => axios.get(`${path}/${id}/payments/success`);

const wavieInvoice = async id => axios.patch(`${path}/waived/${id}`);

const invoiceLogs = async id => axios.get(`${path}/action_trails/${id}`);
const sendReminder = async (id, payload) =>
  await axios.post(`${path}/${id}/send_reminder`, payload);

const getDownloadStatus = async downloadId =>
  axios.get(`invoices/bulk_download/status`, {
    params: { download_id: downloadId },
  });

const getMonthlyRevenue = async () =>
  axios.get(`${path}/analytics/monthly_revenue`);

const getRevenueByStatus = async () =>
  axios.get(`${path}/analytics/revenue_by_status`);

const getRecentlyUpdated = async (page = 1, perPage = 10) =>
  axios.get(`${path}/recently_updated`, {
    params: { page, per_page: perPage },
  });

const invoicesApi = {
  get,
  post,
  patch,
  destroy,
  sendInvoice,
  getInvoice,
  destroyBulk,
  editInvoice,
  updateInvoice,
  downloadInvoice,
  bulkDownloadInvoices,
  viewInvoice,
  paymentSuccess,
  wavieInvoice,
  invoiceLogs,
  sendReminder,
  getDownloadStatus,
  getMonthlyRevenue,
  getRevenueByStatus,
  getRecentlyUpdated,
};

export default invoicesApi;
