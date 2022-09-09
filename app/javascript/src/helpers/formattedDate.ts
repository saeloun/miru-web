import dayjs from "dayjs";

export const formattedDate = (date) => dayjs(date).format("DD.MM.YYYY");
