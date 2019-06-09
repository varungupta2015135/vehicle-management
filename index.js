var express = require("express");
var bodyParser = require("body-parser");
var app = express();
var uuid = require("uuid/v4");
var firebase = require("firebase");
var admin = require("firebase-admin");
var flash = require("connect-flash");

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  require("express-session")({
    secret: "yolosolo",
    resave: false,
    saveUninitialized: false
  })
);

app.use(flash());

app.use(function(req, res, next) {
  res.locals.error = req.flash("error");
  res.locals.success = req.flash("success");
  res.locals.currentUser = firebase.auth().currentUser;
  next();
});

app.use(express.static(__dirname + "/public"));

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

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: "https://vehicle-management-243006.firebaseio.com"
})
//helper function
function snapshotToArray(snapshot) {
  var returnArr = [];

  snapshot.forEach(function(childSnapshot) {
    var item = childSnapshot.val();
    item.key = childSnapshot.key;

    returnArr.push(item);
  });

  return returnArr;
}

function getAllVehicle(snapshot){
  var resultArray = [];
  snapshot.forEach(function(childsnapshot){
    var item = childsnapshot.val();
    item.key = childsnapshot.key;
    resultArray.push(item);
  });

  return resultArray;
}
/////---------------------------------/////
//////////////LandingPageRoute/////////////
/////---------------------------------/////

app.get("/", function(req, res) {
  if (firebase.auth().currentUser != null) {
    res.redirect("/home");
  } else {
    res.render("index");
  }
});

/////---------------------------------/////
////////////////HomeRoute//////////////////
/////---------------------------------/////

app.get("/home", function(req, res) {
  if (firebase.auth().currentUser != null) {
    res.render("home");
  } else {
    res.redirect("/");
  }
});

/////---------------------------------/////
//////////////VehicleRoutes////////////////
/////---------------------------------/////

app.get("/add_vehicle", function(req, res) {
  if (firebase.auth().currentUser != null) {
    res.render("add_vehicle");
  } else {
    res.redirect("/");
  }
});

app.post("/vehicle_add", function(req, res) {
  var company = req.body.company_name;
  var model = req.body.model_name;
  var make = req.body.make_name;
  var iMileage = req.body.initial_mileage;
  var odometerReading = req.body.odometer_reading;
  var fuelTank = req.body.fuel_capacity;
  var vendorEmail = req.body.vendor_email;
  if (firebase.auth().currentUser != null) {
    var user = firebase.auth().currentUser;
    firebase
      .database()
      .ref("/" + user.uid)
      .update({
        email: user.email
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
        fuelTankTotal: fuelTank,
        vendorEmail: vendorEmail
      });
    req.flash("success", "New Vehicle Added!");
    res.redirect("/home");
  }
});

/////---------------------------------/////
/////////////DashboardRoutes///////////////
/////---------------------------------/////

app.get("/dashboard", function(req, res) {
  if (firebase.auth().currentUser != null) {
    var user = firebase.auth().currentUser;
    var currentUserDatabase = firebase.database().ref(user.uid + "/Vehicle");
    currentUserDatabase.once("value", function(snapshot) {
      res.render("dashboard", {
        childData: snapshotToArray(snapshot)
      });
    });
  } else {
    res.redirect("/");
  }
});

app.get("/combinedGraph", function(req, res) {
  if (firebase.auth().currentUser != null) {
    var user = firebase.auth().currentUser;
    var allVehicle = [];
    var currentUserDatabase = firebase.database().ref(user.uid + "/Vehicle");
    currentUserDatabase.once("value", function(snapshot) {
      snapshot.forEach(function(childSnapshot) {
        var item = childSnapshot.val();
        allVehicle.push(item);
      });
      res.render("dashboard_combined", {
        childData: snapshotToArray(snapshot)
      });
    });
  } else {
    res.redirect("/");
  }
});


app.get("/compareAll",function(req,res){
  if (firebase.auth().currentUser != null) {
    var user = firebase.auth().currentUser;
    var allUserDatabase = firebase
      .database()
      .ref();
    var allVehicle;
    var currentUserDatabase = firebase.database().ref(user.uid + "/Vehicle");
      currentUserDatabase.once("value", function(snapshot) {
        allVehicle = snapshotToArray(snapshot);
      });
      allUserDatabase.once("value", function(snapshot) {
        res.render("dashboard_compareAll", {
          childData: getAllVehicle(snapshot),
          vehicle : allVehicle
        });
      });
  }
  else {
    res.redirect("/");
  }
});

app.get("/individualGraph", function(req, res) {
  if (firebase.auth().currentUser != null) {
    var id = req.query.id;
    var user = firebase.auth().currentUser;
    var allSession;
    var vehicle_info;
    var vehicle_name = firebase
    .database()
    .ref(user.uid + "/Vehicle/" + id);

    var currentUserDatabase = firebase
      .database()
      .ref(user.uid + "/Vehicle/" + id + "/Session");
    
    
    currentUserDatabase.once("value", function(snapshot) {
      allSession = snapshotToArray(snapshot)
      // console.log(allSession)
    });

    vehicle_name.once("value", function(snapshot) {
      vehicle_info = snapshotToArray(snapshot)
      res.render("dashboard_individual", {
        childData: allSession,
        vehicleInfo: vehicle_info
      });
    });
  }
  else{
    res.redirect("/");
  }
});

/////---------------------------------/////
//////////////SessionRoutes////////////////
/////---------------------------------/////

app.get("/drive_session", function(req, res) {
  if (firebase.auth().currentUser != null) {
    var user = firebase.auth().currentUser;
    var currentUserDatabase = firebase.database().ref(user.uid + "/Vehicle");
    currentUserDatabase.once("value", function(snapshot) {

      res.render("drive_session", {
        childData: snapshotToArray(snapshot)
      });
    });
  }
});

app.get("/startAndStopSession", function(req, res) {
  if (firebase.auth().currentUser != null) {
    var user = firebase.auth().currentUser;
    var id = req.body.id;
    var vehicleDetails = firebase.database().ref(user.uid + "/Vehicle/" + id);
    var update;
    var timeStamp;
    if (session == "start") {
      update = setInterval(updateValues(vehicleDetails), 1000);
      console.log(update);
    } else if (session == "stop") {
      console.log(timeStamp);
      clearInterval(update);
      vehicleDetails.update({
        odometerReading: odoReading
      });
    }
    function updateValues(vehicleDetails) {
      var date = new Date();
      var odoReading = vehicleDetails.odometerReading;
      odoReading++;
      console.log(odoReading);
      timeStamp = date.toLocaleDateString();
      console.log(timeStamp);
    }
  } else {
    res.redirect("/");
  }
});

/////---------------------------------/////
////////////////AuthRoutes/////////////////
/////---------------------------------/////


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
  console.log("Registered!");
  firebase
    .auth()
    .createUserWithEmailAndPassword(email, password)
    .then(function(user) {
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
