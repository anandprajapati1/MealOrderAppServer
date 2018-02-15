var dbLayer = require('./dataLayer')
var express = require('express')
var app = express()
var CORS = require('cors')
assert = require('assert')

// Body parsers for handling POST request data
var bodyParser = require('body-parser')
app.use(bodyParser.json()) // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })) // support encoded bodies
app.use(new CORS())

// Define routes
app.get('/isConnected', (req,res)=>{res.send("Service is running...")})
app.post('/registerUser', dbLayer.registerUser)
app.post('/loginUser', dbLayer.loginUser)
app.post('/changePassword', dbLayer.changePassword)
app.get('/getUserOrders/:userid', dbLayer.getUserOrders)
app.post('/placeOrder', dbLayer.placeOrder)
app.post('/cancelOrder', dbLayer.cancelOrder)
app.get('/getMealOptions', dbLayer.getMealOptions)
app.post('/updateMealOption', dbLayer.updateMealOption)
app.post('/acceptOrder', dbLayer.acceptOrder)
app.post('/rejectOrder', dbLayer.rejectOrder)
app.get('/getAllOrders', dbLayer.getAllOrders)
app.post('/getFilteredOrders', dbLayer.getFilteredOrders)

// Start server at port 8080
var server = app.listen(8080, function () {
  console.log('listening to port 8080...')
})
