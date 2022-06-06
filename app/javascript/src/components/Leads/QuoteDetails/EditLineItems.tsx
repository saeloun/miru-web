import React, { useEffect, useState } from "react";
import leadItemsApi from "apis/lead-items";

const EditLineItems = ({
  item,
  setSelectedOption,
  selectedOption,
  setEdit
}) => {

  const [kindList, setKindList] = useState<any>(null);

  const [name, setName] = useState<any>(item.name);
  const [description, setDescription] = useState<any>(item.description);
  const [kind, setKind] = useState<any>(item.kind);
  const [numberOfResource, setNumberOfResource] = useState<any>(item.number_of_resource);
  const [resourceExpertiseLevel, setResourceExpertiseLevel] = useState<any>(item.resource_expertise_level);
  const [price, setPrice] = useState<any>(item.price);

  useEffect(() => {
    const getLeadItems = async () => {
      leadItemsApi.get()
        .then((data) => {
          setKindList(data.data.line_item_kind_names);
        }).catch(() => {
          setKindList({});
        });
    };

    getLeadItems();
  }, []);

  const onEnter = e => {
    if (e.key == "Enter") {
      const sanitizedSelected = selectedOption.filter(option =>
        option.id !== item.id
      );

      const newItem = {
        ...item,
        name, description,
        kind, numberOfResource,
        resourceExpertiseLevel,
        price
      };
      setSelectedOption([...sanitizedSelected, { ...newItem }]);
      setEdit(false);
    }
  };

  return (
    <tr className="w-full my-1">
      <td className="p-1 w-full">
        <input
          type="text"
          placeholder="Name"
          className=" p-1 px-2 bg-white rounded w-full font-medium text-sm text-miru-dark-purple-1000 focus:outline-none focus:border-miru-gray-1000 focus:ring-1 focus:ring-miru-gray-1000"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => onEnter(e)}
        />
      </td>
      <td className="p-1 w-full">
        <input
          type="text"
          placeholder="Description"
          className=" p-1 px-2 bg-white rounded w-full font-medium text-sm text-miru-dark-purple-1000 focus:outline-none focus:border-miru-gray-1000 focus:ring-1 focus:ring-miru-gray-1000"
          value={description}
          onChange={e => setDescription(e.target.value)}
          onKeyDown={e => onEnter(e)}
        />
      </td>
      <td className="p-1 w-full">
        <select
          className="rounded border-0 block w-full px-2 py-1 bg-miru-gray-100 h-8 font-medium text-sm text-miru-dark-purple-1000 focus:outline-none sm:text-base"
          name="kind" onChange={e => setKind(e.target.value)}
          onKeyDown={e => onEnter(e)} >
          <option value=''>Select Kind</option>
          {kindList &&
            kindList.map(e => <option value={e.id} key={e.id} selected={e.id === kind} >{e.name}</option>)}
        </select>
      </td>
      <td className=" w-full">
        <input
          type="number"
          min= "0"
          placeholder="Number of resource"
          className=" p-1 px-2 bg-white rounded w-full font-medium text-sm text-miru-dark-purple-1000 text-right focus:outline-none focus:border-miru-gray-1000 focus:ring-1 focus:ring-miru-gray-1000"
          value={numberOfResource}
          onChange={e => setNumberOfResource(e.target.value)}
          onKeyDown={e => onEnter(e)}
        />
      </td>
      <td className=" w-full">
        <input
          type="number"
          min= "0"
          placeholder="Resource Expertise Level"
          className=" p-1 px-2 bg-white rounded w-full font-medium text-sm text-miru-dark-purple-1000 text-right focus:outline-none focus:border-miru-gray-1000 focus:ring-1 focus:ring-miru-gray-1000"
          value={resourceExpertiseLevel}
          onChange={e => setResourceExpertiseLevel(e.target.value)}
          onKeyDown={e => onEnter(e)}
        />
      </td>
      <td className=" w-full">
        <input
          type="number"
          min= "0"
          placeholder="Price"
          className=" p-1 px-2 bg-white rounded w-full font-medium text-sm text-miru-dark-purple-1000 text-right focus:outline-none focus:border-miru-gray-1000 focus:ring-1 focus:ring-miru-gray-1000"
          value={price}
          onChange={e => setPrice(e.target.value)}
          onKeyDown={e => onEnter(e)}
        />
      </td>
    </tr>
  );
};

export default EditLineItems;
