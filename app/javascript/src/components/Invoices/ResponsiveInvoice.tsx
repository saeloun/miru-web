import React from "react";
import { useMediaQuery } from "../../hooks/use-media-query";

// Desktop Components
import InvoiceList from "./InvoiceList";
import InvoiceDetails from "./Invoice";
import InvoiceEditor from "./InvoiceEditor";
import GenerateInvoice from "./Generate";

// Mobile Components
import MobileInvoiceDetails from "./Invoice/MobileView";
import MobileGenerateInvoice from "./Generate/MobileView";
import MobileInvoiceEditor from "./Edit/Mobile";

interface ResponsiveInvoiceProps {
  view: "list" | "details" | "edit" | "generate";
  [key: string]: any;
}

export const ResponsiveInvoice: React.FC<ResponsiveInvoiceProps> = ({
  view,
  ...props
}) => {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  switch (view) {
    case "list":
      // List view is already responsive
      return <InvoiceList {...props} />;

    case "details":
      return isDesktop ? (
        <InvoiceDetails {...props} />
      ) : (
        <MobileInvoiceDetails {...props} />
      );

    case "edit":
      return isDesktop ? (
        <InvoiceEditor {...props} />
      ) : (
        <MobileInvoiceEditor {...props} />
      );

    case "generate":
      return isDesktop ? (
        <GenerateInvoice {...props} />
      ) : (
        <MobileGenerateInvoice {...props} />
      );

    default:
      return <InvoiceList {...props} />;
  }
};

// Responsive wrapper for invoice line items
export const ResponsiveInvoiceLineItem: React.FC<any> = props => {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return (
      <tr className="border-b border-gray-200 hover:bg-gray-50">
        <td className="py-3 px-4">{props.description}</td>
        <td className="py-3 px-4 text-right">{props.quantity}</td>
        <td className="py-3 px-4 text-right">{props.rate}</td>
        <td className="py-3 px-4 text-right font-medium">{props.amount}</td>
      </tr>
    );
  }

  return (
    <div className="border-b border-gray-200 p-4">
      <div className="font-medium mb-2">{props.description}</div>
      <div className="flex justify-between text-sm text-gray-600">
        <span>
          {props.quantity} × {props.rate}
        </span>
        <span className="font-medium text-gray-900">{props.amount}</span>
      </div>
    </div>
  );
};

// Responsive invoice card component
export const ResponsiveInvoiceCard: React.FC<any> = props => {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold">{props.invoiceNumber}</h3>
            <p className="text-sm text-gray-600">{props.clientName}</p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700`}
          >
            {props.status}
          </span>
        </div>
        <div className="flex justify-between items-end">
          <div className="text-sm text-gray-600">
            <p>Due: {props.dueDate}</p>
          </div>
          <div className="text-xl font-bold">{props.amount}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-b border-gray-200 p-4 active:bg-gray-50">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold">{props.invoiceNumber}</h3>
        <span
          className={`px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700`}
        >
          {props.status}
        </span>
      </div>
      <p className="text-sm text-gray-600 mb-2">{props.clientName}</p>
      <div className="flex justify-between items-center">
        <p className="text-xs text-gray-500">Due: {props.dueDate}</p>
        <p className="font-bold text-lg">{props.amount}</p>
      </div>
    </div>
  );
};

export default ResponsiveInvoice;
