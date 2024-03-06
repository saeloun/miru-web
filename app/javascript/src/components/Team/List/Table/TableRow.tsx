import React, { useState } from "react";

import { differenceInCalendarDays } from "date-fns";
import { DotsThreeVerticalIcon } from "miruIcons";
import { useNavigate } from "react-router-dom";
import { Avatar, Badge, Button } from "StyledComponents";

import { useUserContext } from "context/UserContext";
import getStatusCssClass from "utils/getBadgeStatus";

import MoreOptions from "./MoreOptions";

const TableRow = ({ item }) => {
  const { isDesktop } = useUserContext();

  const navigate = useNavigate();

  const [showMoreOptions, setShowMoreOptions] = useState<boolean>(false);
  const {
    id,
    name,
    email,
    role,
    status,
    profilePicture,
    joinedAtDate,
    employmentType,
  } = item;

  const calculateWorkDuration = joinedAt => {
    if (!joinedAt) {
      return null;
    }

    const start = new Date(joinedAt);
    const today = new Date();

    const daysDifference = differenceInCalendarDays(today, start);
    const years = Math.floor(daysDifference / 365);
    const remainingDaysAfterYears = daysDifference % 365;

    const months = Math.floor(remainingDaysAfterYears / 30);
    const remainingDaysAfterMonths = remainingDaysAfterYears % 30;

    const days = remainingDaysAfterMonths;

    const duration =
      (years ? `${years}y ` : "") +
      (months ? ` ${months}m ` : "") +
      (days ? ` ${days}d` : "");

    return duration;
  };

  const handleRowClick = () => {
    if (status) return;

    if (isDesktop) {
      navigate(`/team/${id}`, { replace: true });
    } else {
      navigate(`/team/${id}/options`, { replace: true });
    }
  };

  return (
    <tr
      className="group flex cursor-pointer border-b border-miru-gray-200 last:border-0 lg:grid lg:grid-cols-10 lg:gap-4"
      onClick={handleRowClick}
    >
      <td className="flex w-3/5 py-2 text-left text-xs font-medium leading-4 tracking-widest text-miru-dark-purple-600 lg:col-span-4 lg:py-3">
        <div className="my-auto">
          <Avatar url={profilePicture} />
        </div>
        <div className="ml-2 truncate capitalize lg:ml-4">
          <dt className="lg:flex">
            <p className="mr-2 text-sm font-bold leading-5 text-miru-dark-purple-1000 lg:text-base">
              {name}
            </p>
            {status && (
              <Badge
                text="pending"
                className={`${getStatusCssClass(
                  "pending"
                )} hidden uppercase lg:block`}
              />
            )}
          </dt>
          <dt className="mt-2 truncate text-xs font-medium lowercase leading-4 text-miru-dark-purple-400">
            {email}
          </dt>
        </div>
      </td>
      <td className="col-span-2 hidden self-start text-left text-sm font-medium capitalize leading-5 tracking-widest text-miru-dark-purple-1000 lg:table-cell lg:py-3">
        -
      </td>
      <td className="flex w-2/5 justify-between py-2  text-left text-sm font-medium capitalize leading-4 tracking-widest text-miru-dark-purple-600 lg:col-span-2 lg:py-3">
        <div>
          <p className="truncate text-xs lg:text-sm">
            {role.replace(/_/g, " ")}
          </p>
          {status && (
            <Badge
              text="pending"
              className={`${getStatusCssClass(
                "pending"
              )} mt-2 uppercase xsm:text-xxs lg:hidden lg:text-sm`}
            />
          )}
        </div>
        <Button
          className="lg:hidden"
          style="ternary"
          onClick={e => {
            e.preventDefault();
            e.stopPropagation();
            setShowMoreOptions(true);
          }}
        >
          <DotsThreeVerticalIcon
            className="text-miru-dark-purple-1000"
            size={20}
            weight="bold"
          />
        </Button>
      </td>
      <td className="relative col-span-2 hidden py-2 text-left text-xs font-medium capitalize leading-4 tracking-widest text-miru-dark-purple-1000 lg:table-cell lg:py-3">
        <div>{employmentType || "-"}</div>
        <div className="mt-2 text-xs font-medium lowercase leading-4 text-miru-dark-purple-400">
          {calculateWorkDuration(joinedAtDate) || "-"}
        </div>
        {isDesktop && <MoreOptions item={item} />}
      </td>
      {showMoreOptions && (
        <MoreOptions
          item={item}
          setShowMoreOptions={setShowMoreOptions}
          showMoreOptions={showMoreOptions}
        />
      )}
    </tr>
  );
};

export default TableRow;
