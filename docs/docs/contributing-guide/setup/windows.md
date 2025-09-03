---
id: windows
title: Windows
---

## Prerequisites

If you already have WSL installed on your Windows machine, then you can skip
this step.

Install
[Windows Subsystem for Linux](https://learn.microsoft.com/en-us/windows/wsl/install-manual)
on your Windows machine.

## Installation

#### 1. Fork the repository and open WSL terminal

First, [fork the repository](https://github.com/saeloun/miru-web/fork) to your GitHub account, then open your WSL terminal.

#### 2. Clone repository to local machine

```bash
$ git clone https://github.com/<your-name>/miru-web.git
```

#### 3. Go to the project directory

```bash
cd miru-web
```

#### 4. Install RVM (Ruby Version Manager)

First, use the gpg command to contact a public key server and request the `RVM`
project’s key which is used to sign each `RVM` release.

```bash
gpg --keyserver hkp://keys.gnupg.net --recv-keys 409B6B1796C275462A1703113804BB82D39DC0E3 7D2BAF1CF37B13E2069D6956105BD0E739499BDB
```

Next, install the `gnupg2` package, as RVM’s installation script will use
components of that to verify the release.

```bash
sudo apt-get install gnupg2
```

You’ll be prompted for your password, and you should enter the password you used
for your Linux user when you installed Bash.

Next, use the curl command to download the `RVM` installation script from the
project’s website.

```bash
curl -sSL https://get.rvm.io -o rvm.sh
```

Execute this command to install the latest stable release of `RVM`:

```bash
cat rvm.sh | bash -s stable
```

Execute this command to make `rvm` accessible in your current session:

```bash
source ~/.rvm/scripts/rvm
```

#### 5. Install Ruby 3.4.5

Now use the `rvm` command to install the required version of Ruby:

```bash
rvm install $(cat .ruby-version)
```

You can check if ruby has been installed by running:

```bash
ruby -v
```

#### 6. Install nvm

To install `NVM` on your Ubuntu machine:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
```

This will install the `nvm` script to your user account. To use it, you must
first source your `.bashrc` file:

```bash
source ~/.bashrc
```

#### 7. Install Node 22.11.0

Now use the `nvm` command to install the required version of Node:

```bash
nvm install $(cat .nvmrc)
```

You can view the different versions you have installed by listing them:

```bash
nvm list
```

You can switch between installed versions with `nvm` use:

```bash
nvm use v22.11.0
```

#### 8. Install PostgreSQL

Refresh your server’s local package index:

```bash
sudo apt update
```

Then, install the Postgres package:

```bash
sudo apt install postgresql
```

Now, you can start the server:

```bash
sudo service postgresql start
```

Ensure that the server is running:

```bash
sudo service postgresql status
```



#### 9. Setup the app





```bash
$ bin/setup
```

#### 10. Run app in local env

```bash
# Start all services
$ foreman start -f Procfile.dev

# Or run services individually:
$ bin/rails server                    # Rails server (port 3000)
$ bin/vite dev                        # Vite dev server
$ bundle exec rake solid_queue:start  # Background job processor (database-based)
```

#### 11. Navigate to [http://0.0.0.0:3000](http://0.0.0.0:3000)

### To receive the emails in non-production apps.

Go to `/sent_emails` for accessing the emails(for `/sent_emails` route to work,
add `EMAIL_DELIVERY_METHOD='letter_opener_web'` to `.env`)

## Testing in staging environment

### User Test credentials

| Role     | Email               | Password |
| -------- | ------------------- | -------- |
| Owner    | vipul@example.com   | welcome  |
| Admin    | supriya@example.com | welcome  |
| Employee | sam@example.com     | welcome  |
| Client   | oliver@example.com  | welcome  |
