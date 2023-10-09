---
id: documentation
title: Working with Documentation
description: Learn how to work with documentation
---

Thank you for your interest in contributing to the documentation for Miru Web! Your contributions help improve the user experience and make it easier for others to use and understand the application.

Miru Docs is built using [Docusaurus 2](https://v2.docusaurus.io/), a modern static website generator. This guide will walk you through the steps required to set up the project locally and make changes to the documentation.

## Installation

#### 1. [Fork repository](https://github.com/saeloun/miru-web/fork) to your account

#### 2. Clone the repo to local

```bash
git clone https://github.com/<your-name>/miru-web.git
```

#### 3. Navigate to the project directory and install the required dependencies

```bash
cd miru-web/docs
yarn install
```

#### 4. Start the development server

```bash
yarn start
```

#### 5. Navigate to [http://localhost:3000](http://localhost:3000) to access your running app.

## Making changes

### Document Structure

- All documentation is located in the docs folder of the repository.

- Use Markdown files (.md) to create or edit documentation pages.

- Maintain a clear and organized folder structure. Each major section or topic should have its  own subfolder within the docs directory.

- Add a link to the new document in the appropriate sidebar configuration file to ensure it appears in the navigation.

### Writing Style

- Follow the [Markdown style guide](https://www.markdownguide.org) for consistent formatting.

- Use headings (##, ###, etc.) for section titles.

- Include code blocks where necessary to provide examples or code snippets.

- If you're referencing code, make sure it's up-to-date and accurate.

- Use links for cross-referencing to other documentation pages or external resources when relevant.
