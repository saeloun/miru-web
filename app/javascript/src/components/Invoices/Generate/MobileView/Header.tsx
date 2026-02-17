import React from "react";

interface HeaderProps {
  activeSection: string;
  isEdit?: boolean;
  setActiveSection: (section: string) => void;
}

const Header: React.FC<HeaderProps> = ({
  activeSection,
  isEdit,
  setActiveSection,
}) => (
  <div className="flex h-16 items-center justify-between border-b bg-white px-4">
    <h1 className="text-lg font-semibold">
      {isEdit ? "Edit Invoice" : "Generate Invoice"}
    </h1>
    <div className="text-sm text-muted-foreground">
      Section: {activeSection}
    </div>
  </div>
);

export default Header;
