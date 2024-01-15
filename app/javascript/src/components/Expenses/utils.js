import React from "react";

import {
  ExpenseIconSVG,
  PaymentsIcon,
  FoodIcon,
  PercentIcon,
  ShieldIcon,
  WrenchIcon,
  FurnitureIcon,
  CarIcon,
  HouseIcon,
} from "miruIcons";

export const Categories = [
  {
    value: "Food",
    label: "Food",
    icon: <FoodIcon size={16} weight="bold" />,
    iconColor: "#F5F7F9",
    color: "#7768AE",
  },
  {
    value: "Salary",
    label: "Salary",
    icon: <PaymentsIcon size={16} weight="bold" />,
    iconColor: "#F5F7F9",
    color: "#7CC984",
  },
  {
    value: "Furniture",
    label: "Furniture",
    icon: <FurnitureIcon size={16} weight="bold" />,
    iconColor: "#F5F7F9",
    color: "#BF1363",
  },
  {
    value: "Repairs & Maintenance",
    label: "Repairs & Maintenance",
    icon: <WrenchIcon size={16} weight="bold" />,
    iconColor: "#F5F7F9",
    color: "#058C42",
  },
  {
    value: "Travel",
    label: "Travel",
    icon: <CarIcon size={16} weight="bold" />,
    iconColor: "#F5F7F9",
    color: "#0E79B2",
  },
  {
    value: "Health Insurance",
    label: "Health Insurance",
    icon: <ShieldIcon size={16} weight="bold" />,
    iconColor: "#4A485A",
    color: "#F2D0E0",
  },
  {
    value: "Rent",
    label: "Rent",
    icon: <HouseIcon size={16} weight="bold" />,
    iconColor: "#F5F7F9",
    color: "#68AEAA",
  },
  {
    value: "Tax",
    label: "Tax",
    icon: <PercentIcon size={16} weight="bold" />,
    iconColor: "#F5F7F9",
    color: "#F39237",
  },
  {
    value: "Other",
    label: "Other",
    icon: <img sizes={16} src={ExpenseIconSVG} />,
    iconColor: "#4A485A",
    color: "#CFE4F0",
  },
];

export const setVendorData = vendors => {
  vendors.map(vendor => {
    vendor.value = vendor.name;
    vendor.label = vendor.name;

    return vendor;
  });
};

export const setCategoryData = rawCategories => {
  const newCategories = rawCategories.map(raw => {
    const matchingCat = Categories.find(
      category => category.value === raw.name
    );

    const newCat = {
      ...raw,
      value: raw.name,
      label: raw.name,
      icon: <img sizes={16} src={ExpenseIconSVG} />,
      ...(matchingCat && {
        icon: matchingCat.icon || <img sizes={16} src={ExpenseIconSVG} />,
        iconColor: matchingCat.iconColor,
        color: matchingCat.color,
      }),
    };
    delete newCat.name;
    delete newCat.default;

    return newCat;
  });

  return newCategories;
};
