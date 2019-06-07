var express = require("express");
var bodyParser = require("body-parser");
var app = express();
var uuid = require("uuid/v4");
var firebase = require("firebase");
var flash = require("connect-flash");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  require("express-session")({
    secret: "yolosolo",
    resave: false,
    saveUninitialized: false
  })
);
app.use(express.static(__dirname + "/public"));
app.use(flash());

app.use(function(req, res, next) {
  res.locals.error = req.flash("error");
  res.locals.success = req.flash("success");
  next();
});

// parse application/json
// Your web app's Firebase configuration
var firebaseConfig = {
  apiKey: "AIzaSyApsFPxfBl6mNEjv6LPpDAuxinaYZQkmNE",
  authDomain: "vehicle-management-243006.firebaseapp.com",
  databaseURL: "https://vehicle-management-243006.firebaseio.com",
  projectId: "vehicle-management-243006",
  storageBucket: "",
  messagingSenderId: "703497089543",
  appId: "1:703497089543:web:bcbd425566e424c3"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

app.get("/", function(req, res) {
  res.render("index.ejs");
});

app.get("/home", function(req, res) {
  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      res.render("home.ejs", { user: user });
    }
  });
});

app.get("/add_vehicle", function(req, res) {
  res.render("add_vehicle.ejs");
});

app.post("/vehicle_add", function(req, res) {
  var company = req.body.company_name;
  var model = req.body.model_name;
  var make = req.body.make_name;
  var iMileage = req.body.initial_mileage;
  var odometerReading = req.body.odometer_reading;
  var fuelTank = req.body.fuel_capacity;
  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      firebase
        .database()
        .ref("/" + user.uid)
        .update({
          email: user.email,
        });
      firebase
        .database()
        .ref("/" + user.uid + "/Vehicle/" + uuid())
        .update({
          company: company,
          model: model,
          make: make,
          iMileage: iMileage,
          odometerReading: odometerReading,
          fuelTankTotal: fuelTank
        });
      console.log("New Vehicle Added!");
      req.flash("success", "New Vehicle Added!")
      res.redirect("/home");
    }
  });
});

app.post("/login", function(req, res) {
  const username = req.body.email;
  const password = req.body.password;
  firebase
    .auth()
    .signInWithEmailAndPassword(username, password)
    .then(user => {
      console.log("Logged in successfully");
      req.flash("success", "Logged in Successfully!");
      res.redirect("/home");
    })
    .catch(function(error) {
      console.log(error.code);
      console.log(error.message);
      req.flash("error", "Incorrect email ID or password!");
      res.redirect("/");
    });
});

app.post("/register", function(req, res) {
  var email = req.body.email;
  var password = req.body.password;

  firebase
    .auth()
    .createUserWithEmailAndPassword(email, password)
    .then(function(user){
        console.log("New user created and logged in!");
        req.flash("success", "Successfully created and logged in!");
        res.redirect("/home");
    })
    .catch(function(error) {
      console.log(error.code);
      console.log(error.message);
      req.flash("error", "Unable to create a new user, try again!");
      res.redirect("/");
    });
});

app.get("/logout", function(req, res) {
  firebase
    .auth()
    .signOut()
    .then(function() {
      console.log("Logged out successfully!");
      req.flash("success", "Logged out successfully!");
      res.redirect("/");
    });
});

app.listen(8000, function() {
  console.log("Server running at port 8000");
});
