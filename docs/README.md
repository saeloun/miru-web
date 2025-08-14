<p align="center">
  <img alt="Miru logo" src="https://miru.so/static/media/miru-blue-logo-with-text.5ba2b3fe09b9f038473f0a131f8a8bec.svg" width="200px" />
  <h1 align="center">Miru Documentation</h1>
</p>

<p align="center">
  <strong>Modern, open-source time tracking and invoicing platform</strong>
</p>

<p align="center">
  <a href="https://docs.miru.so">Documentation</a> • 
  <a href="https://github.com/saeloun/miru-web">Main Repository</a> • 
  <a href="https://discord.gg/UABXyQQ82c">Discord</a>
</p>

---

This repository contains the documentation website for Miru, built with [Docusaurus 3](https://docusaurus.io/). The live documentation is available at [docs.miru.so](https://docs.miru.so).

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (we use Node 22.11.0)
- npm, yarn, or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/saeloun/miru-web.git
cd miru-web/docs

# Install dependencies (choose one)
npm install
# or
yarn install
# or
pnpm install
```

### Local Development

```bash
# Start the development server
npm start
# or
yarn start
# or
pnpm start
```

This starts a local development server and opens [http://localhost:3000](http://localhost:3000) in your browser. Most changes are reflected live without restarting the server.

### Build

```bash
# Generate static files
npm run build
# or
yarn build
# or
pnpm build
```

This generates static content in the `build` directory, ready for deployment to any static hosting service.

## 📖 Documentation Structure

```
docs/
├── docs/                          # Documentation pages
│   ├── intro.md                  # Landing page
│   ├── contributing-guide/       # Developer guides
│   │   ├── setup/               # Setup instructions
│   │   ├── testing/             # Testing documentation
│   │   └── guidelines.md        # Contribution guidelines
│   └── product-guide/           # User guides
├── static/                       # Static assets
│   └── img/                     # Images and screenshots
├── src/                         # Custom components and styling
├── docusaurus.config.js         # Docusaurus configuration
└── sidebars.js                  # Sidebar navigation
```

## 🛠️ Technology Stack

- **[Docusaurus 3](https://docusaurus.io/)**: Documentation framework
- **[React 18](https://reactjs.org/)**: UI components
- **[MDX](https://mdxjs.com/)**: Markdown with JSX support
- **[Tailwind CSS](https://tailwindcss.com/)**: Utility-first CSS framework
- **[Prism](https://prismjs.com/)**: Syntax highlighting

## 🤝 Contributing

We welcome contributions to improve the documentation! Here's how you can help:

### Quick Fixes
For small changes like typos or clarifications:
1. Click the "Edit this page" link at the bottom of any documentation page
2. Make your changes in GitHub's web editor
3. Submit a pull request

### Larger Changes
For substantial improvements:
1. Fork the repository
2. Create a feature branch: `git checkout -b improve-setup-guide`
3. Make your changes and test locally
4. Commit with a clear message: `git commit -m "docs: improve macOS setup instructions"`
5. Push and create a pull request

### Writing Guidelines
- **Use clear, concise language**: Write for developers of all experience levels
- **Include examples**: Code snippets and screenshots help users understand
- **Test your changes**: Ensure documentation builds successfully
- **Follow the style guide**: Use consistent formatting and structure

### Running Tests
```bash
# Check for broken links and build issues
npm run build

# Lint markdown files
npm run lint

# Spell check (if configured)
npm run spell-check
```

## 📋 Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start development server |
| `npm run build` | Build for production |
| `npm run serve` | Preview production build |
| `npm run clear` | Clear Docusaurus cache |
| `npm run write-translations` | Extract translatable strings |
| `npm run write-heading-ids` | Generate heading IDs |
| `npm run typecheck` | TypeScript type checking |

## 🔧 Configuration

### Docusaurus Configuration
Main configuration is in `docusaurus.config.js`:
- Site metadata (title, description, URL)
- Theme configuration
- Plugin setup
- Navigation menu
- Footer links

### Sidebar Navigation
Customize the sidebar in `sidebars.js`:
```javascript
module.exports = {
  tutorialSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Contributing Guide',
      items: ['contributing-guide/guidelines', 'contributing-guide/setup'],
    },
  ],
};
```

## 🎨 Customization

### Custom Components
Add React components in `src/components/`:
```jsx
// src/components/FeatureCard.js
import React from 'react';

export default function FeatureCard({ title, description, icon }) {
  return (
    <div className="card">
      <div className="card__header">
        <h3>{icon} {title}</h3>
      </div>
      <div className="card__body">
        <p>{description}</p>
      </div>
    </div>
  );
}
```

### Custom Styling
Override styles in `src/css/custom.css`:
```css
:root {
  --ifm-color-primary: #2e8555;
  --ifm-code-font-size: 95%;
}

.hero__subtitle {
  font-size: 1.2rem;
}
```

## 📦 Deployment

### GitHub Pages
Automatic deployment is configured via GitHub Actions. Every push to `main` triggers a build and deploys to GitHub Pages.

### Manual Deployment
```bash
# Build and deploy to gh-pages branch
npm run deploy

# Or build manually and upload to your hosting service
npm run build
# Upload the 'build' directory contents
```

### Environment Variables
For custom deployments, set these environment variables:
- `GITHUB_TOKEN`: For GitHub Pages deployment
- `VERCEL_TOKEN`: For Vercel deployment
- `NETLIFY_AUTH_TOKEN`: For Netlify deployment

## 🐛 Troubleshooting

### Common Issues

#### Build Failures
```bash
# Clear cache and rebuild
npm run clear
npm run build
```

#### Broken Links
```bash
# Check for broken internal links
npm run build 2>&1 | grep "Broken link"
```

#### Styling Issues
```bash
# Regenerate CSS
rm -rf .docusaurus
npm start
```

#### Node Version Issues
```bash
# Check Node version (should be 18+)
node --version

# Use nvm to switch versions
nvm use 22.11.0
```

## 👥 Contributors

Thanks to all the amazing people who have contributed to Miru's documentation:

<a href="https://github.com/saeloun/miru-web/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=saeloun/miru-web" alt="Contributors" />
</a>

*Made with [contrib.rocks](https://contrib.rocks).*

### How to Contribute
1. **Fix typos and improve clarity**: Small improvements are always welcome
2. **Add examples and screenshots**: Help users understand complex concepts
3. **Write new guides**: Share your expertise with the community
4. **Translate documentation**: Help make Miru accessible globally
5. **Improve navigation**: Suggest better organization and structure

## 📄 License

This documentation is licensed under the [MIT License](../LICENSE), the same as the main Miru project.

## 🔗 Links

- **Main Repository**: [github.com/saeloun/miru-web](https://github.com/saeloun/miru-web)
- **Live Application**: [miru.so](https://miru.so)
- **Documentation**: [docs.miru.so](https://docs.miru.so)
- **Discord Community**: [Join us](https://discord.gg/UABXyQQ82c)
- **Twitter**: [@saeloun](https://twitter.com/saeloun)

---

<p align="center">
  Built with ❤️ by the <a href="https://saeloun.com">Saeloun</a> team and <a href="https://github.com/saeloun/miru-web/graphs/contributors">contributors</a> worldwide.
</p>