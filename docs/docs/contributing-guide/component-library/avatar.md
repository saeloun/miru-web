---
id: avatar
title: Avatar
---

The Avatar component is a versatile and reusable component that allows us to display user avatars or profile pictures in our app. We can customize it by passing various props to suit our component needs. In this guide, we'll walk through how to use the Avatar component in codebase.

#### Importing the Avatar Component
To use the Avatar component in our app, we need to import it from our styled components. Here's how we can import it:

```
import { Avatar } from "StyledComponents";
```
![default avatar](/img/avatar/default.png)

#### Using the Avatar Component
The Avatar component can be used with various props to control its appearance. Here are some examples of how we can use it:

```
<Avatar
  url={company.logo || logo}
/>
```
![avatar with url](/img/avatar/with-url.png)


```
<Avatar
  name="Hello Moto"
/>
```

![avatar with name](/img/avatar/with-name.png)

```
<Avatar
  name="Hello Moto"
  initialsLetterCount={1}
/>
```
![avatar with name](/img/avatar/with-initials-count.png)

```
<Avatar
  classNameImg="mr-5"
  classNameInitials="lg:text-5xl text-lg font-bold capitalize text-white"
  classNameInitialsWrapper="mr-5 bg-miru-gray-1000"
  initialsLetterCount={1}
  name={company.name}
  size="h-10 w-10 lg:h-20 lg:w-20"
  url={company.logo || logo}
/>
```

#### Avatar Component Props

| Name | Description | Default Value |
|---------------|-----------------------------------------------------------|---------------|
| `url` | Provide the url of the logo | `""` |
| `name` | Pass any name or string value, so that it will display the avatar with initials. | `""` |
| `initialsLetterCount` | Number of initials to appear in the avatar if the name is provided instead of url | 2 |
| `size` | Specify the size of the avatar. | `"md:h-10 md:w-10 h-6 w-6"` |
| `classNameImg` | Specify the style classes needed avatar image | `"inline-block rounded-full"` |
| `classNameInitials`   | To provide external classnames for the initials styling. Should be a string. | `"md:text-xl text-xs md:font-medium font-light leading-none text-white"` |
| `classNameInitialsWrapper` | To provide external classnames for the initials wrapper styling. Should be a string. | `"inline-flex rounded-full items-center justify-center bg-gray-500"` |
| `style`| Custom css styles which are not the part of tailwind. | `""` |
