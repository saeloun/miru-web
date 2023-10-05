---
id: switch
title: Switch
---

The Switch component is an UI element that allows users to toggle between two
states, typically representing an on/off or true/false choice. In this guide,
we'll walk you through how to use the Switch component in codebase..

#### Importing the Switch Component

To use the Switch component in our app, we need to import it from our styled
components. Here's how we can import it:

```
import { Switch } from "StyledComponents";
```

#### Using the Switch Component

The Switch component can be used with various props to control its appearance.
Here are some examples of how we can use it:

```
const [enabled, setEnabled] = useState(false);

<Switch enabled={enabled} onChange={setEnabled}  />
```

![switch not enabled](/img/switch/not-enabled.png)
![switch enabled](/img/switch/enabled.png)

<br/>

```
const [enabled, setEnabled] = useState(false);

const handleOnChange = () => {
  setEnabled(prevEnabled => !prevEnabled);
  // Make any api call or any extra logic you want to run on changing the toggle
}

<Switch enabled={enabled} onChange={handleOnChange}  />
```

#### Switch Component Props

| Name       | Description                                                          | Default Value |
| ---------- | -------------------------------------------------------------------- | ------------- |
| `enabled`  | Checks whether the Switch is enabled or not `bool`                   | `-`           |
| `onChange` | To specify the action to be triggered on changing the Switch. `func` | `-`           |
