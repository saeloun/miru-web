<p align="center">
  <img alt="Miru logo" src="https://getmiru.com/assets/images/image01.svg?v=097ef681" width="100px" />
  <h1 align="center">Miru Documentation</h1>
</p>

This repository contains the Miru documentation website code and Markdown source files for [docs.getmiru.com](docs.getmiru.com)

### Installation

```
$ yarn
```

### Local Development

```
$ yarn start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

### Build

```
$ yarn build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

### Deployment

Using SSH:

```
$ USE_SSH=true yarn deploy
```

Not using SSH:

```
$ GIT_USER=<Your GitHub username> yarn deploy
```

If you are using GitHub pages for hosting, this command is a convenient way to build the website and push to the `gh-pages` branch.
