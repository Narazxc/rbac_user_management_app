const router = require("express").Router();
// require user model from models folder
const User = require("../models/user.model");
const { body, validationResult } = require("express-validator");
const passport = require("passport");
const connectEnsure = require("connect-ensure-login");

router.get(
  "/login",
  connectEnsure.ensureLoggedOut({ redirectTo: "/" }),
  async (req, res, next) => {
    res.render("login");
  }
);

router.get(
  "/register",
  connectEnsure.ensureLoggedOut({ redirectTo: "/" }),
  async (req, res, next) => {
    res.render("register");
  }
);

// flash messages examples
// req.flash('error', 'some error');
// req.flash('error', 'some error 2');
// req.flash('info', 'some value');
// req.flash('warning', 'some value');
// req.flash('success', 'some value');
// // const messages = req.flash();
// res.redirect('/auth/login');

// validating user input for registration
router.post(
  "/register",
  connectEnsure.ensureLoggedOut({ redirectTo: "/" }),
  [
    body("email")
      .trim()
      .isEmail()
      .withMessage("Email must be a valid email")
      .normalizeEmail()
      .isLowercase(),
    body("password")
      .trim()
      .isLength(2)
      .withMessage("Password length is short, min 2 char required"),
    // custom validator
    body("password2").custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Password do not match");
      }
      return true;
    }),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        errors.array().forEach((error) => {
          req.flash("error", error.msg);
        });
        res.render("register", {
          email: req.body.email,
          messages: req.flash(),
        });
        return;
      }

      const { email } = req.body;
      const doesExist = await User.findOne({ email: email });

      // if email existed redirect back to register page
      if (doesExist) {
        res.redirect("/auth/register");
        return;
      }

      const user = new User(req.body); // password2 will be ignored because it doesn't exist in the User schema
      await user.save(); // save document

      req.flash(
        "success",
        `${user.email} registered successfully, you can now login.`
      );
      res.redirect("/auth/login");
      //res.send(user);
    } catch (error) {
      next(error);
    }
  }
);

// authenticate user via local method by PassportJS
router.post(
  "/login",
  connectEnsure.ensureLoggedOut({ redirectTo: "/" }),
  passport.authenticate("local", {
    successReturnToOrRedirect: "/",
    failureRedirect: "/auth/login",
    failureFlash: true,
  })
);

router.get(
  "/logout",
  connectEnsure.ensureLoggedIn({ redirectTo: "/" }),
  async (req, res, next) => {
    // .logout() come from passport package
    req.logout(function (err) {
      if (err) {
        return next(err);
      }
      res.redirect("/");
    });
  }
);

module.exports = router;

// // Middleware to protect certain routes from being accessed
// function ensureAuthenticated(req, res, next) {
//   // is Authenticated is attach by passport library
//   if (req.isAuthenticated()) {
//     next();
//   } else {
//     res.redirect("/auth/login");
//   }
// }

// function ensureNOTAuthenticated(req, res, next) {
//   // is Authenticated is attach by passport library
//   if (req.isAuthenticated()) {
//     res.redirect("back");
//   } else {
//     next();
//   }
// }
