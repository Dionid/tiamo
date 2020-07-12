# TIAMO – "True Identity and Access Management Oh yeah"
[![License](https://img.shields.io/github/license/mashape/apistatus.svg?style=flat-square)](https://github.com/Dionid/tiamo/blob/master/LICENSE.md)

*Status:* in-development

Authentication and Authorization services in one click!

Also a good starter-kit for new Node.js & TypeScript project.

Made on [Domain Driven Design Light (DDDL) Framework](https://github.com/Dionid/dddl).

# Setup

## Dev

1. Setup `Hasura` and `Mailgun`
1. Copy and set `.env_example > .env` & `.env_db_example > .env_db` (`MAIN_DB_CONNECTION_STRING` the same)
1. Run `cd packages && npm run gql:dev`

## Deploy

1. Setup Google App Engine and `gcloud` console
1. `npm run faq:deploy:gql`

# Techs

1. Architecture
    1. [Domain Driven Design Light (DDDL) Framework](https://github.com/Dionid/dddl)
    1. Event Driven Architecture (EDA)
    1. CQRS + CQRS bus
    1. Repositories
    1. Modular monolith
    1. IoC + DI
1. Code
    1. MailGun
    1. Apollo-server
    1. GraphQL
    1. Objection
1. DB
    1. PostgreSQL (+ Hasura)
1. Deployment
    1. Heroku for Hasura + PostgreSQL
    1. Google App Engine for main App
