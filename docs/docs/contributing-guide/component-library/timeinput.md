---
id: timeinput
title: TimeInput
description: Input time in hours and minutes format
---

The TimeInput component is a versatile and reusable component that allows users
to input time in hours and minutes format. It allows only numbers as input. We
can customize it by passing various props to suit our component needs. In this
guide, we'll walk through how to use the TimeInput component in codebase.

#### Importing the TimeInput Component

To use the TimeInput component in our app, we need to import it from our styled
components. Here's how we can import it:

```javascript
import { TimeInput } from "StyledComponents";
```

![default timeinput](/img/timeinput/default.png)

#### Using the TimeInput Component

The TimeInput component can be used with various props to control its
appearance. Here are some examples of how we can use it:

```javascript
<TimeInput
  className="h-8 w-20 rounded-sm bg-miru-gray-100 p-1 text-sm
  onTimeChange={() => ()}
/>
```

```javascript
<TimeInput
  className="h-8 w-20 rounded-sm bg-miru-gray-100 p-1 text-sm placeholder:text-miru-gray-1000"
  initTime={duration}
  name="timeInput"
  onTimeChange={handleDurationChange}
/>
```

#### TimeInput Component Props

| Name           | Description                                                                 | Default Value |
| -------------- | --------------------------------------------------------------------------- | ------------- |
| `initTime`     | Provide the initial time value for the input `string`                       | `""`          |
| `disabled`     | To set input as disabled `bool`                                             | `false`       |
| `onTimeChange` | To specify the action to be triggered on changing of the input value `func` | `-`           |
| `placeholder`  | Provide the input placeholder value `string`                                | `"HH:MM"`     |
| `className`    | To provide external classnames to input `string`                            | `""`          |
| `name`         | Provide the name for the input `string`                                     | `""`          |
