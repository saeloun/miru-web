import {
  CakeIconSVG,
  CalendarBlackIconSVG,
  CarIconSVG,
  VacationIconSVG,
  FlowerIconSVG,
  UserIconSVG,
  MedicineIconSVG,
  BabyIconSVG,
  ShieldSVG,
  HelpIconSVG,
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
    label: "chart_blue",
  },
  {
    value: "#BF1363",
    label: "chart_pink",
  },
  {
    value: "#F39237",
    label: "chart_orange",
  },
  {
    value: "#058C42",
    label: "chart_green",
  },
  {
    value: "#7768AE",
    label: "chart_purple",
  },
  {
    value: "#68AEAA",
    label: "chart_light_blue",
  },
  {
    value: "#C97CC1",
    label: "chart_light_pink",
  },
  {
    value: "#7CC984",
    label: "chart_light_green",
  },
];

export const leaveIcons = [
  { value: "calendar", label: "label", icon: CalendarBlackIconSVG },
  { value: "cake", label: "label2", icon: CakeIconSVG },
  { value: "vacation", label: "label3", icon: VacationIconSVG },
  { value: "medicine", label: "label4", icon: MedicineIconSVG },
  { value: "baby", label: "label5", icon: BabyIconSVG },
  { value: "flower", label: "label6", icon: FlowerIconSVG },
  { value: "car", label: "label7", icon: CarIconSVG },
  { value: "user", label: "label8", icon: UserIconSVG },
];

export const holidayColors = [
  {
    label: "national",
    value: "#7CC984",
  },
  {
    label: "optional",
    value: "#68AEAA",
  },
];

export const holidayIcons = [
  {
    label: "national",
    icon: ShieldSVG,
  },
  {
    label: "optional",
    icon: HelpIconSVG,
  },
];

export const getAllocationPeriod = selectedFrequency => {
  switch (selectedFrequency) {
    case "per_week":
      return [{ value: "days", label: "days" }];
    case "per_month":
    case "per_quarter":
      return [
        { value: "days", label: "days" },
        { value: "weeks", label: "weeks" },
      ];
    case "per_year":
      return [
        { value: "days", label: "days" },
        { value: "weeks", label: "weeks" },
        { value: "months", label: "months" },
      ];
    default:
      return [
        { value: "days", label: "days" },
        { value: "weeks", label: "weeks" },
        { value: "months", label: "months" },
      ];
  }
};

export const allocationPeriod = [
  { value: "days", label: "days" },
  { value: "weeks", label: "weeks" },
  { value: "months", label: "months" },
];

export const allocationFrequency = [
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
