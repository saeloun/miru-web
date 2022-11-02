<p align="center">
  <img src="https://miru.so/static/media/miru-blue-logo-with-text.5ba2b3fe09b9f038473f0a131f8a8bec.svg" width="200" />
  <br/>
</p>

Miru is an open-source tool, designed to make time tracking, invoice management, and accounting easy for small businesses worldwide. It is a platform for organizations to help them streamline their workflow.

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

## Community Support

- Feel free to join our [Discord](https://discord.gg/UABXyQQ82c) channel for support and questions.
- Subscribe our latest [blog articles](https://blog.miru.so) and tutorials.
- [Discussions](https://github.com/saeloun/miru-web/discussions): Post your questions regarding Miru Web
- [**Twitter**](https://twitter.com/getmiru)
- [Documentation](https://docs.miru.so)

## Contributing
We encourage everyone to contribute to Miru Web! Check out [Contributing Guide](CONTRIBUTING.md) for guidelines about how to proceed.. <br>

Note: We are working on improving the documentation. So we had created a docusaurus app for documentation. Check out the [Miru Docs](https://github.com/saeloun/miru-docs/) Repo.

## Contributors ✨

Thanks goes to all our contributors

<a href="https://github.com/saeloun/miru-web/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=saeloun/miru-web" />
</a>

## License

*Miru* &copy; 2022, Saeloun - Released under the MIT License.
