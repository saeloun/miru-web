import React from "react";
import { Button } from "../ui/button";

interface AddEntryButtonProps {
  newEntryView: boolean;
  newTimeoffEntryView?: boolean;
  showCopyLastWeek?: boolean;
  copyingLastWeek?: boolean;
  handleOpenTimeoffForm?: () => void;
  handleCopyLastWeek?: () => void;
  setNewEntryView: (value: boolean) => void;
}

const AddEntryButton: React.FC<AddEntryButtonProps> = ({
  newEntryView,
  newTimeoffEntryView = false,
  showCopyLastWeek = false,
  copyingLastWeek = false,
  handleOpenTimeoffForm,
  handleCopyLastWeek,
  setNewEntryView,
}) => {
  if (newEntryView || newTimeoffEntryView) {
    return null;
  }

  const handleClick = () => {
    setNewEntryView(true);
  };

  return (
    <div className="flex flex-col gap-3 md:flex-row">
      {showCopyLastWeek && handleCopyLastWeek && (
        <Button
          size="default"
          variant="outline"
          className="h-10 rounded-lg text-sm font-medium"
          data-testid="copy-last-week"
          disabled={copyingLastWeek}
          onClick={handleCopyLastWeek}
        >
          {copyingLastWeek ? "Copying..." : "Copy Last Week"}
        </Button>
      )}
      <Button
        size="default"
        className="h-10 w-full rounded-lg bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90 md:w-auto md:min-w-40"
        onClick={handleClick}
      >
        <span className="mr-2 text-lg">+</span>
        Add Entry
      </Button>
      {handleOpenTimeoffForm && (
        <Button
          size="default"
          variant="outline"
          className="h-10 w-full rounded-lg text-sm font-medium md:w-auto md:min-w-40"
          data-testid="mark-time-off-button"
          onClick={handleOpenTimeoffForm}
        >
          Mark Time Off
        </Button>
      )}
    </div>
  );
};

export default AddEntryButton;
