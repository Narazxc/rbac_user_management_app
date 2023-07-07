const passport = require("passport");
const localStrategy = require("passport-local").Strategy;
const User = require("../models/user.model");

// Authenticate user using Passport js with local-strategy (email and password)

// This is a middleware
passport.use(
  new localStrategy(
    {
      usernameField: "email",
      passportField: "password",
    },
    async (email, password, done) => {
      try {
        const user = await User.findOne({ email: email });

        // Username/email does not exist
        if (!user) {
          return done(null, false, {
            message: "Username/email not registered",
          });
        }
        // Email exist and new we need to verify the password
        const isMatch = await user.isValidPassword(password);

        // if match return first done() else return second done()
        return isMatch
          ? done(null, user)
          : done(null, false, { message: "Incorrect password" });
      } catch (error) {
        done(error);
      }
    }
  )
);

// from Passport js session doc
passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});
