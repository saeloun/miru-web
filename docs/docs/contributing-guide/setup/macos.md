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

#### 4. Install ruby 3.2.4

```bash
$ rvm install $(cat .ruby-version)
```

#### 5. Install Node 18.4.2(can be skipped if you followed the tip mentioned in (3) above)

```bash
$ nvm install $(cat .nvmrc)
```

#### 6. Install Postgres

```bash
$ brew install postgresql
```

#### 7. Install elasticsearch

```bash
$ brew install elastic/tap/elasticsearch-full
$ brew services start elasticsearch-full
```

To run elasticsearch on latest macos(ventura) please follow the below
instructions

- Install Docker Desktop ( M1 / Intel )
  https://www.docker.com/products/docker-desktop/
- Run below command in your terminal & you can check by opening `localhost:9200`

```bash
$ docker run -dp 127.0.0.1:9200:9200 -p 127.0.0.1:9300:9300 -e "discovery.type=single-node" docker.elastic.co/elasticsearch/elasticsearch:7.17.7
```

- Install Chrome Extension to browse the Cluster ( Kind of like PGAdmin for
  Elastic Search )
  https://chrome.google.com/webstore/search/multi%20elastic%20search%20head
- More information available at
  https://www.elastic.co/guide/en/elasticsearch/reference/current/docker.html

#### 8. Install Redis

```bash
$ brew install redis
```

#### 9. Setup the app

```bash
# Go to the miru-web app directory

$ bin/setup
```

#### 10. Run app in local env

```bash
$ foreman start -f Procfile.dev
```

#### 11. Navigate to [http://0.0.0.0:3000](http://0.0.0.0:3000)

### To receive the emails in non-production apps.

Go to `/sent_emails` for accessing the emails(for `/sent_emails` route to work,
add `EMAIL_DELIVERY_METHOD='letter_opener_web'` to `.env`)

## Testing in staging environment

### User Test credentials

| Role     | Email               | Password |
| -------- | ------------------- | -------- |
| Owner    | vipul@example.com   | welcome |
| Admin    | supriya@example.com | welcome |
| Employee | sam@example.com     | welcome |
| Client   | oliver@example.com    | welcome |
