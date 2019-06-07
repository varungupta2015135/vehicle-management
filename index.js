var express = require("express");
var app = express();
var firebase = require("firebase");

app.use(express.static(__dirname + '/public'));

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
  console.log("Home Page!");
  res.render("index.ejs");
  //insert key:value
  //   firebase
  //     .database()
  //     .ref("/TestMessages")
  //     .set({ TestMessage: "GET REQUEST" });
});

app.get("/home", function(req, res){
    res.render("home.ejs");
})

var server = app.listen(8000, function() {
  console.log("Server running at port 8000");
});
