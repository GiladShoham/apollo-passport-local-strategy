const resolvers = {

  RootMutation: {
    async apCreateUserEmailPassword(root, { input }) {
      // First check if we already have a user with that email
      const existing = await this.db.fetchUserByEmail(input.email);
      let reducedInput = Object.assign({}, input);
      delete reducedInput.email;
      delete reducedInput.password;

      if (existing && existing.services && Object.keys(existing.services).length > 0)
        return { token: "", error: "E-mail already registered" };

      const expirationLength = this.strategies.local.tokensExpirationLength.verification;
      const verificationToken = await this.generateVerificationToken(expirationLength);
      // We put the emails in this format to follow the standard described here:
      // http://passportjs.org/docs/profile
      let user = Object.assign(reducedInput, {
        emails: [{ value: input.email }],
        services: { password: { bcrypt: await this.hashPassword(input.password) } },
        verificationToken: verificationToken.token,
        verificationTokenExpiration: verificationToken.expiration,
        verified: false,
      });

      let userId;

      const onBeforeStoreRegisteredUser = this.onBeforeStoreRegisteredUser;
      if (onBeforeStoreRegisteredUser && typeof onBeforeStoreRegisteredUser === 'function') {
        onBeforeStoreRegisteredUser(user);
      }

      try {
        if (!existing){
          userId = await this.createUser(user);
        } else {
          userId = existing._id;
          user.dateRegistered = new Date();
          this.db.updateUser(userId, user);
        }

      } catch (err) {
        return {
          error: err.message,
          token: ""
        };
      }

      // XXX correct id field?
      // user.id = userId;

      const onCreateUserEnd = this.onCreateUserEnd;
      if (onCreateUserEnd && typeof onCreateUserEnd === 'function') {
        onCreateUserEnd(user);
      }

      return {
        error: "",
        token: '',
      };
    },

    async apVerifyAccount(root, { userId, verificationToken }) {
      const user = await this.db.fetchUserById(userId);
      let err = {};
      if (!user) {
        return {
          errCode: 'USER_NOT_EXIST',
          errMessage: 'No such user id',
        };
      }

      // In case the user tried to verify account after click on reset password
      // We want him to continue the process via the reset password link
      if (!user.verificationToken && user.resetPassToken) {
        return {
          errCode: 'RESET_PASS_IN_PROGRESS',
          errMessage: 'Reset password is in progress',
        };
      }

      if (user.verificationToken !== verificationToken) {
        return {
          errCode: 'TOKEN_NOT_VALID',
          errMessage: 'Verification token not valid',
        };
      }

      if (Date.now() > user.verificationTokenExpiration) {
        return {
          errCode: 'TOKEN_EXPIRED',
          errMessage: 'Verification token expired',
        };
      }

      const onVerifyAccountEnd = this.onVerifyAccountEnd;
      if (onVerifyAccountEnd && typeof onVerifyAccountEnd === 'function') {
        onVerifyAccountEnd(user);
      }

      this.db.verifyUserAccount(userId);
    },

    async apRecoverPasswordRequest(root, { email }) {
      const user = await this.db.fetchUserByEmail(email);
      if (!user)
        return 'No such user email';

        const expirationLength = this.strategies.local.tokensExpirationLength.resetPass;
      const { token, expiration } = await this.generateVerificationToken(expirationLength);
      await this.db.addResetPasswordToken(user._id, token, expiration);

      // Fetch again to make sure we have the tokens in the db
      const updatedUser = await this.db.fetchUserById(user._id);
      const onRecoverPasswordRequestEnd = this.onRecoverPasswordRequestEnd;
      if (onRecoverPasswordRequestEnd && typeof onRecoverPasswordRequestEnd === 'function') {
        onRecoverPasswordRequestEnd(updatedUser);
      }

      return '';
    },

    async apRecoverPassword(root, { userId, token, newPassword }, context) {

      const user = await this.db.fetchUserById(userId);
      if (!user)
        return 'No such userId';

      if (!user.resetPassToken)
        return 'Password reset has not been initialized';

      if (user.resetPassToken !== token)
        return 'Reset password token not valid';

      if (Date.now() > user.resetPassTokenExpiration) {
        return 'Reset password token expired';
      }

      try {
        // Change the user password
        await this.db.assertUserServiceData(userId,
          'password', { bcrypt: await this.hashPassword(newPassword) });
        // Mark the user as verified again and delete the tokens
        await this.db.verifyUserAccount(userId, 'verified', 'resetPassToken', 'resetPassTokenExpiration');
      } catch (err) {
        return err.message;
      }

      const onRecoverPasswordEnd = this.onRecoverPasswordEnd;
      if (onRecoverPasswordEnd && typeof onRecoverPasswordEnd === 'function') {
        onRecoverPasswordEnd(user);
      }

      return "";
    },

    apLoginEmailPassword(root, args) {
      return new Promise((resolve, reject) => {

        this.passport.authenticate('local', (err, user, info) => {

          if (err)
            return reject(err);

          if (!user || info)
            return resolve({ error: info, token: "" });

          const onLoginEnd = this.onLoginEnd;
          if (onLoginEnd && typeof onLoginEnd === 'function') {
            onLoginEnd(user);
          }

          resolve({
            error: "",
            token: this.createTokenFromUser(user)
          });

        })({ query: args }); // fake req.query using args from graphQL

      });
    },

    async apUpdateUserPassword(root, { userId, oldPassword, newPassword }, context) {
      if (!(context && context.auth && context.auth.userId === userId))
        return "Not logged in as " + userId;

      const user = await this.db.fetchUserById(userId);
      if (!user)
        return 'No such userId';

      console.log(user);
      const storedPassword = user && user.services && user.services.password
        && user.services.password.bcrypt;
      console.log('storedPassword', storedPassword);

      // TODO allow no password only if email set.  allow email as part of query?

      if (storedPassword) {
        const match = await this.comparePassword(oldPassword, storedPassword);
        console.log('match', match);
        if (!match)
          return "Invalid old password";
      } else {
        return "No old password set";
      }

      try {
        await this.db.assertUserServiceData(userId,
          'password', { bcrypt: await this.hashPassword(newPassword) });
      } catch (err) {
        return err.message;
      }

      const onUpdatePasswordEnd = this.onUpdatePasswordEnd;
      if (onUpdatePasswordEnd && typeof onUpdatePasswordEnd === 'function') {
        onUpdatePasswordEnd(user);
      }

      return "";
    }

  }

};

export default resolvers;
