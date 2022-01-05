# README

## Miru-Web

Saeloun timetracking application.

### Installation

- Step 1: Clone repo to local

```
git clone https://github.com/saeloun/miru-web.git
```

- Step 2: Install ruby 3.0.3

```
rvm install $(cat .ruby-version)
```

- Step 3: Install Node 16.4.2

```
nvm install $(cat .nvmrc)
```

- Step 4: Install Postgres

```
brew install postgresql
```

- Step 5: Install gem

```
bundle install
```

- Step 6: Install node packages

```
yarn install
```

- Step 7: Setup ENV's

```
cp .env.example .env
```

- Step 8: Running app in local

```
foreman start -f Procfile.dev
```

### To receive the emails in non-production apps.

Go to `/sent_emails` for accessing the emails.

## Testing in Review apps

### User Test credentials

| Role     | Email               | Password |
| -------- | ------------------- | -------- |
| Owner    | vipul@example.com   | password |
| Admin    | supriya@example.com | password |
| Employee | akhil@example.com   | password |
