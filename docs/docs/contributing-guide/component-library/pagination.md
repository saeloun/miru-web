---
id: pagination
title: Pagination
description: Display data in pages
---

Pagination component is a versatile and reusable component that provides
functionality to display data in pages. We can customize it by passing various
props to suit our component needs. In this guide, we'll walk through how to use
the Pagination component in codebase.

#### Importing the Pagination Component

To use the Pagination component in our app, we need to import it from our styled
components. Here's how we can import it:

```javascript
import { Pagination } from "StyledComponents";
```

![default pagination](/img/pagination/default.png)

<br/>

#### Using the Pagination Component

Pagination component can be used with various props to control its appearance.
Here is an example of how we can use it:

```javascript
<Pagination
  currentPage={paginationDetails?.page}
  handleClick={handlePageClick}
  isFirstPage={paginationDetails?.first}
  isLastPage={paginationDetails?.last}
  nextPage={paginationDetails?.next}
  prevPage={paginationDetails?.prev}
  totalPages={paginationDetails?.pages}
/>
```

Pagination component with per page view.

```javascript
<Pagination
  isPerPageVisible
  currentPage={pagy?.page}
  handleClick={handlePageClick}
  handleClickOnPerPage={handleClickOnPerPage}
  isFirstPage={pagy?.first}
  isLastPage={pagy?.last}
  itemsPerPage={pagy?.items}
  nextPage={pagy?.next}
  prevPage={pagy?.prev}
  title="invoices/page"
  totalPages={pagy?.pages}
/>
```

![per page pagination](/img/pagination/per-page.png)

<br/>

#### Pagination Component Props

| Name                 | Description                                                                                                   | Default Value |
| -------------------- | ------------------------------------------------------------------------------------------------------------- | ------------- |
| totalPages           | Specify the total number of pages. `number`                                                                   | `-`           |
| currentPage          | Specify the current page number. `number`                                                                     | `-`           |
| isFirstPage          | Specify whether the current page is first page or not. `boolean`                                              | `-`           |
| isLastPage           | Specify whether the current page is last page or not. `boolean`                                               | `-`           |
| prevPage             | Specify the previous page number. `number`                                                                    | `-`           |
| nextPage             | Specify the next page number. `number`                                                                        | `-`           |
| handleClick          | Specify the callback which will be invoked when the page number or previous or next button is clicked. `func` | `(e) => void` |
| isPerPageVisible     | Specify whether per page view option with functionality required or not. `boolean`                            | `false`       |
| title                | Specify the title text that needs to be displayed on per page. `string`                                       | `items/page`  |
| itemsPerPage         | Specify number of items thats needed to be fetched for per page view option. `number`                         | `10`          |
| handleClickOnPerPage | Specify the callback which will be invoked when the per page option is clicked. `func`                        | `(e) => void` |
