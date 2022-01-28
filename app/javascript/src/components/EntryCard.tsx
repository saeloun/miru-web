import * as React from "react";

interface props {
  id: number;
  client: string;
  project: string;
  notes: string;
  duration: string;
}

const EntryCard: React.FC<props> = ({ client, project, notes, duration }) => (
  <div className="flex justify-between items-center shadow-2xl w-full p-6 mt-10 rounded-lg">
    <div className="">
      <div className="flex">
        <p className="text-lg">{client}</p>
        <p className="text-lg mx-2">•</p>
        <p className="text-lg">{project}</p>
      </div>
      <p className="text-sm text-miru-dark-purple-400">{notes}</p>
    </div>
    <div className="flex">
      <p className="text-4xl">{duration}</p>
      <button className="mx-10">
        <img
          src="/edit.svg"
          alt="edit"
          className="h-4 w-4 text-miru-han-purple-600 hover:text-miru-han-purple-1000"
        />
      </button>
      <button>
        <img
          src="/delete.svg"
          alt="delete"
          className="mr-10 h-4 w-4 fill-blue text-miru-han-purple-1000 hover:text-miru-han-purple-1000"
        />
      </button>
    </div>
  </div>
);

export default EntryCard;
