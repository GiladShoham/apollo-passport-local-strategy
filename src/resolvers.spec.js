import proxyquire from 'proxyquire';
import chai from "chai";
import chaiAsPromised from "chai-as-promised";

import 'regenerator-runtime/runtime';

chai.use(chaiAsPromised);
const should = chai.should();

// might be useful elsewhere too...
const passportStub = {
  authenticate(name, callback) {
    return function(req) {
      if (!req)
        throw new Error("no req");
      if (!req.query)
        throw new Error("no req.query");

      const override = req.query.override;
      if (!override)
        throw new Error("no req.query.override");

      switch (override) {
        case 'error': return callback(new Error());
        case 'user': return callback(null, { id: 1 });
        case 'info': return callback(null, null, 'info');
        default: throw new Error("Invalid req.query.override: " + override);
      }
    }
  }
}

const context = {
  passport: passportStub,
  hashPassword: pass => new Promise(resolve => resolve(`hashed:${pass}`))
};

const resolvers = proxyquire('./resolvers', { passport: passportStub }).default;

describe('apollo-passport-local', () => {

  describe('passportStub', () => {

    it('throws on missing or invalid values', () => {

      (function() {
        passportStub.authenticate()();
      }).should.throw();

      (function() {
        passportStub.authenticate()({});
      }).should.throw();

      (function() {
        passportStub.authenticate()({ query: {} });
      }).should.throw();

      (function() {
        passportStub.authenticate()({ query: { override: 'error' }});
      }).should.throw();

      (function() {
        passportStub.authenticate()({ query: { override: 'invalid' }});
      }).should.throw();

    });

  });

  describe('resolvers', () => {

    describe('apCreateUserEmailPassword()', () => {
      const errMsg = "foo";

      const apCreateUserEmailPassword
        = resolvers.RootMutation.apCreateUserEmailPassword.bind(context);

      it('returns an error when trying to re-register an existing email', async () => {
        context.db = { fetchUserByEmail: async () => ({ userId: 1 }) };

        const result = await apCreateUserEmailPassword(null,
          { email: 'email', password: 'password '});
        result.should.deep.equal({
          error: "E-mail already registered",
          token: ""
        });
      });

      it('catches createUser errors', async () => {
        context.db = { fetchUserByEmail: async () => null };
        context.createUser = async () => { throw new Error(errMsg) };

        const result = await apCreateUserEmailPassword(null,
          { email: 'email', password: 'password '});
        result.should.deep.equal({
          error: errMsg,
          token: ""
        });
      });

      it('calls createUser with correct args, logs in user', async () => {
        context.db = { fetchUserByEmail: async () => null };
        context.createUser = async function(user) {
          user.should.deep.equal({
            emails: [ { value: 'email' }],
            services: { password: { bcrypt: 'hashed:password ' }}
          });
          return 'elizabeth';
        };
        context.createTokenFromUser = () => 'token';

        const result = await apCreateUserEmailPassword(null,
          { email: 'email', password: 'password '});
        result.should.deep.equal({
          error: "",
          token: 'token'
        });
      });

    });

    describe('apLoginEmailPassword()', () => {

      const apLoginEmailPassword
        = resolvers.RootMutation.apLoginEmailPassword.bind(context);

      it('throws on a real error', () => {
        // I don't know how to check if an async function throws
        apLoginEmailPassword(null, { override: 'error' }).should.be.rejected;
      });

      it('passes the user', async () => {
        const result = await apLoginEmailPassword(null, { override: 'user' });
        result.error.should.equal("");
        result.token.should.equal('token');
      });

      it('passes an error string (not a throw)', async () => {
        const result = await apLoginEmailPassword(null, { override: 'info' });
        result.error.should.equal("info");
        result.token.should.equal("");
      });

    });

    describe('apUpdateUserPassword', () => {

      const password = 'password';
      const apUpdateUserPassword
        = resolvers.RootMutation.apUpdateUserPassword.bind(context);

      it('only works for logged in matching userId', async () => {
        context.db = {
          async assertUserServiceData() {}
        };

        let result = await apUpdateUserPassword(null,
          { userId: 1, password }, { auth: { userId: 2 } });
        result.should.equal("Not logged in as 1");

        result = await apUpdateUserPassword(null, { userId: 1, password }, {});
        result.should.equal("Not logged in as 1");

        result = await apUpdateUserPassword(null, { userId: 1, password });
        result.should.equal("Not logged in as 1");
      });

      it('calls db.assertUserServiceData correctly and returns no error', async () => {
        context.comparePassword = async () => true;
        context.hashPassword = async (password) => `hashed:${password}`;
        context.db = {
          fetchUserById: async () => ({
            services: { password: { bcrypt: password }}
          }),
          async assertUserServiceData(userId, service, data) {
            should.exist(userId);
            service.should.equal('password');
            data.should.deep.equal({ bcrypt: `hashed:${password}` });
          }
        };

        const result = await apUpdateUserPassword(null,
          { userId: 1, oldPassword: password, newPassword: password }, { auth: { userId: 1 } });
        result.should.equal("");
      });

      it('catches errors from db.assertUserServiceData', async () => {
        context.comparePassword = async () => true;
        context.db = {
          fetchUserById: async () => ({
            services: { password: { bcrypt: password }}
          }),
          async assertUserServiceData() {
            throw new Error('foo')
          }
        };

        const result = await apUpdateUserPassword(null,
          { userId: 1, password }, { auth: { userId: 1 } });
        result.should.equal('foo');
      });

    });

  });

});
