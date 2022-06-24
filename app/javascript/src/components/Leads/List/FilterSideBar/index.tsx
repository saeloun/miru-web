import React, { useEffect, useState } from "react";
import Select from "react-select";
import leadItemsApi from "apis/lead-items";
import leads from "apis/leads";
import { X } from "phosphor-react";
import getStatusCssClass from "utils/getStatusTag";
import { unmapLeadList } from "../../../../mapper/lead.mapper";

const FilterSideBar = ({ setLeadData, setFilterVisibilty }) => {
  const [countryOptions, setCountryOptions] = useState<any>(null);
  const [industryOptions, setIndustryOptions] = useState<any>(null);
  const [sourceOptions, setSourceOptions] = useState<any>(null);
  const [statusOptions, setStatusOptions] = useState<any>(null);

  const [queryParams, setQueryParams] = useState<any>({
    country_alphas: [],
    industry_codes: [],
    source_codes: [],
    status_codes: []
  });
  const [stringQueryParams, setStringQueryParams] = useState<any>(null);

  const [selectCountryRef, setSelectCountryRef] = useState<any>(React.createRef());
  const [selectIndustryRef, setSelectIndustryRef] = useState<any>(React.createRef());
  const [selectSourceRef, setSelectSourceRef] = useState<any>(React.createRef());
  const [selectStatusRef, setSelectStatusRef] = useState<any>(React.createRef());

  useEffect(() => {
    const getLeadItems = async () => {
      leadItemsApi.get()
        .then((data) => {
          setCountryOptions(data.data.countries)
          setIndustryOptions(data.data.industry_codes)
          setSourceOptions(data.data.source_codes)
          setStatusOptions(data.data.status_codes)
        }).catch(() => {
          setCountryOptions({})
          setIndustryOptions({})
          setSourceOptions({})
          setStatusOptions({})
        });
    };

    getLeadItems();
  }, []);

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

  const CustomOption = (props) => {
    const { innerProps, innerRef } = props;

    return (
      <div ref={innerRef} {...innerProps} className="py-1 px-2 cursor-pointer hover:bg-miru-gray-100">
        <span className={`${getStatusCssClass(props.data.name)} text-xs tracking-widest`} >
          {props.data.name}
        </span>
      </div>
    );
  };

  useEffect(() => {
    setStringQueryParams(new URLSearchParams(queryParams).toString())
  }, [queryParams]);

  const resetFilter = async () => {
    setQueryParams({
      country_alphas: [],
      industry_codes: [],
      source_codes: [],
      status_codes: []
    })

    selectCountryRef.clearValue();
    selectIndustryRef.clearValue();
    selectSourceRef.clearValue();
    selectStatusRef.clearValue();
    applyFilter();
  };

  const applyFilter = async () => {

    await leads.get(stringQueryParams)
      .then((res) => {
        const sanitized = unmapLeadList(res);
        setLeadData(sanitized.leadList);
      });
  };

  return (
    <div className="sidebar__container flex flex-col">
      <div>
        <div className="flex px-5 pt-5 mb-7 justify-between items-center">
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
              <h5 className="text-xs font-normal">COUNTRIES</h5>
              <Select isMulti={true} classNamePrefix="react-select-filter"
                ref={ref => setSelectCountryRef(ref)}
                onChange={(selectedOptions) =>
                  setQueryParams(prevState => ({
                    ...prevState,
                    country_alphas: selectedOptions.map((selectedOption) => selectedOption[0])
                  }))}
                styles={customStyles}
                options={countryOptions}
                getOptionLabel={(option) => option[1]}
                getOptionValue={(option) => option[0]}
              />
            </li>
            <li className="px-5 pb-5">
              <h5 className="text-xs font-normal">INDUSTRIES</h5>
              <Select isMulti={true} classNamePrefix="react-select-filter"
                ref={ref => setSelectIndustryRef(ref)}
                onChange={(selectedOptions) =>
                  setQueryParams(prevState => ({
                    ...prevState,
                    industry_codes: selectedOptions.map((selectedOption) => selectedOption['id'] )
                  }))}
                styles={customStyles}
                options={industryOptions}
                getOptionLabel={(option) => option['name']}
                getOptionValue={(option) => option['id']}
              />
            </li>
            <li className="px-5 pb-5">
              <h5 className="text-xs font-normal">SOURCES</h5>
              <Select isMulti={true} classNamePrefix="react-select-filter"
                ref={ref => setSelectSourceRef(ref)}
                onChange={(selectedOptions) =>
                  setQueryParams(prevState => ({
                    ...prevState,
                    source_codes: selectedOptions.map((selectedOption) => selectedOption['id'] )
                  }))}
                styles={customStyles}
                options={sourceOptions}
                getOptionLabel={(option) => option['name']}
                getOptionValue={(option) => option['id']}
              />
            </li>
            <li className="px-5 pb-5">
              <h5 className="text-xs font-normal">STATUS</h5>
              <Select isMulti={true} classNamePrefix="react-select-filter"
                ref={ref => setSelectStatusRef(ref)}
                onChange={(selectedOptions) =>
                  setQueryParams(prevState => ({
                    ...prevState,
                    status_codes: selectedOptions.map((selectedOption) => selectedOption['id'] )
                  }))}
                styles={customStyles}
                options={statusOptions}
                getOptionLabel={(option) => option['name']}
                getOptionValue={(option) => option['id']}
                components={{ Option: CustomOption }}
              />
            </li>
          </ul>
        </div>
      </div>
      <div className="sidebar__footer">
        <button
          className="sidebar__reset"
          onClick={resetFilter} >
            RESET
        </button>
        <button className="sidebar__apply" onClick={applyFilter}>APPLY</button>
      </div>
    </div>
  );
};

export default FilterSideBar;
