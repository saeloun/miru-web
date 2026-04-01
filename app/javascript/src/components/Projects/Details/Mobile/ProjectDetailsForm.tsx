import React from "react";

import { minToHHMM, currencyFormat } from "helpers";
import { ArrowLeft, DotsThreeVertical, Plus } from "phosphor-react";
import { useNavigate } from "react-router-dom";
import { i18n } from "../../../../i18n";
import { Badge } from "components/ui/badge";
import { Button } from "components/ui/button";
import { Dialog, DialogContent } from "components/ui/dialog";

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
          label: i18n.t("projects.totalHours").toUpperCase(),
          value: parseInt(minToHHMM(project.totalMinutes)),
          hideCurrencySymbol: true,
        },
        {
          label: i18n.t("projects.overdue"),
          value: parseInt(project.overdueOutstandingAmount.overdue_amount),
        },
        {
          label: i18n.t("projects.outstanding"),
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
              {i18n.t("billable")}
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
      <Dialog open={isHeaderMenuVisible} onOpenChange={setIsHeaderMenuVisible}>
        <DialogContent className="max-w-sm p-0 sm:rounded-3xl">
          <div className="p-2">
            <HeaderMenuList
              handleAddRemoveMembers={handleAddRemoveMembers}
              handleEditProject={handleEditProject}
              handleGenerateInvoice={handleGenerateInvoice}
              setIsHeaderMenuVisible={setIsHeaderMenuVisible}
              setShowDeleteDialog={setShowDeleteDialog}
            />
          </div>
        </DialogContent>
      </Dialog>
      <div className="flex flex-1 flex-col p-4">
        {project?.members.length > 0 ? (
          <div>
            {project && (
              <div className="grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-3">
                {summaryList.map(summary => (
                  <div
                    className="rounded-xl border border-border bg-background px-4 py-3"
                    key={summary.label}
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {summary.label}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-foreground">
                      {summary.hideCurrencySymbol
                        ? summary.value
                        : currencyFormat(
                            project.overdueOutstandingAmount.currency,
                            summary.value,
                            summary.value > 999 ? "compact" : "standard"
                          )}
                    </p>
                  </div>
                ))}
              </div>
            )}
            {project && (
              <table className="mt-4 w-full">
                <thead>
                  <tr>
                    <th className="w-1/4 py-3 text-left text-xs font-medium leading-4 tracking-widest text-muted-foreground">
                      {i18n.t("projects.teamMember").toUpperCase()}
                    </th>
                    <th className="py-3 text-right text-xs font-medium leading-4 tracking-widest text-muted-foreground">
                      {i18n.t("projects.hourlyRate").toUpperCase()}
                    </th>
                    <th className="py-3 text-right text-xs font-medium leading-4 tracking-widest text-muted-foreground">
                      {i18n.t("projects.hoursLogged").toUpperCase()}
                    </th>
                    <th className="self-end py-3 text-right text-xs font-medium leading-4 tracking-widest text-muted-foreground">
                      {i18n.t("projects.cost")}
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
              Message={i18n.t("projects.noTeamMembersAdded")}
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
                  {i18n.t("projects.addTeamMembers")}
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
