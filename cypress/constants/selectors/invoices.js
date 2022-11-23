import { dataCy } from "../../support/utils/datacy";

export const invoicesSelector = {
  invoicesHeading: dataCy('header__invoices'),
  newInvoiceButton: dataCy('new-invoice-button'),
  invoicesList: dataCy('invoices-list'),
  selectAllInvoices: dataCy('select-all-checkbox'),
  addClientButton: dataCy('add-client-button'),
  invoiceNumberField: dataCy('invoice-number'),
  newLineItemButton: dataCy('new-line-item'),
  entriesList: dataCy('entries-list'),
  saveInvoice: dataCy('save-invoice'),
  sendInvoice: dataCy('send-invoice'),
  sendEmail: dataCy('send-email'),
  searchBar: dataCy('search-invoice'),
  edit: dataCy('edit-invoice'),
  editNewLineItem: dataCy('edit-new-line-item'),
  saveInvoiceEdit: dataCy('save-invoice-edit'),
  entriesListEdit: dataCy('entries-list-edit'),
  referenceInput:dataCy('invoice-reference')
}
