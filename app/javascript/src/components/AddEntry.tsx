import * as React from "react";

interface props {
  setNewEntryView: React.Dispatch<React.SetStateAction<boolean>>;
  clients: client[];
  projects: object;
}

interface client {
  name: string;
}

const AddEntry: React.FC<props> = ({ setNewEntryView, clients, projects }) => {
  clients = clients.sort((a, b) => (a.name < b.name ? -1 : 1));
  const [notes, setNotes] = React.useState("");
  const [hours, setHours] = React.useState("00:00");
  const [client, setClient] = React.useState(clients[0].name);

  return (
    <div className="h-24 py-1 flex justify-evenly rounded-lg shadow-2xl">
      <span className="w-60 ml-4">
        <select
          onChange={e => setClient(e.target.value)}
          name="client"
          id="client"
          className="w-60 bg-miru-gray-100 rounded-sm mt-2 h-8"
        >
          {clients.map((c, i) => (
            <option key={i.toString()}>{c.name}</option>
          ))}
        </select>
        <select
          name="project"
          id="project"
          className="w-60 bg-miru-gray-100 rounded-sm mt-2 h-8"
        >
          {client &&
            projects[client].map((p, i) => (
              <option key={i.toString()}>{p.name}</option>
            ))}
        </select>
      </span>
      <div className="mx-10">
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={5}
          cols={60}
          name="notes"
          placeholder=" Notes"
          className="w-60 h-18 rounded-sm bg-miru-gray-100 my-2"
        ></textarea>
      </div>
      <div className="w-60">
        <div className="p-1 w-60 bg-miru-gray-100 rounded-sm mt-2 h-8">
          {"Mon 20th Jan"}
        </div>
        <input
          value={hours}
          onChange={e => setHours(e.target.value)}
          type="text"
          className="w-60 bg-miru-gray-100 rounded-sm mt-2 h-8"
        />
      </div>
      <div className="mr-4 my-2 ml-14">
        <button className="mb-1 h-8 w-38 text-xs py-1 px-6 rounded border bg-miru-han-purple-1000 text-white font-bold hover:border-transparent">
          SAVE
        </button>
        <button
          onClick={() => {
            setNewEntryView(false);
          }}
          className="mt-1 h-8 w-38 text-xs py-1 px-6 rounded border border-miru-han-purple-1000 bg-transparent hover:bg-miru-han-purple-1000 text-miru-han-purple-600 font-bold hover:text-white hover:border-transparent"
        >
          CANCEL
        </button>
      </div>
    </div>
  );
};

export default AddEntry;
