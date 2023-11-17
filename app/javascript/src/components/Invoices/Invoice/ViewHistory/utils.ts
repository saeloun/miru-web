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

  rawData.map(data => {
    const userDisplayName = data?.userName ?? "";
    const userEmail = data?.user?.email ?? "";
    switch (data.type) {
      case "create_invoice": {
        const message = `${userDisplayName}<${userEmail}> created invoice`;
        const time = calculateTime(
          data.createdAt,
          company.date_format,
          company.timezone
        );
        Data.push({ message, time });
        break;
      }
      case "view_invoice": {
        const message = `${userDisplayName}<${userEmail}> viewed invoice`;
        const time = calculateTime(
          data.createdAt,
          company.date_format,
          company.timezone
        );
        Data.push({ message, time });
        break;
      }
      case "update_invoice": {
        const message = `${userDisplayName}<${userEmail}> updated invoice`;
        const time = calculateTime(
          data.createdAt,
          company.date_format,
          company.timezone
        );
        Data.push({ message, time });
        break;
      }
      case "delete_invoice": {
        const message = `${userDisplayName}<${userEmail}> deleted invoice`;
        const time = calculateTime(
          data.createdAt,
          company.date_format,
          company.timezone
        );
        Data.push({ message, time });
        break;
      }
      case "download_invoice": {
        const message = `${userDisplayName}<${userEmail}> downloaded invoice`;
        const time = calculateTime(
          data.createdAt,
          company.date_format,
          company.timezone
        );
        Data.push({ message, time });
        break;
      }
      case "send_invoice": {
        let message = `${userDisplayName}<${userEmail}> sent invoice`;
        const time = calculateTime(
          data.createdAt,
          company.date_format,
          company.timezone
        );

        if (Array.isArray(data.emails) && data.emails.length > 0) {
          const emailList = data.emails
            .map(email => `${email.toLowerCase()}`)
            .join(" ");
          message += ` to ${emailList}`;
        }

        Data.push({ message, time });
        break;
      }
      case "create_payment": {
        const message = `${userDisplayName}<${userEmail}>
         marked invoice as paid manually`;

        const time = calculateTime(
          data.createdAt,
          company.date_format,
          company.timezone
        );
        Data.push({ message, time });
        break;
      }
      case "create_stripe_payment": {
        const message = `${userDisplayName}<${userEmail}> paid via stripe`;

        const time = calculateTime(
          data.createdAt,
          company.date_format,
          company.timezone
        );
        Data.push({ message, time });
        break;
      }

      case "partially_paid": {
        const message = "Partial payment successful";
        const time = calculateTime(
          data.createdAt,
          company.date_format,
          company.timezone
        );
        Data.push({ message, time });
        break;
      }
      case "cancelled": {
        const message = `Payment Cancelled ${
          data.name ? `by ${data.name}<${userEmail}>` : ""
        }`;

        const time = calculateTime(
          data.createdAt,
          company.date_format,
          company.timezone
        );
        Data.push({ message, time });
        break;
      }
      case "failed": {
        const message = "Payment Failed";
        const time = calculateTime(
          data.createdAt,
          company.date_format,
          company.timezone
        );
        Data.push({ message, time });
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
