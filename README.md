<p align="center">
  <img src="https://getmiru.com/assets/images/image01.svg?v=097ef681" width="200" />
  <br/>
</p>

Miru is an open-source tool, designed to make time tracking, invoice management, and accounting easy for small businesses worldwide. It is a platform for organizations to help them streamline their workflow.

## Installation

1. Clone repo to local

```
git clone https://github.com/saeloun/miru-web.git
```

2. Install [rvm](https://rvm.io/) and
   [nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

   (**Tip**: To allow `nvm` to automatically detect and change node versions for
   your project as you `cd` into the directory follow
   [this](https://github.com/nvm-sh/nvm#deeper-shell-integration))

3. Install ruby 3.1.1

```
rvm install $(cat .ruby-version)
```

4. Install Node 16.4.2(can be skipped if you followed the tip mentioned in (2)
   above)

```
nvm install $(cat .nvmrc)
```

5. Install Postgres

```
brew install postgresql
```

6. Install elasticsearch

```
brew install elastic/tap/elasticsearch-full
brew services start elasticsearch-full
```

7. Install Redis

```
brew install redis
```

8. Install gem

```
bundle install
```

9. Install node packages

```
yarn install
```

10. Setup ENV's

```
cp .env.example .env
```

11. Update `DATABASE_URL` in `.env` as per local `psql` creds. For example, if
    the user is `root` and password is `password`, change the variable as
    `DATABASE_URL="postgres://root:password@localhost/miru_web?encoding=utf8&pool=5&timeout=5000"`

12. Update `APP_BASE_URL` in `.env` to `localhost:3000`
13. Run `bin/rails db:create RAILS_ENV=development` to create the database
14. Run `bin/rails db:migrate RAILS_ENV=development` for migrations
15. Run `bin/rails db:seed` for populating the database with initial data

16. Run app in local env

```
foreman start -f Procfile.dev
```

17. Navigate to [http://0.0.0.0:3000](http://0.0.0.0:3000)

### To receive the emails in non-production apps.

Go to `/sent_emails` for accessing the emails(for `/sent_emails` route to work,
add `EMAIL_DELIVERY_METHOD='letter_opener_web'` to `.env`)

### Tests & Coverage

#### Tests

1. Run `bin/rails db:create RAILS_ENV=test`
2. Run `bin/rails db:migrate RAILS_ENV=test`
3. Run `bundle exec rspec`

#### Coverage

1. Run `COVERAGE=true bundle exec rspec`
2. Open `coverage/index.html`(`open coverage/index.html` in MacOS and
   `xdg-open coverage/index.html` in Debian/Ubuntu)

## Testing in Review apps

### User Test credentials

| Role     | Email               | Password |
| -------- | ------------------- | -------- |
| Owner    | vipul@example.com   | password |
| Admin    | supriya@example.com | password |
| Employee | akhil@example.com   | password |

## Installation of Cypress Dependencies

Install the cypress dependencies using the following command:

```sh
cd cypress
yarn install
```

## Running Cypress tests

Cypress tests can be run on local, staging and production environment.

To run the cypress tests on the local environment and in headless mode use the
following command:

```sh
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

```sh
cd cypress
yarn run cy:run:staging
```

To run the tests on staging environment and in chrome browser use the following
command

```sh
cd cypress
yarn run cy:open:staging
```

## Deployment

### Heroku one-click deploy

You can deploy Miru on Heroku using the one-click-deployment button:

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/saeloun/miru-web/tree/main)
