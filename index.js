var express = require("express");
var bodyParser = require("body-parser");
var app = express();
var uuid = require("uuid/v4");
var firebase = require("firebase");
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

/////////////////////////////////////
///////////Helper Functions//////////
/////////////////////////////////////

function snapshotToArray(snapshot) {
  var returnArr = [];

  snapshot.forEach(function(childSnapshot) {
    var item = childSnapshot.val();
    item.key = childSnapshot.key;

    returnArr.push(item);
  });

  return returnArr;
}

function getAllVehicle(snapshot) {
  var resultArray = [];
  snapshot.forEach(function(childsnapshot) {
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

app.get("/vehicle_edit_select", function(req, res) {
  if (firebase.auth().currentUser != null) {
    var user = firebase.auth().currentUser;
    var vehicleDatabase = firebase.database().ref(user.uid + "/Vehicle");
    vehicleDatabase.once("value", function(snapshot) {
      res.render("edit_vehicle_select", {
        childData: snapshotToArray(snapshot)
      });
    });
  } else {
    res.redirect("/");
  }
});

app.get("/edit_vehicle_form", function(req, res) {
  if (firebase.auth().currentUser != null) {
    var user = firebase.auth().currentUser;
    var id = req.query.id;
    var vehicleDatabase = firebase.database().ref(user.uid + "/Vehicle/" + id);
    vehicleDatabase.once("value", function(snapshot) {
      res.render("edit_vehicle_form", {
        childData: snapshot.val(),
        currentVehicleId: id
      });
    });
  } else {
    res.redirect("/");
  }
});

app.get("/deleteVehicle", function(req, res) {
  if (firebase.auth().currentUser != null) {
    var user = firebase.auth().currentUser;
    var id = req.query.id;
    var vehicleDatabase = firebase.database().ref(user.uid + "/Vehicle/" + id);
    vehicleDatabase.remove();
    req.flash("error", "Vehicle has been deleted!");
    res.redirect("/home");
  } else {
    res.redirect("/");
  }
});

app.post("/vehicleEdit", function(req, res) {
  var vehicleId = req.query.id;
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
      .ref(user.uid + "/Vehicle/" + vehicleId + "/")
      .update({
        company: company,
        model: model,
        make: make,
        iMileage: iMileage,
        odometerReading: odometerReading,
        fuelTankTotal: fuelTank,
        vendorEmail: vendorEmail
      });
    req.flash("success", "Vehicle Updated!");
    res.redirect("/home");
  }
});

/////---------------------------------/////
/////////////DashboardRoutes///////////////
/////---------------------------------/////

app.get("/dashboard", function(req, res) {
  if (firebase.auth().currentUser != null) {
    var user = firebase.auth().currentUser;
    var currentUserDatabase = firebase.database().ref(user.uid + "/Vehicle/");
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

app.get("/compareAll", function(req, res) {
  if (firebase.auth().currentUser != null) {
    var user = firebase.auth().currentUser;
    var allUserDatabase = firebase.database().ref();
    var allVehicle;
    var currentUserDatabase = firebase.database().ref(user.uid + "/Vehicle");
    currentUserDatabase.once("value", function(snapshot) {
      allVehicle = snapshotToArray(snapshot);
    });
    allUserDatabase.once("value", function(snapshot) {
      res.render("dashboard_compareAll", {
        childData: getAllVehicle(snapshot),
        vehicle: allVehicle
      });
    });
  } else {
    res.redirect("/");
  }
});

app.get("/individualGraph", function(req, res) {
  if (firebase.auth().currentUser != null) {
    var id = req.query.id;
    var user = firebase.auth().currentUser;
    var allSession;
    var vehicle_info;
    var vehicle_name = firebase.database().ref(user.uid + "/Vehicle/" + id);

    var currentUserDatabase = firebase
      .database()
      .ref(user.uid + "/Vehicle/" + id + "/Session");

    currentUserDatabase.once("value", function(snapshot) {
      allSession = snapshotToArray(snapshot);
    });

    vehicle_name.once("value", function(snapshot) {
      vehicle_info = snapshotToArray(snapshot);
      res.render("dashboard_individual", {
        childData: allSession,
        vehicleInfo: vehicle_info
      });
    });
  } else {
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
      res.render("drive_session_1", {
        childData: snapshotToArray(snapshot)
      });
    });
  }
});

app.get("/session_history", function(req, res) {
  if (firebase.auth().currentUser != null) {
    var user = firebase.auth().currentUser;
    var currentUserDatabase = firebase.database().ref(user.uid + "/Vehicle");
    currentUserDatabase.once("value", function(snapshot) {
      res.render("session_history", { childData: snapshotToArray(snapshot) });
    });
  } else {
    res.redirect("/");
  }
});

app.get("/session_cards", function(req, res) {
  if (firebase.auth().currentUser != null) {
    var user = firebase.auth().currentUser;
    var id = req.query.id;
    var sessionDatabase = firebase
      .database()
      .ref(user.uid + "/Vehicle/" + id + "/Session");
    sessionDatabase.orderByChild("startTime").once("value", function(snapshot) {
      res.render("session_detailed", { childData: snapshotToArray(snapshot) });
    });
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
      req.flash("success", "Logged in Successfully!");
      res.redirect("/home");
    })
    .catch(function(error) {
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
    .then(function(user) {
      req.flash("success", "Successfully created and logged in!");
      res.redirect("/home");
    })
    .catch(function(error) {
      req.flash("error", "Unable to create a new user, try again!");
      res.redirect("/");
    });
});

app.get("/logout", function(req, res) {
  firebase
    .auth()
    .signOut()
    .then(function() {
      res.redirect("/");
    });
});

app.listen(8000, function() {
  console.log("Server running at port 8000");
});
