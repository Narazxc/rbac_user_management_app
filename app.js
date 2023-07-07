const express = require("express");
const createHttpError = require("http-errors");
const morgan = require("morgan");
const mongoose = require("mongoose");
require("dotenv").config();
const session = require("express-session");
const connectFlash = require("connect-flash");
const passport = require("passport");
const MongoStore = require("connect-mongo");
const connectEnsureLogin = require("connect-ensure-login"); // to redirect user where he/she requested after successfully logged in
const { roles } = require("./utils/constants");

const username = encodeURIComponent("new-user123");
const password = encodeURIComponent("new123");

// MongoDB URI
const dbURI =
  // "mongodb+srv://new-user123:new123@cluster0.3zaxf4d.mongodb.net/?retryWrites=true&w=majority";
  `mongodb+srv://${username}:${password}@cluster0.3zaxf4d.mongodb.net/?retryWrites=true&w=majority`;

//===== Initiallization =====//
const app = express();
app.use(morgan("dev"));
//setting view engine
app.set("view engine", "ejs");
//setting public folder
app.use(express.static("public"));
//parse incoming request body
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// const MongoStore = new connectMongo(session);

// Init session
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      // secure: true,
      httpOnly: true,
    },

    store: MongoStore.create({
      mongoUrl: dbURI,
      mongooseConnection: mongoose.connection,
      dbName: "rbac",
    }),
  })
);

// For passport JS Authentication
app.use(passport.initialize());
app.use(passport.session());
require("./utils/passport.auth");

// after passport js succesfully authenticate the user, the req.user will contain that user object
// we pass req.user inside res.local.user so it can be directly used inside our template
app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});

app.use(connectFlash());
// Middleware for flash messages
app.use((req, res, next) => {
  res.locals.messages = req.flash();
  next();
});

// Routes
app.use("/", require("./routes/index.route"));
app.use("/auth", require("./routes/auth.route"));
app.use(
  "/user",
  connectEnsureLogin.ensureLoggedIn({ redirectTo: "/auth/login" }),
  require("./routes/user.route")
);
app.use(
  "/admin",
  connectEnsureLogin.ensureLoggedIn({ redirectTo: "/auth/login" }),
  ensureAdmin,
  require("./routes/admin.route")
);

// 404 handler
app.use((req, res, next) => {
  next(createHttpError.NotFound());
});

// error handler
app.use((error, req, res, next) => {
  error.status = error.status || 500;
  res.status(error.status);
  res.render("error_40x", { error });
});

const PORT = process.env.PORT || 3003;

// Connect to mongoDB database
mongoose
  .connect(dbURI, {
    dbName: "rbac",
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("📚 connected...");
    app.listen(PORT, () => console.log(`server is running on port ${PORT}`));
  })
  .catch((err) => console.log(err.message));

// function ensureAuthenticated(req, res, next) {
//   // is Authenticated is attach by passport library
//   if (req.isAuthenticated()) {
//     next();
//   } else {
//     res.redirect("/auth/login");
//   }
// }

function ensureAdmin(req, res, next) {
  if (req.user.role === roles.admin) {
    next();
  } else {
    req.flash("warning", "you are not Authorized to see this route");
    res.redirect("/");
  }
}

// function ensureModerator(req, res, next) {
//   if (req.user.role === roles.moderator) {
//     next();
//   } else {
//     req.flash("warning", "you are not Authorized to see this route");
//     res.redirect("/");
//   }
// }
