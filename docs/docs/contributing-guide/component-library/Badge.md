---
id: badge
title: Badge
description: Display information with badges or labels
---

The Badge component is a versatile and reusable component that allows us to
display badges or labels in our app. We can customize it by passing various
props to suit our component needs. In this guide, we'll walk through how to use
the Badge component in codebase.

#### Importing the Badge Component

To use the Badge component in our app, we need to import it from our styled
components. Here's how we can import it:

```
import { Badge } from "StyledComponents";
```

![default badge](/img/badge/default.png)

#### Using the Badge Component

The Badge component can be used with various props to control its appearance.
Here are some examples of how we can use it:

```
<Badge
  text="Paid"
/>
```

![with text](/img/badge/with-text.png)

```
<Badge
  className="uppercase"
  text="Paid"
/>
```

![with class](/img/badge/with-class.png)

```
<Badge
  className="uppercase"
  bgColor="bg-miru-alert-green-400"
  text="Paid"
/>
```

![with bgcolor](/img/badge/with-bg-color.png)

```
<Badge
  className="mt-2 uppercase"
  bgColor="bg-miru-alert-blue-400"
  color="text-miru-alert-blue-1000"
  text="Paid"
/>
```

![with bgcolor](/img/badge/with-color.png)

```
<Badge
  className="bg-miru-alert-yellow-400 text-miru-alert-green-1000 mt-2 uppercase"
  text="Paid"
/>
```

![with class colors](/img/badge/with-class-colors.png)

#### Badge Component Props

| Name        | Description                                                | Default Value                                                                                         |
| ----------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `text`      | Provide the name of the badge.                             | `Badge`                                                                                               |
| `color`     | Specify the text color of the badge.                       | `text-purple-800`                                                                                     |
| `bgColor`   | Specify the background color of badge.                     | `bg-purple-100`                                                                                       |
| `className` | Specify the extra style classes needed for Badge component | `inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold leading-4 tracking-widest` |
