---
id: macos
title: Mac OS
---

## Installation

#### 1. [Fork repository](https://github.com/saeloun/miru-web/fork) to your account

#### 2. Clone repo to local

```bash
$ git clone https://github.com/<your-name>/miru-web.git
```

#### 3. Install [rvm](https://rvm.io/) and [nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

(**Tip**: To allow `nvm` to automatically detect and change node versions for
your project as you `cd` into the directory follow
[this](https://github.com/nvm-sh/nvm#deeper-shell-integration))

#### 4. Install ruby 3.1.1

```bash
rvm install $(cat .ruby-version)
```

#### 5. Install Node 16.4.2(can be skipped if you followed the tip mentioned in (2)

above)

```bash
nvm install $(cat .nvmrc)
```

#### 6. Install Postgres

```bash
brew install postgresql
```

#### 7. Install elasticsearch

```bash
brew install elastic/tap/elasticsearch-full
brew services start elasticsearch-full
```

#### 8. Install Redis

```bash
brew install redis
```

#### 9. Setup the app

```bash
# Go to the miru-web app directory

bin/setup
```

#### 10. Run app in local env

```bash
foreman start -f Procfile.dev
```

#### 11. Navigate to [http://0.0.0.0:3000](http://0.0.0.0:3000)

### To receive the emails in non-production apps.

Go to `/sent_emails` for accessing the emails(for `/sent_emails` route to work,
add `EMAIL_DELIVERY_METHOD='letter_opener_web'` to `.env`)

## Testing in Review apps

### User Test credentials

| Role     | Email               | Password |
| -------- | ------------------- | -------- |
| Owner    | vipul@example.com   | password |
| Admin    | supriya@example.com | password |
| Employee | akhil@example.com   | password |
