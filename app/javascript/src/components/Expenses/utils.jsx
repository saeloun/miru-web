import React from "react";
import PropTypes from "prop-types";

import JSZip from "jszip";
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
import { Toastr } from "StyledComponents";

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

export const unmapExpenseListForDropdown = input => {
  const ExpenseList = input.data.expenses;

  return ExpenseList.map(item => ({
    label: item.categoryName,
    value: item.id,
    date: item.date,
    amount: item.amount,
  }));
};

export const FileDownloader = ({ fileUrl }) => {
  // Extracting filename from URL
  const fileName = fileUrl.substring(fileUrl.lastIndexOf("/") + 1);
  const handleDownload = async () => {
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();

      // Creating a URL for the blob
      const url = window.URL.createObjectURL(blob);

      // Creating a link element
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();

      //cleanup
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      Toastr.error("Error downloading file");
    }
  };

  return <span onClick={handleDownload}>{fileName}</span>;
};

FileDownloader.propTypes = {
  fileUrl: PropTypes.string.isRequired,
};

export const DownloadAll = async fileUrls => {
  try {
    const fetchBlobs = async () => {
      const blobs = [];

      //Creating array of URLs for blob
      for (const fileUrl of fileUrls) {
        const response = await fetch(fileUrl);
        const blob = await response.blob();
        const fileName = fileUrl.substring(fileUrl.lastIndexOf("/") + 1);
        blobs.push({ fileName, blob });
      }

      return blobs;
    };

    //Array of blob URLs
    const fetchedFiles = await fetchBlobs();

    //Creating zip
    const createZipBlob = async files => {
      const zip = new JSZip();

      files.forEach(({ fileName, blob }) => {
        zip.file(fileName, blob);
      });

      return await zip.generateAsync({ type: "blob" });
    };

    //Creating zip URL
    const zipBlob = await createZipBlob(fetchedFiles);
    const zipUrl = window.URL.createObjectURL(zipBlob);

    // Creating a link element and downloading zip file
    const link = document.createElement("a");
    link.href = zipUrl;
    link.setAttribute("download", "Receipt(s).zip");
    document.body.appendChild(link);

    link.click();

    //cleanup
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(zipUrl);
  } catch {
    Toastr.error("Error downloading file");
  }
};
