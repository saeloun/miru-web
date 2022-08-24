import React, { useEffect, useState } from "react";
import engagementsItemsApi from 'apis/engagements-items';
import leads from "apis/leads";
import { Multiselect } from 'multiselect-react-dropdown';
import { X } from "phosphor-react";
import { unmapLeadList } from "../../../../mapper/lead.mapper";

const FilterSideBar = ({ setEngagementData, setFilterVisibilty, rememberFilter, setRememberFilter }) => {
  const [sourceOptions, setSourceOptions] = useState<any>([{}]);
  const [engagementOptions, setEngagementOptions] = useState<any>([{}]);

  const [queryParams, setQueryParams] = useState<any>({
    engagement: [],
    source_codes: []
  });
  const [stringQueryParams, setStringQueryParams] = useState<any>(null);

  const [selectEngagementRef, setSelectEngagementRef] = useState<any>(React.createRef());
  const [selectSourceRef, setSelectSourceRef] = useState<any>(React.createRef());

  const [isApplyFilter, setIsApplyFilter] = useState<boolean>(false);

  const [rememberSources, setRememberSources] = useState<any>(null);
  const [rememberEngagements, setRememberEngagements] = useState<any>(null);

  useEffect(() => {
    const getLeadItems = async () => {
      engagementsItemsApi.get()
        .then((data) => {
          setEngagementOptions(data.data.engagement)
          setSourceOptions(data.data.source_codes)
        }).catch(() => {
          setEngagementOptions({})
          setSourceOptions({})
        });
    };

    getLeadItems();
  }, []);

  useEffect(() => {
    if (rememberFilter.filterData){
      if (engagementOptions){
        const fengagementOptions = engagementOptions.filter(engagement =>
          rememberFilter.filterData.engagement.map(Number).includes(parseInt(engagement.id))
        );
        setRememberEngagements([...fengagementOptions])
      }
      if (sourceOptions){
        const fsourceOptions = sourceOptions.filter(source =>
          rememberFilter.filterData.source_codes.map(Number).includes(parseInt(source.id))
        );
        setRememberSources([...fsourceOptions])
      }
    }
  }, [rememberFilter.filterData, engagementOptions, sourceOptions]);

  const customStyles = {
    control: (provided) => ({
      ...provided,
      marginTop: "8px",
      backgroundColor: "#F5F7F9",
      color: "#1D1A31",
      minHeight: 32,
      padding: "0"
    }),
    menu: (provided) => ({
      ...provided,
      fontSize: "12px",
      letterSpacing: "2px"
    })
  };

  useEffect(() => {
    if (isApplyFilter){
      setRememberFilter('filterData', queryParams);
      const applyFilter = async () => {
        leads.get(stringQueryParams)
          .then((res) => {
            const sanitized = unmapLeadList(res);
            setEngagementData(sanitized.leadList);
            setIsApplyFilter(false);
          });
      };

      applyFilter();
    }
  }, [stringQueryParams, isApplyFilter]);

  useEffect(() => {
    setStringQueryParams(new URLSearchParams(queryParams).toString())
  }, [queryParams, isApplyFilter]);

  const resetFilter = async () => {
    setQueryParams({
      source_codes: [],
      engagement: [],
    })

    selectSourceRef.resetSelectedValues();
    selectEngagementRef.resetSelectedValues();
    setIsApplyFilter(true);
  };

  return (
    <div className="flex flex-col overflow-y-auto sidebar__container h-max">
      <div>
        <div className="flex items-center justify-between px-5 pt-5 mb-7">
          <h4 className="text-base font-bold">
            Filter
          </h4>
          <button onClick = {() => setFilterVisibilty(false)}>
            <X size={12} />
          </button>
        </div>
        <div className="sidebar__filters">
          <ul>
            <li className="px-5 pb-5">
              <h5 className="text-xs font-normal">SOURCES</h5>
              <Multiselect
                ref={ref => setSelectSourceRef(ref)}
                onSelect={(selectedOptions) =>
                  setQueryParams(prevState => ({
                    ...prevState,
                    source_codes: selectedOptions.map((selectedOption) => selectedOption.id )
                  }))}
                onRemove={(selectedOptions) =>
                  setQueryParams(prevState => ({
                    ...prevState,
                    source_codes: selectedOptions.map((selectedOption) => selectedOption.id )
                  }))}
                style={customStyles}
                options={sourceOptions}
                selectedValues={rememberSources}
                displayValue="name"
              />
            </li>
            <li className="px-5 pb-5">
              <h5 className="text-xs font-normal">Engagement</h5>
              <Multiselect
                ref={ref => setSelectEngagementRef(ref)}
                onSelect={(selectedOptions) =>
                  setQueryParams(prevState => ({
                    ...prevState,
                    engagement: selectedOptions.map((selectedOption) => selectedOption.id )
                  }))}
                onRemove={(selectedOptions) =>
                  setQueryParams(prevState => ({
                    ...prevState,
                    engagement: selectedOptions.map((selectedOption) => selectedOption.id )
                  }))}
                style={customStyles}
                options={engagementOptions}
                selectedValues={rememberEngagements}
                displayValue="name"
              />
            </li>
          </ul>
        </div>
      </div>
      <div className="sidebar__footer">
        <button
          className="sidebar__reset"
          onClick={() => resetFilter()} >
            RESET
        </button>
        <button className="sidebar__apply" onClick={() => setIsApplyFilter(true)}>APPLY</button>
      </div>
    </div>
  );
};

export default FilterSideBar;
