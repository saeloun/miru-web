import { invoicesApi } from "apis/api";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

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

  const processInvoiceEvent = (action, data) => {
    const userDisplayName = data?.userName ?? "";
    const userEmail = data?.user?.email ?? "";
    let message = `${userDisplayName}<${userEmail}> ${action}`;
    const time = calculateTime(
      data.createdAt,
      company.date_format,
      company.timezone
    );
    if (data.type == "send_invoice") {
      const emailList = getEmailList(data.emails);
      if (emailList) {
        message += ` to ${emailList}`;
      }
      Data.push({ message, time });
    } else {
      Data.push({ message, time });
    }
  };

  const getEmailList = emails =>
    emails.map(email => `${email.toLowerCase()}`).join(" ");

  rawData.map(data => {
    switch (data.type) {
      case "create_invoice":
        processInvoiceEvent("created invoice", data);
        break;
      case "view_invoice":
        processInvoiceEvent("viewed invoice", data);
        break;
      case "update_invoice":
        processInvoiceEvent("updated invoice", data);
        break;
      case "delete_invoice":
        processInvoiceEvent("deleted invoice", data);
        break;
      case "download_invoice":
        processInvoiceEvent("downloaded invoice", data);
        break;
      case "send_invoice":
        processInvoiceEvent("sent invoice", data);
        break;
      case "create_payment":
        processInvoiceEvent("marked invoice as paid manually", data);
        break;
      case "create_stripe_payment":
        processInvoiceEvent("paid via stripe", data);
        break;
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
