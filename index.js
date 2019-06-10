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
    currentUserDatabase.on("value", function(snapshot) {
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
    currentUserDatabase.on("value", function(snapshot) {
      snapshot.forEach(function(childSnapshot) {
        var item = childSnapshot.val();
        item.key = childSnapshot.key;
        item.type = "bar";
        allVehicle.push(item);
      });
      res.render("dashboard_combined", {
        childData: snapshotToArray(snapshot),
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
    var currentUserDatabase = firebase
      .database()
      .ref(user.uid + "/Vehicle/" + id);
    currentUserDatabase.on("value", function(snapshot) {
      res.render("dashboard_individual", {
        childData: snapshot.val()
      });
    });
  }
});

/////---------------------------------/////
//////////////SessionRoutes////////////////
/////---------------------------------/////

app.get("/drive_session", function(req, res) {
  if (firebase.auth().currentUser != null) {
    var user = firebase.auth().currentUser;
    var currentUserDatabase = firebase.database().ref(user.uid + "/Vehicle");
    currentUserDatabase.once("value").then(function(snapshot) {
      var newSnap = snapshotToArray(snapshot)
      res.render("drive_session_1", {
        childData: newSnap
      });
    });
  }
});
var finalTime;
var initialTime;
var odometerReadingNew;
var vehicleDetails;
var mileageFromDB;
app.get("/startSession", function(req, res, next) {
  if (firebase.auth().currentUser != null) {
    var user = firebase.auth().currentUser;
    var id = req.query.id;
    initialTime = new Date();
    vehicleDetails = firebase.database().ref(user.uid + "/Vehicle/" + id);
    vehicleDetails.once("value").then(function(snapshot){
      mileageFromDB = snapshot.val().iMileage;
      odometerReadingNew = snapshot.val().odometerReading;
    })
  }
});

app.get("/stopSession",function(req,res){
    finalTime = new Date();
    var id = req.query.id;
    var user = firebase.auth().currentUser;
    var totalTime = finalTime.getTime() - initialTime.getTime();
    odometerReadingSession = 1 * (totalTime/(1000));
    var uuidNew = uuid();
    var sessionDetails = firebase.database().ref("/" + user.uid +"/Vehicle/" + id + "/Session/"+ uuidNew + "/");
    vehicleDetails.once("value").then(function(snapshot){
      mileageFromDB = snapshot.val().iMileage;
      odometerReadingNew = snapshot.val().odometerReading;
    })
    var odometerReadingFinal = Number(odometerReadingNew) + Number(odometerReadingSession);
    var newMileage = (Number(mileageFromDB)-Number((1/30)*mileageFromDB));
    newMileage = newMileage.toFixed(2);
    var petrolUsedInSession = odometerReadingSession/Number(newMileage);
    
    sessionDetails.update({
      endTime : finalTime,
      fFuel : petrolUsedInSession,
      distanceTravelled : odometerReadingSession,
      iFuel : 90,
      mileage : newMileage,
      startTime : initialTime
    })
    vehicleDetails.update({
      odometerReading : odometerReadingFinal,
      iMileage : newMileage
    })
    var allVehicle, VendorEmail;
    var vendorEmail = firebase
      .database()
      .ref(user.uid + "/Vehicle/" + id);
    vendorEmail.once("value", function(snapshot) {
      allVehicle = snapshotToArray(snapshot);
      VendorEmail = allVehicle[allVehicle.length - 1];
    });
    
    console.log(VendorEmail);
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
    console.log(transporter);
    let mailOptions = {
      from: '"Vehicle Management Team" <cse2019secd@gmail.com>', // sender address
      to: user.email, // list of receivers
      subject: "Fuel  Low", // Subject line
      text: "Warning,  Fuel running low!.", // plain text body
      html: "<b>NodeJS Email Tutorial</b>" // html body
    };
    console.log(mailOptions);
    // let mailOptions2 = {
    //   from: '"Vehicle Management Team" <cse2019secd@gmail.com>', // sender address
    //   to: userEmail, // list of receivers
    //   subject: "Service Required", // Subject line
    //   text: "You vehicle service reuiired.", // plain text body
    //   html: "<b>NodeJS Email Tutorial</b>" // html body
    // };

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
    // transporter.sendMail(mailOptions, (error, info) => {
    //   if (error) {
    //     console.log("Error 2");
    //     req.flash("error", "Unable to send email at this moment!");
    //   } else {
    //     console.log("no error 2");
    //     console.log("Message %s sent: %s", info.messageId, info.response);
    //     req.flash("success", "Summary of the session has been sent!");
    //   }
    // });
    // res.redirect("/drive_session");
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
