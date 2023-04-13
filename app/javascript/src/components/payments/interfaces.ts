/* eslint-disable */
export interface TableProps {
  payments: any[];
  baseCurrency: any;
}

export interface TableRowProps {
  baseCurrency: any;
  payment: any;
}

export interface SearchParamsProps {
  query: string;
}

export interface MobileHeaderProps {
  payments: any[];
  showSearchedPayments: boolean;
  setShowSearchedPayments: (showSearchedPayments: boolean) => void;
  params: SearchParamsProps;
  setParams: (params: SearchParamsProps) => void;
  fetchSearchedPayments: (searchQuery: string) => void;
  setShowManualEntryModal: (showManualEntryModal: boolean) => void;
  baseCurrency: any;
}

export interface SearchProps {
  searchList: any[];
  searchAction: (searchQuery: string) => void;
  setIsSearching: (isSearching: boolean) => void;
  params: { query: string };
  setParams: (param: object) => void;
  baseCurrency: any;
  showSearchedPayments: boolean;
}

export interface SearchDropdownProps {
  list: any[];
  baseCurrency: any;
  setSearchQuery: (searchQuery: string) => void;
  setIsClickedOnSearchOrSuggestion: (isClicked: boolean) => void;
}

export interface SearchedDataRowProps {
  suggestedItem: any;
  baseCurrency?: any;
  setSearchQuery?: (searchQuery: string) => void;
  setIsClickedOnSearchOrSuggestion: (isClicked: boolean) => void;
}
