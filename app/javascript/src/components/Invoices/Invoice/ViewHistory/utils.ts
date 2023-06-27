import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const calculateTime = date => {
  const now = new Date().getTime();
  const recordCreated = new Date(date).getTime();
  const hour = Math.floor(Math.abs(now - recordCreated) / 3600000);
  if (hour < 24) {
    if (hour == 1) {
      return `${hour} hour ago`;
    }

    return `${hour} hours ago`;
  }

  if (24 == hour || hour < 48) {
    return "1 day ago";
  }

  if (hour >= 48) {
    return dayjs(date).format("MMMM DD, HH:mm");
  }
};

export const createData = rawData => {
  const Data = [];
  rawData.map(data => {
    switch (data.type) {
      case "create_invoice": {
        const message = `${data.userName} created invoice`;
        const time = calculateTime(data.createdAt);
        Data.push({ message, time });
        break;
      }
      case "view_invoice": {
        const message = `${data.userName} viewed invoice`;
        const time = calculateTime(data.createdAt);
        Data.push({ message, time });
        break;
      }
      case "update_invoice": {
        const message = `${data.userName} updated invoice`;
        const time = calculateTime(data.createdAt);
        Data.push({ message, time });
        break;
      }
      case "delete_invoice": {
        const message = `${data.userName} deleted invoice`;
        const time = calculateTime(data.createdAt);
        Data.push({ message, time });
        break;
      }
      case "download_invoice": {
        const message = `${data.userName} downloaded invoice`;
        const time = calculateTime(data.createdAt);
        Data.push({ message, time });
        break;
      }
      case "send_invoice": {
        const message = `${data.userName} sent invoice`;
        const time = calculateTime(data.createdAt);
        Data.push({ message, time });
        break;
      }
      case "pay_invoice": {
        const message = `${data.userName} marked invoice as paid`;
        const time = calculateTime(data.createdAt);
        Data.push({ message, time });
        break;
      }
    }
  });

  return Data;
};
