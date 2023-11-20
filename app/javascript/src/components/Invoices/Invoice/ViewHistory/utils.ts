/* eslint-disable no-unused-vars */
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

import invoicesApi from "apis/invoices";

dayjs.extend(utc);
dayjs.extend(timezone);

const calculateTime = (date, dateFormat, timezone) => {
  const now = new Date().getTime();
  const recordCreated = new Date(date).getTime();
  const hour = Math.floor(Math.abs(now - recordCreated) / 3600000);
  if (hour < 24) {
    if (hour <= 1) {
      if (hour < 1) {
        const minutes = Math.round(Math.abs(now - recordCreated) / 60000);

        return minutes == 1
          ? `${minutes} minute ago`
          : `${minutes} minutes ago`;
      }

      return `${hour} hour ago`;
    }

    return `${hour} hours ago`;
  }

  if (24 == hour || hour < 48) {
    return "1 day ago";
  }

  if (hour >= 48) {
    const timeZoneString = timezone;
    const timeZoneOffset = timeZoneString.split("GMT")[1].trim();
    const utcDateTime = dayjs.utc(date);
    const convertedDateTime = utcDateTime.utcOffset(timeZoneOffset);
    const format = `${dateFormat}, hh:mm a`;

    return convertedDateTime.format(format);
  }
};

export const createData = (rawData, company) => {
  const Data = [];

  const processInvoiceEvent = (action, userDisplayName, userEmail, data) => {
    const message = `${userDisplayName}<${userEmail}> ${action}`;
    const time = calculateTime(
      data.createdAt,
      company.date_format,
      company.timezone
    );
    Data.push({ message, time });
  };

  const getEmailList = emails =>
    emails.map(email => `${email.toLowerCase()}`).join(" ");

  rawData.map(data => {
    const userDisplayName = data?.userName ?? "";
    const userEmail = data?.user?.email ?? "";

    switch (data.type) {
      case "create_invoice":
        processInvoiceEvent(
          "created invoice",
          userDisplayName,
          userEmail,
          data
        );
        break;
      case "view_invoice":
        processInvoiceEvent("viewed invoice", userDisplayName, userEmail, data);
        break;
      case "update_invoice":
        processInvoiceEvent(
          "updated invoice",
          userDisplayName,
          userEmail,
          data
        );
        break;
      case "delete_invoice":
        processInvoiceEvent(
          "deleted invoice",
          userDisplayName,
          userEmail,
          data
        );
        break;
      case "download_invoice":
        processInvoiceEvent(
          "downloaded invoice",
          userDisplayName,
          userEmail,
          data
        );
        break;
      case "send_invoice": {
        let message = `${userDisplayName}<${userEmail}> sent invoice`;
        const time = calculateTime(
          data.createdAt,
          company.date_format,
          company.timezone
        );

        const emailList = getEmailList(data.emails);
        if (emailList) {
          message += ` to ${emailList}`;
        }

        Data.push({ message, time });
        break;
      }
      case "create_payment":
        processInvoiceEvent(
          "marked invoice as paid manually",
          userDisplayName,
          userEmail,
          data
        );
        break;
      case "create_stripe_payment":
        processInvoiceEvent(
          "paid via stripe",
          userDisplayName,
          userEmail,
          data
        );
        break;
      case "partially_paid": {
        const partialPaymentMessage = "Partial payment successful";
        const partialPaymentTime = calculateTime(
          data.createdAt,
          company.date_format,
          company.timezone
        );
        Data.push({ message: partialPaymentMessage, time: partialPaymentTime });
        break;
      }
      case "cancelled": {
        const cancellationMessage = `Payment Cancelled ${
          data.name ? `by ${data.name}<${userEmail}>` : ""
        }`;

        const cancellationTime = calculateTime(
          data.createdAt,
          company.date_format,
          company.timezone
        );
        Data.push({ message: cancellationMessage, time: cancellationTime });
        break;
      }
      case "failed": {
        const failedPaymentMessage = "Payment Failed";
        const failedPaymentTime = calculateTime(
          data.createdAt,
          company.date_format,
          company.timezone
        );
        Data.push({ message: failedPaymentMessage, time: failedPaymentTime });
        break;
      }
    }
  });

  return Data;
};

export const getHistory = async (id, company) => {
  const { data } = await invoicesApi.invoiceLogs(id);
  const records = data.trails.concat(data.paymentTrails);
  records.sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  const rawData = records.reverse();
  const logs = createData(rawData, company);

  return logs;
};
