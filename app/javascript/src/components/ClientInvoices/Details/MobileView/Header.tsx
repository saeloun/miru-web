import React from "react";

import { ArrowLeftIcon } from "miruIcons";
import { useLocation, useNavigate } from "react-router-dom";
import { Badge, Button } from "StyledComponents";
import getStatusCssClass from "utils/getBadgeStatus";

const Header = ({ invoice }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const { pathname } = location;

  return (
    <div className="sticky top-0 left-0 right-0 z-50 flex h-12 items-center justify-between bg-white px-4 shadow-c1">
      <div className="flex items-center">
        {!pathname.includes("view") && (
          <Button
            style="ternary"
            onClick={() => {
              navigate("/invoices");
            }}
          >
            <ArrowLeftIcon
              className="mr-4 text-miru-dark-purple-1000"
              size={16}
              weight="bold"
            />
          </Button>
        )}
        <span>Invoice #{invoice.invoice_number}</span>
      </div>
      <div>
        <Badge
          className={`${getStatusCssClass(invoice.status)} uppercase`}
          text={invoice.status}
        />
      </div>
    </div>
  );
};

export default Header;
