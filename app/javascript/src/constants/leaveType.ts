import {
  CakeIcon,
  CalendarBlackIcon,
  CarIcon,
  VacationIcon,
  FlowerIcon,
  UserSVGIcon,
  MedicineIcon,
  BabyIcon,
} from "miruIcons";

export const leaveTypes = [
  {
    value: "annual",
    label: "Annual leaves",
  },
  {
    value: "sick",
    label: "Sick leaves",
  },
  {
    value: "maternity",
    label: "Maternity leave",
  },
  {
    value: "paternity",
    label: "Paternity leave",
  },
  {
    value: "period",
    label: "Period leave",
  },
];

export const leaveColors = [
  {
    value: "#0E79B2",
    label: "Annual leaves",
  },
  {
    value: "#BF1363",
    label: "Sick leaves",
  },
  {
    value: "#F39237",
    label: "Maternity leave",
  },
  {
    value: "#058C42",
    label: "Paternity leave",
  },
  {
    value: "#7768AE",
    label: "Period leave",
  },
  {
    value: "#68AEAA",
    label: "Period leave",
  },
  {
    value: "#C97CC1",
    label: "Period leave",
  },
  {
    value: "#7CC984",
    label: "Period leave",
  },
];

export const leaveIcons = [
  { value: "calendar", label: "label", icon: CalendarBlackIcon },
  { value: "cake", label: "label2", icon: CakeIcon },
  { value: "vacation", label: "label3", icon: VacationIcon },
  { value: "medicine", label: "label4", icon: MedicineIcon },
  { value: "baby", label: "label5", icon: BabyIcon },
  { value: "flower", label: "label6", icon: FlowerIcon },
  { value: "car", label: "label7", icon: CarIcon },
  { value: "user", label: "label8", icon: UserSVGIcon },
];

export const repitationTypeObj = {
  per_month: "per month",
  per_year: "per year",
  per_week: "per week",
  per_quarter: "per quarter",
};

export const countTypeOptions = [
  { value: "days", label: "days" },
  { value: "weeks", label: "weeks" },
  { value: "months", label: "months" },
];

export const repetitionType = [
  { value: "per_week", label: "per week" },
  { value: "per_month", label: "per month" },
  { value: "per_quarter", label: "per quarter" },
  { value: "per_year", label: "per year" },
];

export const quarter_one = [
  {
    id: 0,
    name: "January",
  },
  {
    id: 1,
    name: "February",
  },
  {
    id: 2,
    name: "March",
  },
];

export const quarter_two = [
  {
    id: 3,
    name: "April",
  },
  {
    id: 4,
    name: "May",
  },
  {
    id: 5,
    name: "June",
  },
];

export const quarter_three = [
  {
    id: 6,
    name: "July",
  },
  {
    id: 7,
    name: "August",
  },
  {
    id: 8,
    name: "September",
  },
];

export const quarter_four = [
  {
    id: 9,
    name: "October",
  },
  {
    id: 10,
    name: "November",
  },
  {
    id: 11,
    name: "December",
  },
];

export const yearCalendar = {
  0: {
    name: "Jan - Mar",
    quarter: quarter_one,
  },
  1: {
    name: "Apr - Jun",
    quarter: quarter_two,
  },
  2: {
    name: "Jul - Sept",
    quarter: quarter_three,
  },
  3: {
    name: "Oct - Dec",
    quarter: quarter_four,
  },
};
