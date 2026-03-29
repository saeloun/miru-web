import React from "react";

const ViewToggler = ({ view, setView }) => {
  const VIEWS = ["month", "week", "day"];

  return (
    <nav className="flex">
      {VIEWS.map((item, index) => (
        <button
          key={index}
          className={
            item === view
              ? "mr-10 border-b-2 border-primary font-bold tracking-widest text-primary"
              : "mr-10 font-medium tracking-widest text-primary"
          }
          onClick={() => setView(item)}
        >
          {item.toUpperCase()}
        </button>
      ))}
    </nav>
  );
};

export default ViewToggler;
