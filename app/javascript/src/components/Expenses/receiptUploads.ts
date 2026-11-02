import { i18n } from "../../i18n";

export const RECEIPT_ACCEPT = ".jpg,.jpeg,.png,.webp,.pdf,.csv,.xls,.xlsx";

export const receiptUploadError = (files: File[], existingCount: number) => {
  if (existingCount + files.length > 10) {
    return i18n.t("expenses.tooManyReceipts");
  }

  if (files.some(file => file.size > 10 * 1024 * 1024)) {
    return i18n.t("expenses.receiptTooLarge");
  }

  if (
    files.some(
      file =>
        !RECEIPT_ACCEPT.split(",").some(extension =>
          file.name.toLowerCase().endsWith(extension)
        )
    )
  ) {
    return i18n.t("expenses.unsupportedReceiptFormat");
  }

  return "";
};
