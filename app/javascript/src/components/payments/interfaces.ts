 
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
}

export interface HeaderProps {
  params: SearchParamsProps;
  payments: any[];
  showSearchedPayments: boolean;
  setParams: (params: SearchParamsProps) => void;
  setSearchedPaymentList: (paymentList: any[]) => void;
  setShowManualEntryModal: (showManualEntryModal: boolean) => void;
  setShowSearchedPayments: (showSearchedPayments: boolean) => void;
}

export interface SearchProps {
  searchList: any[];
  searchAction: (searchQuery: string) => void;
  params: { query: string };
  setParams: (param: object) => void;
  showSearchedPayments: boolean;
  setShowSearchedPayments: (showSearchedPayments: boolean) => void;
}

export interface SearchDropdownProps {
  list: any[];
  setSearchQuery: (searchQuery: string) => void;
  setIsClickedOnSearchOrSuggestion: (isClicked: boolean) => void;
}

export interface SearchedDataRowProps {
  suggestedPaymentClientName: string;
  setSearchQuery: (searchQuery: string) => void;
  setIsClickedOnSearchOrSuggestion: (isClicked: boolean) => void;
}

export interface PaymentsEmptyStateProps {
  setShowManualEntryModal: (showManualEntryModal: boolean) => void;
}
