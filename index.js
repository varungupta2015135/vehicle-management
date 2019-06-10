var express = require("express");
var bodyParser = require("body-parser");
var app = express();
var uuid = require("uuid/v4");
var firebase = require("firebase");
var flash = require("connect-flash");
var nodeMailer = require("nodemailer");
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

app.use(function (req, res, next) {
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

  snapshot.forEach(function (childSnapshot) {
    var item = childSnapshot.val();
    item.key = childSnapshot.key;

    returnArr.push(item);
  });

  return returnArr;
}

function getAllVehicle(snapshot) {
  var resultArray = [];
  snapshot.forEach(function (childsnapshot) {
    var item = childsnapshot.val();
    item.key = childsnapshot.key;
    resultArray.push(item);
  });

  return resultArray;
}
/////---------------------------------/////
//////////////LandingPageRoute/////////////
/////---------------------------------/////

app.get("/", function (req, res) {
  if (firebase.auth().currentUser != null) {
    res.redirect("/home");
  } else {
    res.render("index");
  }
});

/////---------------------------------/////
////////////////HomeRoute//////////////////
/////---------------------------------/////

app.get("/home", function (req, res) {
  if (firebase.auth().currentUser != null) {
    res.render("home");
  } else {
    res.redirect("/");
  }
});

/////---------------------------------/////
//////////////VehicleRoutes////////////////
/////---------------------------------/////

app.get("/add_vehicle", function (req, res) {
  if (firebase.auth().currentUser != null) {
    res.render("add_vehicle");
  } else {
    res.redirect("/");
  }
});

app.post("/vehicle_add", function (req, res) {
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

app.get("/vehicle_edit_select", function (req, res) {
  if (firebase.auth().currentUser != null) {
    var user = firebase.auth().currentUser;
    var vehicleDatabase = firebase.database().ref(user.uid + "/Vehicle");
    vehicleDatabase.once("value", function (snapshot) {
      res.render("edit_vehicle_select", {
        childData: snapshotToArray(snapshot)
      });
    });
  } else {
    res.redirect("/");
  }
});

app.get("/edit_vehicle_form", function (req, res) {
  if (firebase.auth().currentUser != null) {
    var user = firebase.auth().currentUser;
    var id = req.query.id;
    var vehicleDatabase = firebase.database().ref(user.uid + "/Vehicle/" + id);
    vehicleDatabase.once("value", function (snapshot) {
      res.render("edit_vehicle_form", {
        childData: snapshot.val(),
        currentVehicleId: id
      });
    });
  } else {
    res.redirect("/");
  }
});

app.get("/deleteVehicle", function (req, res) {
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

app.post("/vehicleEdit", function (req, res) {
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

app.get("/dashboard", function (req, res) {
  if (firebase.auth().currentUser != null) {
    var user = firebase.auth().currentUser;
    var currentUserDatabase = firebase.database().ref(user.uid + "/Vehicle/");
    currentUserDatabase.once("value", function (snapshot) {
      res.render("dashboard", {
        childData: snapshotToArray(snapshot)
      });
    });
  } else {
    res.redirect("/");
  }
});

app.get("/combinedGraph", function (req, res) {
  if (firebase.auth().currentUser != null) {
    var user = firebase.auth().currentUser;
    var allVehicle = [];
    var currentUserDatabase = firebase.database().ref(user.uid + "/Vehicle");
    currentUserDatabase.once("value", function (snapshot) {
      snapshot.forEach(function (childSnapshot) {
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

app.get("/compareAll", function (req, res) {
  if (firebase.auth().currentUser != null) {
    var user = firebase.auth().currentUser;
    var allUserDatabase = firebase.database().ref();
    var allVehicle;
    var currentUserDatabase = firebase.database().ref(user.uid + "/Vehicle");
    currentUserDatabase.once("value", function (snapshot) {
      allVehicle = snapshotToArray(snapshot);
    });
    allUserDatabase.once("value", function (snapshot) {
      res.render("dashboard_compareAll", {
        childData: getAllVehicle(snapshot),
        vehicle: allVehicle
      });
    });
  } else {
    res.redirect("/");
  }
});

app.get("/individualGraph", function (req, res) {
  if (firebase.auth().currentUser != null) {
    var id = req.query.id;
    var user = firebase.auth().currentUser;
    var allSession;
    var vehicle_info;
    var vehicle_name = firebase.database().ref(user.uid + "/Vehicle/" + id);

    var currentUserDatabase = firebase
      .database()
      .ref(user.uid + "/Vehicle/" + id + "/Session");

    currentUserDatabase.once("value", function (snapshot) {
      allSession = snapshotToArray(snapshot);
    });

    vehicle_name.once("value", function (snapshot) {
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

app.get("/drive_session", function (req, res) {
  if (firebase.auth().currentUser != null) {
    var user = firebase.auth().currentUser;
    var currentUserDatabase = firebase.database().ref(user.uid + "/Vehicle");
    currentUserDatabase.once("value", function (snapshot) {
      res.render("drive_session_1", {
        childData: snapshotToArray(snapshot)
      });
    });
  }
});

var finalTime;
var initialTime;
var odometerReadingNew;
var vehicleDetails;
var mileageFromDB;
var currentVendorEmail;
app.get("/startSession", function (req, res, next) {
  if (firebase.auth().currentUser != null) {
    var user = firebase.auth().currentUser;
    var id = req.query.id;
    initialTime = new Date();
    vehicleDetails = firebase.database().ref(user.uid + "/Vehicle/" + id);
    vehicleDetails.once("value").then(function (snapshot) {
      mileageFromDB = snapshot.val().iMileage;
      odometerReadingNew = snapshot.val().odometerReading;
    })
  }
});

app.get("/stopSession", function (req, res) {
  finalTime = new Date();
  var id = req.query.id;
  var user = firebase.auth().currentUser;
  var totalTime = finalTime.getTime() - initialTime.getTime();
  odometerReadingSession = 1 * (totalTime / (1000));
  var uuidNew = uuid();
  var sessionDetails = firebase.database().ref("/" + user.uid + "/Vehicle/" + id + "/Session/" + uuidNew + "/");
  vehicleDetails.once("value").then(function (snapshot) {
    mileageFromDB = snapshot.val().iMileage;
    carCompany = snapshot.val().company;
    carModel = snapshot.val().model;
    currentVendorEmail = snapshot.val().vendorEmail;
    odometerReadingNew = snapshot.val().odometerReading;
  })
  var odometerReadingFinal = Number(odometerReadingNew) + Number(odometerReadingSession);
  currentVendorEmail = String(currentVendorEmail);
  var newMileage = (Number(mileageFromDB) - Number((1 / 30) * mileageFromDB));
  newMileage = newMileage.toFixed(2);
  var petrolUsedInSession = odometerReadingSession / Number(newMileage);

  sessionDetails.update({
    endTime: finalTime,
    fFuel: petrolUsedInSession,
    distanceTravelled: odometerReadingSession,
    iFuel: 90,
    mileage: newMileage,
    startTime: initialTime
  })
  vehicleDetails.update({
    odometerReading: odometerReadingFinal,
    iMileage: newMileage
  })
  var allVehicle;
  var vendorEmail = firebase
    .database()
    .ref(user.uid + "/Vehicle/" + id);
  vendorEmail.once("value", function (snapshot) {
    allVehicle = snapshotToArray(snapshot);
  });

  let transporter = nodeMailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: "cse2019secd@gmail.com",
      pass: "DCES9102ESC"
    },
    tls: {
      // do not fail on invalid certs
      rejectUnauthorized: false
    }
  });
  var recentSession = firebase.database().ref("/" + user.uid + "/Vehicle/" + id + "/Session/" + uuidNew + "/");
  recentSession.once("value", function (snapshot) {
    recentSessionData = snapshotToArray(snapshot);
  })
  let mailOptions = {
    from: '"Vehicle Management Team" <cse2019secd@gmail.com>', // sender address
    to: user.email, // list of receivers
    subject: "Session Summary", // Subject line
    text: "Just a regular summary of your recent session.", // plain text body
    html: `Session Dated: ${initialTime} <br /><br /> Mileage: ${newMileage} KM/L <br /> Distance Travelled: ${odometerReadingSession} KMs <br /> Start Time: ${initialTime}  <br /> End Time: ${finalTime}` // html body
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
      req.flash("error", "Unable to send email at this moment!");
      res.redirect("/home");
    } else {
      console.log("no error");
      console.log("Message %s sent: %s", info.messageId, info.response);
      req.flash("success", "Summary of the session has been sent!");
      res.redirect("/home");
    }
  });
  if (Number(newMileage) < 8) {
  
    let mailOptions3 = {
      from: '"Vehicle Management Team" <cse2019secd@gmail.com>', // sender address
      to: user.email, // list of receivers
      subject: "Setting an appointment for service.", // Subject line
      text: "You vehicle service required.", // plain text body
      html: `<b>Your mileage is going down, every session. Please fix an appointment with your vendor ASAP!!!</b>` // html body
    };
    
    transporter.sendMail(mailOptions3, (error, info) => {
      if (error) {
        console.log("Error 2");
        req.flash("error", "Unable to send email at this moment!");
      } else {
        console.log("no error 2");
        console.log("Message %s sent: %s", info.messageId, info.response);
        req.flash("success", "Summary of the session has been sent!");
      }
    });
  }
  // 
  // res.redirect("/drive_session");
});

app.get("/session_history", function (req, res) {
  if (firebase.auth().currentUser != null) {
    var user = firebase.auth().currentUser;
    var currentUserDatabase = firebase.database().ref(user.uid + "/Vehicle");
    currentUserDatabase.once("value", function (snapshot) {
      res.render("session_history", { childData: snapshotToArray(snapshot) });
    });
  } else {
    res.redirect("/");
  }
});

app.get("/session_cards", function (req, res) {
  if (firebase.auth().currentUser != null) {
    var user = firebase.auth().currentUser;
    var id = req.query.id;
    var sessionDatabase = firebase
      .database()
      .ref(user.uid + "/Vehicle/" + id + "/Session");
    sessionDatabase.orderByChild("startTime").once("value", function (snapshot) {
      res.render("session_detailed", { childData: snapshotToArray(snapshot) });
    });
  } else {
    res.redirect("/");
  }
});

/////---------------------------------/////
////////////////AuthRoutes/////////////////
/////---------------------------------/////

app.post("/login", function (req, res) {
  const username = req.body.email;
  const password = req.body.password;
  firebase
    .auth()
    .signInWithEmailAndPassword(username, password)
    .then(user => {
      req.flash("success", "Logged in Successfully!");
      res.redirect("/home");
    })
    .catch(function (error) {
      req.flash("error", "Incorrect email ID or password!");
      res.redirect("/");
    });
});

app.post("/register", function (req, res) {
  var email = req.body.email;
  var password = req.body.password;

  firebase
    .auth()
    .createUserWithEmailAndPassword(email, password)
    .then(function (user) {
      req.flash("success", "Successfully created and logged in!");
      res.redirect("/home");
    })
    .catch(function (error) {
      req.flash("error", "Unable to create a new user, try again!");
      res.redirect("/");
    });
});

app.get("/logout", function (req, res) {
  firebase
    .auth()
    .signOut()
    .then(function () {
      res.redirect("/");
    });
});

app.listen(8000, function () {
  console.log("Server running at port 8000");
});
