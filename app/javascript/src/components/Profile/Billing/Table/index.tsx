import * as React from "react";

import TableHeader from "./TableHeader";
import TableRow from "./TableRow";

const data = [{
  date: "22.04.2022",
  description: "Monthly (22.04.2022 - 21.05.2022)",
  team_members: 13,
  total_bill_amt: "$65",
  payment_type: "Online/Stripe"
}, {
  date: "22.03.2022",
  description: "Monthly (22.03.2022 - 21.04.2022)",
  team_members: 11,
  total_bill_amt: "$55",
  payment_type: "Online/Stripe"
}, {
  date: "22.02.2022",
  description: "Monthly (22.02.2022 - 21.03.2022)",
  team_members: 11,
  total_bill_amt: "$55",
  payment_type: "Online/Stripe"
}, {
  date: "22.01.2022",
  description: "Buy Basic Plan",
  team_members: "-",
  total_bill_amt: "$10",
  payment_type: "Online/Stripe"
}];

const Table = () => (
  <table className="min-w-full mt-1 divide-y divide-gray-200">
    <thead>
      <TableHeader />
    </thead>

    <tbody className="min-w-full bg-miru-gray-100  divide-y divide-gray-200">
      {data.map((data) => (
        <TableRow
          data={data}
        />
      ))}
    </tbody>
  </table>
);

export default Table;
