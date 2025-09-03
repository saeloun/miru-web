import React from "react";
import { Button } from "../ui/button";

interface AddEntryButtonProps {
  newEntryView: boolean;
  handleOpenModernForm?: () => void;
  setNewEntryView: (value: boolean) => void;
}

const AddEntryButton: React.FC<AddEntryButtonProps> = ({
  newEntryView,
  handleOpenModernForm,
  setNewEntryView,
}) => {
  if (newEntryView) {
    return null;
  }

  const handleClick = () => {
    setNewEntryView(true);
  };

  return (
    <Button
      size="default"
      className="w-full h-10 text-sm font-medium bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg"
      onClick={handleClick}
    >
      <span className="text-lg mr-2">+</span>
      Add Entry
    </Button>
  );
};

export default AddEntryButton;
