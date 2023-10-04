---
id: button
title: Button
---

The Button component is a versatile and reusable component that allows us to
create buttons with different styles and sizes in our app. We can customize it
by passing various props to suit our component needs. In this guide, we'll walk
through how to use the Button component in codebase.

#### Importing the Button Component

To use the Button component in our app, we need to import it from our styled
components. Here's how we can import it:

```
import { Button } from "StyledComponents";
```

![default btn](/img/button/primary-btn.png)

#### Using the Button Component

The Button component can be used with various props to control its appearance.
Here are some examples of how we can use it:

```
<Button
  style="secondary"
>
  Click here
</Button>
```

![default btn](/img/button/secondary-btn.png)

```
<Button
  style="ternary"
>
  Click here
</Button>
```

![default btn](/img/button/ternary-btn.png)

#### Button Component Props

| Name        | Description                                                              | Default Value     |
| ----------- | ------------------------------------------------------------------------ | ----------------- |
| `style`     | To specify the style of the Button. `"primary", "secondary", "ternary" ` | `primary`         |
| `onClick`   | To specify the action to be triggered on clicking the Button. `func`     | `"(e) => (void)"` |
| `size`      | To set the size of the Button. `"small", "medium", "large"`              | `"medium"`        |
| `disabled`  | To set Button as disabled `bool`                                         | `false`           |
| `className` | To provide external classnames to Button component. `string`             | `""`              |
| `fullWidth` | To take the full width of parent component `bool`                        | `false`           |
| `children`  | To specify the children to be rendered inside the Button `string`        | `""`              |
| `type`      | To specify the type of Button `"button", "reset", "submit" `             | `"button"`        |
