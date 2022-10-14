
# Docker Setup Guide

Make sure you have Docker installed on your system.
If not please follow [this](https://docs.docker.com/get-docker/) guide.
Also, don't forget to stop your local running services like postgres, redis and elasticsearch while you're using docker to run your app.
This will prevent you from port binding conflicts which might already be taken by your local running services.
## Installation

#### 1. [Fork repository](https://github.com/saeloun/miru-web/fork) to your account

#### 2. Clone the repo to local

```bash
$ git clone https://github.com/<your-name>/miru-web.git
```

#### 3. Go to the project directory
```bash
$ cd miru-web/
```
#### 4. Start Docker containers for your services
 To start all docker services defined in `docker-compose.yml`, Run:
```bash
$ docker compose up
```
Wait for the Docker to build the image defined in `Dockerfile.local` and up your containers for defined services in `docker-compose.yml`.
Once the database and redis service are up, Webpacker will compile the assets, and you will see your rails server running with elasticsearch and sidekiq.

#### 5. Setup database
Once you see everything running correctly, Open a new terminal tab and run:
```bash
$ docker-compose exec app bundle exec rails db:reset
```
OR you can exit out of the running server by pressing `Ctrl + C` and run:
```bash
$ docker-compose run --rm app bundle exec rails db:reset
```
Note that `db:reset` and `db:setup` both will work here.
`db:reset` is just equivalent to `bin/rails db:drop db:setup`.\
This will setup your database with seed data.
#### 6. Navigate to [http://0.0.0.0:3000](http://0.0.0.0:3000) to access your running app.

#### 7. To run rails console
When app is running, open a new terminal tab and run:
```bash
$ docker-compose exec app bundle exec rails console
```
OR run:
```bash
$ docker-compose run --rm app bundle exec rails console
```
when app is not running.\
Similarly if you add new migrations or want to rollback previous one you can always follow the above mentioned procedure like:
```bash
$ docker-compose exec app bundle exec rails db:migrate
```
OR
```bash
$ docker-compose run --rm app bundle exec rails db:migrate
```

### To receive the emails in non-production apps.

Go to `/sent_emails` for accessing the emails(for `/sent_emails` route to work,
add `EMAIL_DELIVERY_METHOD='letter_opener_web'` to `.env`)

### User Test credentials

| Role     | Email               | Password |
| -------- | ------------------- | -------- |
| Owner    | vipul@example.com   | password |
| Admin    | supriya@example.com | password |
| Employee | akhil@example.com   | password |
