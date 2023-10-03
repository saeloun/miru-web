<p align="center">
  <img src="https://miru.so/static/media/miru-blue-logo-with-text.5ba2b3fe09b9f038473f0a131f8a8bec.svg" width="200" />
  <br/>
</p>

Miru is an open-source tool, designed to make time tracking, invoice management,
and accounting easy for small businesses worldwide. It is a platform for
organizations to help them streamline their workflow.

![Github CI](https://github.com/saeloun/miru-web/actions/workflows/validations.yml/badge.svg?branch=develop)
![GitHub contributors](https://img.shields.io/github/contributors/saeloun/miru-web)
[![GitHub stars](https://img.shields.io/github/stars/saeloun/miru-web)](https://github.com/saeloun/miru-web/stargazers)
![GitHub release (latest by date)](https://img.shields.io/github/v/release/saeloun/miru-web)
![GitHub commit activity](https://img.shields.io/github/commit-activity/m/saeloun/miru-web)
[![GitHub license](https://img.shields.io/github/license/saeloun/miru-web)](https://github.com/saeloun/miru-web)
[![Twitter Follow](https://img.shields.io/twitter/follow/GetMiru?style=social)](https://twitter.com/getmiru)

<img src="https://user-images.githubusercontent.com/22231095/170423540-e10ada9e-cf1b-4a05-bbb6-2342955f46b0.png"  width="100%" alt="Miru Monthly Timetracking page"/>

<img src="https://user-images.githubusercontent.com/22231095/170424136-42f45a24-caa9-4b0e-b5fa-35bfe6f2e70b.png" width="100%" alt="Miru Invoice page"/>

---

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

3. Install ruby 3.2.2

```
rvm install $(cat .ruby-version)
```

4. Install Node 18.14.2(can be skipped if you followed the tip mentioned in (2)
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

To run elasticsearch on latest macos(ventura) please follow the below
instructions

- Install Docker Desktop ( M1 / Intel )
  https://www.docker.com/products/docker-desktop/
- Run below command in your terminal & you can check by opening `localhost:9200`

```
docker run -dp 127.0.0.1:9200:9200 -p 127.0.0.1:9300:9300 -e "discovery.type=single-node" docker.elastic.co/elasticsearch/elasticsearch:7.17.7
```

- Install Chrome Extension to browse the Cluster ( Kind of like PGAdmin for
  Elastic Search )
  https://chrome.google.com/webstore/search/multi%20elastic%20search%20head More
  information available at
  https://www.elastic.co/guide/en/elasticsearch/reference/current/docker.html

7. Install Redis

```
brew install redis
```

8. Setup the app

```
# Go to the miru-web app directory

bin/setup
```

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

### Running Tests in Parallel

Change `database.yml` to embed `TEST_ENV_NUMBER`

```yaml
test:
  database: miru_web_test_<%= ENV['TEST_ENV_NUMBER'] %>
```

```ruby
# Setup parallel specs
bundle exec rake parallel:create

# Copy Schema for new changes on branches
bundle exec rake parallel:prepare

# Run migrations if needed
bundle exec rake parallel:migrate

# Run all specs in parallel
RAILS_ENV=test bundle exec rake parallel:spec
```

#### Coverage

1. Run `COVERAGE=true bundle exec rspec`
2. Open `coverage/index.html`(`open coverage/index.html` in MacOS and
   `xdg-open coverage/index.html` in Debian/Ubuntu)

## Testing in Review apps

### User Test credentials

| Role        | Email                   | Password |
| ----------- | ----------------------- | -------- |
| Owner       | vipul@example.com       | welcome  |
| Admin       | supriya@example.com     | welcome  |
| Employee    | sam@example.com         | welcome  |
| Book keeper | book.keeper@example.com | welcome  |
| Client      | oliver@example.com      | welcome  |

## Configure Sentry:

To configure Sentry set the project's
[sentry dsn](https://docs.sentry.io/product/sentry-basics/dsn-explainer/#where-to-find-your-dsn)
as value to `SENTRY_DNS` environment variable.

## Community Support

- Feel free to join our [Discord](https://discord.gg/UABXyQQ82c) channel for
  support and questions.
- Subscribe our latest [blog articles](https://blog.miru.so) and tutorials.
- [Discussions](https://github.com/saeloun/miru-web/discussions): Post your
  questions regarding Miru Web
- [**Twitter**](https://twitter.com/getmiru)
- [Documentation](https://docs.miru.so)

## Contributing

We encourage everyone to contribute to Miru Web! Check out
[Contributing Guide](CONTRIBUTING.md) for guidelines about how to proceed.. <br>

Note: We are working on improving the documentation. So we had created a
docusaurus app for documentation. Check out the
[Miru Docs](https://github.com/saeloun/miru-web/docs).

## Contributors ✨

Thanks goes to all our contributors

<a href="https://github.com/saeloun/miru-web/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=saeloun/miru-web" />
</a>

## License

_Miru_ &copy; 2023, Saeloun - Released under the MIT License.
