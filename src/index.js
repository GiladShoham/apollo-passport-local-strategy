// Core node modules && npm packages
import bcrypt from 'bcrypt';
const crypto = require('crypto');

// Passport modules
import { Strategy as LocalStrategy } from 'passport-local';

// Local modules
import defaultOptions from './defaultOptions';
import verify from './verify';
import resolvers from './resolvers';
import schema from './schema';

const BCRYPT_SALT_ROUNDS=10;

// Default Tokens Expiration (1 week)
const WEEK = 60 * 60 * 24 * 7;

// Default Tokens Expiration (1 week)
const defaultTokensExpirationLength = {
  verification: WEEK,
  resetPass: WEEK,
};

const extensionMethods = {

  hashPassword(password, cb) {
    if (cb)
      return bcrypt.hash(password, BCRYPT_SALT_ROUNDS, cb);

    return new Promise((resolve, reject) => {
      bcrypt.hash(password, BCRYPT_SALT_ROUNDS,
        (err, res) => err ? reject(err) : resolve(res) );
    });
  },

  comparePassword(password, hash, cb) {
    if (cb)
      return bcrypt.compare(password, hash, cb);

    return new Promise((resolve, reject) => {
      bcrypt.compare(password, hash,
        (err, res) => err ? reject(err) : resolve(res) );
    });
  },

  // Used for email verification and for reset password
  generateVerificationToken(expirationSeconds) {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(20, (err, buf) => {
        var token = buf.toString('hex');
        var expiration = Date.now() + (expirationSeconds * 1000);
        err ? reject(err) : resolve({ token, expiration });
      });
    });
  },
};

class AugmentedLocalStrategy {

  constructor(apolloPassport, options) {
    this.ap = apolloPassport;

    if (!options)
      options = defaultOptions;

    // extensionMethods.hookFuncs = options.hookFuncs;
    Object.assign(extensionMethods, options.hookMethods);
    const tokensExpirationLength = Object.assign({}, defaultTokensExpirationLength, options.tokensExpirationLength);
    this.tokensExpirationLength = tokensExpirationLength;
    this.strategy = new LocalStrategy(options, verify.bind(this.ap));

    this.resolvers = resolvers;
    this.schema = schema;

    // this.ap.extendWith(tokensExpiration);
    this.ap.extendWith(extensionMethods);
  }

}

AugmentedLocalStrategy.__isAugmented = true;

export { AugmentedLocalStrategy as Strategy };
export default AugmentedLocalStrategy;
