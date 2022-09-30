---
id: cypress
title: Cypress
---

## Installation of Cypress Dependencies

Install the cypress dependencies using the following command:

```bash
cd cypress
yarn install
```

## Running Cypress tests

Cypress tests can be run on local, staging and production environment.

To run the cypress tests on the local environment and in headless mode use the
following command:

```bash
cd cypress
yarn run cy:run:dev
```

To run the tests on local environment and in chrome browser use the following
command:

```sh
cd cypress
yarn run cy:open:dev
```

To run the tests on staging environment and in headless mode use the following
command:

```bash
cd cypress
yarn run cy:run:staging
```

To run the tests on staging environment and in chrome browser use the following
command

```bash
cd cypress
yarn run cy:open:staging
```
