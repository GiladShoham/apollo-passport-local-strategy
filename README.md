# apollo-passport-local

Forked from [apollo-passport/local](https://github.com/apollo-passport/local)
Local strategy using email address and hashed, bcrypted password.

[![npm](https://img.shields.io/npm/v/apollo-passport-local.svg?maxAge=2592000)](https://www.npmjs.com/package/apollo-passport-local-strategy) [![Circle CI](https://circleci.com/gh/apollo-passport/local.svg?style=shield)](https://circleci.com/gh/apollo-passport/local) [![Coverage Status](https://coveralls.io/repos/github/apollo-passport/local/badge.svg?branch=master)](https://coveralls.io/github/apollo-passport/local?branch=master) ![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)

Copyright (c) 2017 by Gilad Shoham, released under the MIT license.

## New Features in this fork (Highlights)
* Add option to define input apUserInput (outside) for creating new users with your desired fields
* Add account verification token during create user
* Add apVerifyAccount mutation to verify the account
* Add recoverPasswordRequest mutation to create reset password token
* Add options to pass hooks method (onCreateUserEnd, onRecoverPasswordRequestEnd, onVerifyAccountEnd, onRecoverPasswordEnd, onLoginEnd) (for example to send verification emails)
* Improve errors format (Add error code)
* Allow users without services to register even if their email already exist (Merge with existing user) for case that the user added from outside and not really registered

## New Features in this fork (Usage)
### Use my fork of [apollo-passport-mongodb-driver](https://github.com/GiladShoham/apollo-passport-mongodb-driver)
```js
npm install apollo-passport-mongodb-driver
```

### Import my version of local strategy
In [apollo-passport](https://github.com/apollo-passport/apollo-passport#getting-started) docs, you will see this line:
```js
import { Strategy as LocalStrategy } from 'passport-local';
```
It should be replaced by:
```js
import { Strategy as LocalStrategy } from 'apollo-passport-local-strategy/lib/index';
```
(If you don't do this, the options like hooks will not work)

### Mutation and types signatures
```js
const typeDefinitions = `
type RootMutation {
  apCreateUserEmailPassword (input: apUserInput!): PassportResult,
  apVerifyAccount (userId: String, verificationToken: String!): SimpleError,
  apRecoverPasswordRequest (email: String): String,
  apRecoverPassword (userId: String!, token: String!, newPassword: String!): String,
  apUpdateUserPassword (userId: String!, oldPassword: String!, newPassword: String!): String,
  apLoginEmailPassword (email: String!, password: String!): PassportResult
}

type SimpleError {
  errCode: String,
  errMessage: String
}
`;
```

### Define apUserInput
You should define your own userInput type (named apUserInput).
This way you can define what ever fields you want to be part of the registration process.
You have to make sure that you have email and password fields, because the library used them internally.


Example:
```js
`input apUserInput {
  # User email
  email: String!
  # User password
  password: String!
  # User first name
  firstName: String!
  # User last name
  lastName: String!
  # office phone number
  phone: String
  # Personal mobile phone number
  mobilePhone: String
}
`;
```

### Account verification token during create user
During create user the library will add these fields to the new user:

* verificationToken -
The token generated using this code:
```js
crypto.randomBytes(20, (err, buf) => {
  var token = buf.toString('hex');
});
```

verificationTokenExpiration - An expiration to account verification token (Will be used during verify account), defalut to be 1 month.
You can change it via configuration.

verified - Will be set to false during creation, and will be change to true on verify account.

### Recover Password Request mutation to create reset password token
A new mutation to generate tokens for reset password.
The tokens will be generated the same way as the account verification token.
The name of the token fields will be:
* resetPassToken
* resetPassTokenExpiration
Once a reset password request has been submitted, the verified will be change to false again.
If the user has never verified his account the account verification token will be deleted.
(The reason beyond is that if the user has the reset password token i assume he got it the same way as the verify account, therefor it can be used to verify the account as well).
If the user will try to verify his account after reset password, he will get an error that reset password is in progress.

### New error
This new error currently used only on apVerifyAccount mutation.
This will give you better way to handle those errors in the client side.
List of the possible errors:
```js
{
  errCode: 'USER_NOT_EXIST',
  errMessage: 'No such user id',
}

{
  errCode: 'RESET_PASS_IN_PROGRESS',
  errMessage: 'Reset password is in progress',
}

{
  errCode: 'TOKEN_NOT_VALID',
  errMessage: 'Verification token not valid',
}

{
  errCode: 'TOKEN_EXPIRED',
  errMessage: 'Verification token expired',
}
```

### Allow users without services to register
During the create user there is a check if the user exist.
If the user exist but without any service the new user will be merged with the existing one.
The reason beyond this, is if you collect some user details from other users or from external source, maybe you want someone to invite other user, you want to create this user, but still let him register and define his passowrd.

### New options (hooks)
The hooks will be called with the user as argument
Here is an example for one hook:
```js
import { Strategy as LocalStrategy } from 'apollo-passport-local-strategy/lib/index';

const onRegisterUserHook = function(user){
    logService.log('user registered');
    mailService.sendVerificationMail(user);
}

const apolloPassportLocalOptions = {
  usernameField: 'email',
  passwordField: 'password',
  hookMethods: {
    onCreateUserEnd: onRegisterUserHook,
    onRecoverPasswordRequestEnd: onRecoverPasswordRequestEndHook,
    onRecoverPasswordEnd: onRecoverPasswordEndHook,
    onUpdatePasswordEnd: onUpdatePasswordEndHook,
    onVerifyAccountEnd: onVerifyAccountEndHook,
    onLoginEnd: onLoginEndHook,
  },
};

const apolloPassport = new ApolloPassport({
  db: MongoDBDriver,            
  jwtSecret: 'my special secret',   
  authPath: '/ap-auth',            
});

apolloPassport.use('local', LocalStrategy, apolloPassportLocalOptions);
```



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
