import React from "react";

import { minToHHMM, currencyFormat } from "helpers";
import { ArrowLeft, DotsThreeVertical, Plus } from "phosphor-react";
import { useNavigate } from "react-router-dom";
import { MobileMoreOptions, SummaryDashboard } from "StyledComponents";
import { Badge } from "components/ui/badge";
import { Button } from "components/ui/button";

import EmptyStates from "common/EmptyStates";

import HeaderMenuList from "../HeadermenuList";

const ProjectDetailsForm = ({
  project,
  isHeaderMenuVisible,
  setIsHeaderMenuVisible,
  handleAddRemoveMembers,
  handleEditProject,
  handleGenerateInvoice,
  setShowDeleteDialog,
}) => {
  const navigate = useNavigate();
  const summaryList = project
    ? [
        {
          label: "TOTAL HOURS",
          value: parseInt(minToHHMM(project.totalMinutes)),
          hideCurrencySymbol: true,
        },
        {
          label: "OVERDUE",
          value: parseInt(project.overdueOutstandingAmount.overdue_amount),
        },
        {
          label: "OUTSTANDING",
          value: parseInt(project.overdueOutstandingAmount.outstanding_amount),
        },
      ]
    : [];

  return (
    <div className="flex w-full flex-col lg:hidden">
      <div className="flex h-14 w-full items-center border-b border-border bg-background/95 px-2 backdrop-blur">
        <Button
          className="h-10 w-10 rounded-full"
          size="icon"
          type="button"
          variant="ghost"
          onClick={() => {
            navigate("/projects");
          }}
        >
          <ArrowLeft className="text-foreground" size={18} />
        </Button>
        <div className="flex w-full items-center gap-3 px-2">
          <h2 className="mr-1 text-base font-semibold text-foreground">
            {project?.name}
          </h2>
          {project?.is_billable && (
            <Badge className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs text-primary hover:bg-primary/10">
              Billable
            </Badge>
          )}
        </div>
        <Button
          className="h-10 w-10 rounded-full"
          size="icon"
          type="button"
          variant="ghost"
          onClick={() => setIsHeaderMenuVisible(true)}
        >
          <DotsThreeVertical className="text-foreground" size={18} />
        </Button>
      </div>
      {isHeaderMenuVisible && (
        <MobileMoreOptions
          className="p-0"
          setVisibilty={setIsHeaderMenuVisible}
          visibilty={isHeaderMenuVisible}
        >
          <HeaderMenuList
            handleAddRemoveMembers={handleAddRemoveMembers}
            handleEditProject={handleEditProject}
            handleGenerateInvoice={handleGenerateInvoice}
            setIsHeaderMenuVisible={setIsHeaderMenuVisible}
            setShowDeleteDialog={setShowDeleteDialog}
          />
        </MobileMoreOptions>
      )}
      <div className="flex flex-1 flex-col p-4">
        {project?.members.length > 0 ? (
          <div>
            {project && (
              <SummaryDashboard
                bgColor="bg-muted"
                borderColor="border-border"
                currency={project.overdueOutstandingAmount.currency}
                summaryList={summaryList}
                textColor="text-foreground"
              />
            )}
            {project && (
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="w-1/4 py-3 text-left text-xs font-medium leading-4 tracking-widest text-muted-foreground">
                      TEAM <br />
                      MEMBER
                    </th>
                    <th className="py-3 text-right text-xs font-medium leading-4 tracking-widest text-muted-foreground">
                      HOURLY <br /> RATE
                    </th>
                    <th className="py-3 text-right text-xs font-medium leading-4 tracking-widest text-muted-foreground">
                      HOURS <br /> LOGGED
                    </th>
                    <th className="self-end py-3 text-right text-xs font-medium leading-4 tracking-widest text-muted-foreground">
                      COST
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {project.members &&
                    project.members.map(member => (
                      <tr key={member.id}>
                        <td className="py-3 text-left text-sm font-medium leading-5 text-foreground">
                          {member.name}
                        </td>
                        <td className="py-3 text-right text-sm font-medium leading-5 text-foreground">
                          {currencyFormat(project.currency, member.hourlyRate)}
                        </td>
                        <td className="py-3 text-right text-sm font-medium leading-5 text-foreground">
                          {minToHHMM(member.minutes)}
                        </td>
                        <td className="py-3 text-right text-sm font-medium leading-5 text-foreground">
                          {currencyFormat(project.currency, member.cost)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          <div className="h-full">
            <EmptyStates
              Message="No team member has been added to this project yet."
              showNoSearchResultState={false}
            >
              <Button
                className="h-11 w-full"
                type="button"
                variant="default"
                onClick={handleAddRemoveMembers}
              >
                <Plus className="mr-2" size={16} />
                <span className="text-center text-base font-medium">
                  Add Team Members
                </span>
              </Button>
            </EmptyStates>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDetailsForm;
