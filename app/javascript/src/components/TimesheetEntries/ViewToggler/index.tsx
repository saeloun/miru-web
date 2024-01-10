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
              ? "mr-10 border-b-2 border-miru-han-purple-1000 font-bold tracking-widest text-miru-han-purple-1000"
              : "mr-10 font-medium tracking-widest text-miru-han-purple-600"
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
