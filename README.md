# README

## Miru-Web

Saeloun timetracking application.

### Installation

1. Clone repo to local

```
git clone https://github.com/saeloun/miru-web.git
```

2. Install [rvm](https://rvm.io/) and
   [nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

   (**Tip**: To allow `nvm` to automatically detect and change node versions for
   your project as you `cd` into the directory follow
   [this](https://github.com/nvm-sh/nvm#deeper-shell-integration))

3. Install ruby 3.1.0

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

6. Install gem

```
bundle install
```

7. Install node packages

```
yarn install
```

8. Setup ENV's

```
cp .env.example .env
```

9. Update `DATABASE_URL` in `.env` as per local `psql` creds. For example, if
   the user is `root` and password is `password`, change the variable as
   `DATABASE_URL="postgres://root:password@localhost/miru_web?encoding=utf8&pool=5&timeout=5000"`

10. Run `bin/rails db:create RAILS_ENV=development` to create the database
11. Run `bin/rails db:migrate RAILS_ENV=development` for migrations
12. Run app in local env

```
foreman start -f Procfile.dev
```

13. Navigate to [http://0.0.0.0:3000](http://0.0.0.0:3000)

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
