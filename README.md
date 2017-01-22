# apollo-passport-local

Forked from [apollo-passport/local](https://github.com/apollo-passport/local)
Local strategy using email address and hashed, bcrypted password.

[![npm](https://img.shields.io/npm/v/apollo-passport-local.svg?maxAge=2592000)](https://www.npmjs.com/package/apollo-passport-local) [![Circle CI](https://circleci.com/gh/apollo-passport/local.svg?style=shield)](https://circleci.com/gh/apollo-passport/local) [![Coverage Status](https://coveralls.io/repos/github/apollo-passport/local/badge.svg?branch=master)](https://coveralls.io/github/apollo-passport/local?branch=master) ![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)

Copyright (c) 2017 by Gilad Shoham, released under the MIT license.

## New Features in this fork (Highlights)
* Add account verification token during create user
* Add apVerifyAccount mutation to verify the account
* Add recoverPassworedRequest mutation to create reset password token
* Add option to define input apUserInput (outside) for creating new users with your desired fields
* Add options to pass hooks method (onCreateUserEnd, onRecoverPasswordRequestEnd) (for example to send verification emails)

## New Features in this fork (Usage)

## Features

* Authenticate users with an **email and password**.
* Passwords stored in the database are encrypted with [bcrypt](https://en.wikipedia.org/wiki/Bcrypt).

## Usage

See https://github.com/gadicc/apollo-passport.

Note: you don't usually need a special `apollo-passport-xxx` package for every passport strategy.  `apollo-passport-local` is a special case because of it's dependencies, e.g. `bcrypt` and some client-side hashing.

```sh
$ npm i --save passport-local apollo-passport-local
```

**Server**

```js
import { Strategy as LocalStrategy } from 'passport-local';

// Your previously created ApolloPassport instance...
apolloPassport.use('local', LocalStrategy /*, options */);
```

**Client**

```js
import ApolloPassportLocal from 'apollo-passport-local/lib/client';

// Your previously created ApolloPassport instance...
apolloPassport.use('local', ApolloPassportLocal);
```
