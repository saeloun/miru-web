import React, { useState } from 'react'
import Autocomplete from 'react-autocomplete'
import clients from "apis/clients";
import { unmapClientListForDropdown } from '../../../mapper/client.mapper';
import { useNavigate } from 'react-router-dom';

const cssStyles = {
  menuStyles: {
    borderRadius: '3px',
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.1)',
    background: '#FFFFFF',
    padding: '5px 0',
    fontSize: '90%',
    position: 'absolute',
    top: '40px',
    left: "0",
    overflow: 'auto',
    maxHeight: '400px',
  },
  getDivStyles: (isHighlighted) => {
    return {
      padding: "10px 16px",
      color: "#1D1A31",
      background: isHighlighted ? '#F5F7F9' : 'white'
    }
  }
}

const AutoComplete = () => {
  const [searchValue, setValue] = useState<string>('');
  const [dropdownItems, setDropdownItems] = useState([]);
  const navigate = useNavigate();

  const handleChange = async (e) => {
    setValue(e.target.value);
    await clients.get(`?q=${e.target.value}`)
      .then((res) => {
        const dropdownList = unmapClientListForDropdown(res);
        setDropdownItems(dropdownList);
      })
  }

  const handleSelect = (value) => {
    const selectedValue = JSON.parse(value);
    navigate(`${selectedValue.value}`);
  }

  return (
    <Autocomplete
      getItemValue={(item) => JSON.stringify(item)} // getValue takes only string arguments
      items={dropdownItems}
      menuStyle={cssStyles.menuStyles}
      renderItem={(item, isHighlighted) =>
        <div style={cssStyles.getDivStyles(isHighlighted)}>
          {item.label}
        </div>
      }
      renderMenu={
        function (items, value, style) {
          if (items.length > 0) {
            return <div style={{ ...style, ...this.menuStyle }} children={items} />
          }
          if (items.length === 0 && searchValue === '') {
            return <div></div>
          }
          return (<div style={{ ...style, ...this.menuStyle }}>
            <h5 style={{ padding: "8px", textAlign: "center", color: '#A5A3AD', fontSize: '20px', fontWeight: '600' }}>
              No results found.
            </h5>
          </div>)
        }

      }
      wrapperStyle={{
        position: 'relative'
      }}
      value={searchValue}
      onChange={handleChange}
      onSelect={handleSelect}
    />

  )
}

export default AutoComplete;
