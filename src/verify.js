export default function verify(email, password, done) {
  this.db.fetchUserByEmail(email)
    .then(user => {
      if (!user)
        return done(null, false, "Invalid email");

      const storedPassword = user && user.services && user.services.password
        && user.services.password.bcrypt;
      if (!storedPassword)
        return done(null, false, "No password set");

      if (!user.verified)
        return done(null, false, "Account not verified");

      this.comparePassword(password, storedPassword, (err, match) => {
        if (err)
          done(err);
        else if (match)
          done(null, user);
        else
          done(null, false, "Invalid password");
      });
    }).catch(err => done(err));
}
