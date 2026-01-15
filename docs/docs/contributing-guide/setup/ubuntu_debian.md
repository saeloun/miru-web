---
id: ubuntu-debian
title: Ubuntu / Debian
---

## Installation

#### 1. [Fork repository](https://github.com/saeloun/miru-web/fork) to your account

#### 2. Clone the repo to local

```bash
$ git clone https://github.com/<your-name>/miru-web.git
```

#### 3. Install [rvm](https://rvm.io/) and [nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

(**Tip**: To allow `nvm` to automatically detect and change node versions for
your project as you `cd` into the directory follow
[this](https://github.com/nvm-sh/nvm#deeper-shell-integration))

#### 4. Install Ruby

```bash
$ rvm install $(cat .ruby-version)
```

#### 5. Install Node 18.14.2(can be skipped if you followed the tip mentioned in (3) above)

```bash
$ nvm install $(cat .nvmrc)
```

#### 6. Install Postgres

```bash
$ sudo apt install postgresql-13
```

Verify postgres is up and running by:

```bash
$ sudo systemctl status postgresql.service
```

If not, to start it run:

```bash
$ sudo systemctl enable postgresql.service --now
```

Default superuser is `postgres`. Set password for the user by running:

```bash
$ sudo -u postgres psql -c "ALTER USER postgres PASSWORD '<new-password>';"
```

#### 7. Install Elasticsearch

The Elasticsearch components are not available in Ubuntu’s default package repositories. They can, however, be installed with APT after adding Elastic’s package source list.

All of the packages are signed with the Elasticsearch signing key in order to protect your system from package spoofing. Packages which have been authenticated using the key will be considered trusted by your package manager. In this step, you will import the Elasticsearch public GPG key and add the Elastic package source list in order to install Elasticsearch.

To begin, use cURL, the command line tool for transferring data with URLs, to import the Elasticsearch public GPG key into APT. Note that we are using the arguments -fsSL to silence all progress and possible errors (except for a server failure) and to allow cURL to make a request on a new location if redirected. Pipe the output of the cURL command into the apt-key program, which adds the public GPG key to APT.

```bash
$ curl -fsSL https://artifacts.elastic.co/GPG-KEY-elasticsearch | sudo apt-key add -
```

Next, add the Elastic source list to the `sources.list.d` directory, where APT will search for new sources:

```bash
$ echo "deb https://artifacts.elastic.co/packages/7.x/apt stable main" | sudo tee -a /etc/apt/sources.list.d/elastic-7.x.list
```

Next, update your package lists so APT will read the new Elastic source:

```bash
$ sudo apt update
```

Then install Elasticsearch with this command:

```bash
$ sudo apt install elasticsearch
```

Verify Elasticsearch is up and running by:

```bash
$ systemctl status elasticsearch.service
```

If not, to start it run:

```bash
$ sudo systemctl enable elasticsearch.service --now
```

#### 8. Install Redis

```bash
$ sudo apt install redis redis-server
```

Verify redis and redis-server is up and running by:

```bash
$ systemctl status redis.service
```

```bash
$ systemctl status redis-server.service
```

If not, to start it, run:

```bash
$ sudo systemctl enable redis.service redis-server.service --now
```

#### 9. Install Chrome/Chromium

Chrome or Chromium is required for PDF generation (invoices, reports, etc.). Install either one:

**Option 1: Google Chrome (Recommended)**

```bash
$ wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
$ sudo sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list'
$ sudo apt-get update
$ sudo apt-get install google-chrome-stable -y
```

**Option 2: Chromium (Alternative)**

```bash
$ sudo apt-get update
$ sudo apt-get install chromium-browser -y
```

You can verify the installation by running:

```bash
$ google-chrome --version
```

or

```bash
$ chromium-browser --version
```

#### 10. Setup the app

Go to the miru-web app directory

```bash
cd miru-web
```

Add database `username` as `postgres` and your `password` to `config/database.yml` under `default` section.

Run the initial setup script

```bash
./bin/setup
```

#### 11. Run app in local env

```bash
foreman start -f Procfile.dev
```

#### 12. Navigate to [http://0.0.0.0:3000](http://0.0.0.0:3000) for accessing the app

### To receive the emails in non-production apps.

Go to `/sent_emails` for accessing the emails(for `/sent_emails` route to work,
add `EMAIL_DELIVERY_METHOD='letter_opener_web'` to `.env`)

## Testing in Review apps

### User Test credentials

| Role     | Email               | Password |
| -------- | ------------------- | -------- |
| Owner    | vipul@example.com   | welcome |
| Admin    | supriya@example.com | welcome |
| Employee | sam@example.com     | welcome |
| Client   | oliver@example.com  | welcome |
