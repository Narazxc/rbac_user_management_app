const User = require("../models/user.model");
const router = require("express").Router();
const mongoose = require("mongoose");
const { roles } = require("../utils/constants");

router.get("/users", async (req, res, next) => {
  try {
    const users = await User.find();
    // res.send(users);
    res.render("manage-users", { users });
  } catch (error) {
    next(error);
  }
});

router.get("/user/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      req.flash("error", "invalid id");
      res.redirect("/admin/users");
      return;
    }

    const person = await User.findById(id);
    res.render("profile", { person });
  } catch (error) {
    next(error);
  }
});

router.post("/update-role", async (req, res, next) => {
  const { id, role } = req.body;

  // checking for id and roles in req.body
  if (!id || !role) {
    req.flash("error", "Invalid request");
    return res.redirect("back");
  }

  // check for valid mongoose objectID
  if (!mongoose.Types.ObjectId.isValid(id)) {
    req.flash("error", "Invalid id");
    return res.redirect("back");
  }

  // check for valid role
  const rolesArray = Object.values(roles);
  if (!rolesArray.includes(role)) {
    req.flash("error", "Invalid id");
    return res.redirect("back");
  }
  // Admin cannot remove himself/herself as an admin
  // req.user contain the current sign in user (done by passportjs)
  if (req.user.id === id) {
    req.flash(
      "error",
      "Admin cannot remove themselves from Admin, ask another admin"
    );
    return res.redirect("back");
  }

  // finally update the user
  const user = await User.findByIdAndUpdate(
    id,
    { role },
    { new: true, runValidators: true }
  );

  req.flash("info", `update role for ${user.email} to ${user.role}`);

  res.redirect("back");
});

module.exports = router;
