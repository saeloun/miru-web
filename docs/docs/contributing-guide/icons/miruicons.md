---
id: miruicons
title: Miru Icons
---

## A Guide to Using Icons in the App and Adding New Icons

Icons play a crucial role in user interface (UI) design, offering visual cues
that enhance user experience and navigation. However, managing a consistent set
of icons across app can be challenging.

MiruIcons, a solution designed to simplify icon management, promote UI
consistency, and save development time. In this guide, we'll explore how to use
MiruIcons and even how to add new icons when they are not yet available in the
collection.

#### What Are MiruIcons?

MiruIcons is a comprehensive collection of reusable icons tailored for our app's
needs. This collection includes a mix of icons, ranging from popular third-party
icons to custom-designed ones. By centralizing icons in one place, MiruIcons
ensures that our app maintains a cohesive and consistent visual identity.

#### Benefits of Using MiruIcons

- **UI Consistency:** MiruIcons enforces a unified style, preventing the use of
  disparate icons across our app.
- **Reuse and Efficiency:** Developers can easily import and reuse icons,
  reducing the need to create icons from scratch.
- **Scalability:** As our app grows, MiruIcons can expand to accommodate new
  icons seamlessly.

### Using MiruIcons

#### Importing MiruIcons

To get started with MiruIcons, we'll need to import the icons into components.
The following examples demonstrate how to do this:

```javascript
import { CaretCircleLeftIcon } from "miruIcons";
import { SearchIcon } from "miruIcons";
import { XIcon } from "miruIcons";
```

#### Importing Multiple Icons

```javascript
import { PencilIcon, DeleteIcon } from "miruIcons";
import { SearchIcon, FilterIcon } from "miruIcons";
```

### Adding New Icons to MiruIcons

One of the strengths of MiruIcons is its flexibility. If we need an icon that
isn't already in the collection, we can easily add it. Follow these steps:

- **Step 1: Prepare the Icon File** Before adding a new icon, we'll need the
  icon's SVG file or import it from `@phosphor-icons/react` package or we can even add
  gif file. Basically we can create our own or obtain one that suits our needs.
  Ensure the file adheres to any format or dimension requirements.

- **Step 2: Add the Icon to the MiruIcons Folder** Next, place the newly
  acquired icon file in the appropriate MiruIcons folder. It's essential to
  maintain a structured hierarchy for icons to keep things organized. Export the
  newly added icon from the `index.tsx` file of MiruIcons.

- **Step 3: Import and Use the New Icon** With the icon file in place, we can
  import and use it just like any other MiruIcon:

```javascript
import { NewCustomIcon } from "miruIcons";
```

Congratulations! We've successfully added a new icon to MiruIcons.

### Conclusion

MiruIcons simplifies the process of managing icons in our app, offering both
existing icons for consistency and an easy way to add new ones. By following the
steps outlined in this guide, we can enhance our app's UI while maintaining a
cohesive design.
