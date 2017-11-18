var MongoClient = require('mongodb').MongoClient
var ObjectId = require('mongodb').ObjectID
var bcrypt = require('bcryptjs')
var SALT_WORK_FACTOR = 10

// Connection URL to database
var url = 'mongodb://localhost:27170/LunchBooking'

exports.registerUser = function (req, res) {
  // MongoClient.connect()
  MongoClient.connect(url, function (err, db) {
    console.log('registerUser called')

    var userDetail = req.body
    if (!userDetail) {
      console.log('No record to insert')
      customCallback('No record to insert', res)
      return
    }

    var collection = db.collection('Users')
    var pattern = new RegExp(['^', userDetail.EmailId, '$'].join(''), 'i')
    collection.find({
      EmailId: pattern
    })
      .toArray(function (err, items) {
        if (items.length) {
          customCallback({
            isRegistered: false,
            isAlreadyRegistered: true,
            userId: null,
            userType: null
          }, res)
        } else {
          bcrypt.genSalt(SALT_WORK_FACTOR, function (err, salt) {
            if (err) {
              console.log(err)
              return
            }
            bcrypt.hash(userDetail.Password, salt, function (err, hash) {
              if (err) {
                console.log(err)
                return
              }
              userDetail.Password = hash
              // var collection = db.collection('Users')
              collection.insert(userDetail, {
                w: 1
              }, function (err, result) {
                customCallback({
                  isRegistered: true,
                  isAlreadyRegistered: false,
                  userId: result.ops[0]._id,
                  userType: items[0].UserType
                }, res)
                db.close()
              })
            })
          })
        }
      })
  })
}

// >> Returns user id if successfull
exports.loginUser = function (req, res) {
  MongoClient.connect(url, function (err, db) {
    console.log('loginUser called')

    var loginDetail = req.body
    if (!loginDetail) {
      customCallback('Please provide data.', res)
      return
    }

    var collection = db.collection('Users')
    var pattern = new RegExp(['^', loginDetail.EmailId, '$'].join(''), 'i')
    collection.find({
      EmailId: pattern
    }).toArray(function (err, items) {
      if (items.length) {
        bcrypt.compare(loginDetail.Password, items[0].Password, function (err, isMatched) {
          if (isMatched)
            customCallback({
              isUsernameValid: true,
              isPasswordValid: true,
              userId: items[0]._id,
              userType: items[0].UserType
            }, res)
          else
            customCallback({
              isUsernameValid: true,
              isPasswordValid: false,
              userId: null,
              userType: null
            }, res)
          db.close()
        })
      } else {
        customCallback({
          isUsernameValid: false,
          isPasswordValid: false,
          userId: null,
          userType: null
        }, res)
      }
    })
  })
}

exports.changePassword = function (req, res) {
  // MongoClient.connect()
  MongoClient.connect(url, function (err, db) {
    var _detail = req.body
    if (!_detail) {
      console.log('No record to update')
      customCallback(false, res)
      return
    }

    var collection = db.collection('Users')

    collection.find({
      _id: new ObjectId(_detail.userId)
    }).toArray(function (err, items) {
      console.log(`Change password called for ${_detail.userId}`)
      if (items.length) {
        bcrypt.genSalt(SALT_WORK_FACTOR, function (err, salt) {
          if (err) {
            console.log(err)
            return
          }
          bcrypt.hash(_detail.newPassword, salt, function (err, hash) {
            if (err) {
              console.log(err)
              return
            }
            _detail.newPassword = hash
            bcrypt.compare(_detail.currentPassword, items[0].Password, function (err, isMatched) {
              if (isMatched) {
                collection.findOneAndUpdate({
                  _id: ObjectId(_detail.userId)
                }, {
                  $set: {
                    Password: _detail.newPassword
                  }
                },
                  function (err, result) {
                    assert(err == null)
                    customCallback(true, res)
                  })
              } else
                customCallback(false, res)
              db.close()
            })
          })
        })
      }else {
        customCallback(false, res)
        db.close()
        return
      }
    })
  })
}

exports.getUserOrders = function (req, res) {
  // Use connect method to connect to the server
  MongoClient.connect(url, function (err, db) {
    // write message to console if condition fails
    assert(err == null)
    console.log('getUserOrders called')

    var collection = db.collection('Orders')
    collection.find({
      'CreatedBy': new ObjectId(req.params.userid)
    }).toArray(function (err, items) {
      customCallback(items, res)
    })
    db.close()
  })
}
exports.getAllOrders = function (req, res) {
  // Use connect method to connect to the server
  MongoClient.connect(url, function (err, db) {
    // write message to console if condition fails
    assert(err == null)
    console.log('getAllOrders called')

    var collection = db.collection('Orders')
    var start = new Date()
    start.setHours(0, 0, 0, 0)
    var end = new Date()
    end.setHours(23, 59, 59, 999)

    collection.find({
      $and: [{
        IsActive: true
      },
        {
          CreatedOn: {
            $lt: end,
            $gt: start
          }
        }
      ]
    }).toArray(function (err, items) {
      customCallback(items, res)
    })
    db.close()
  })
}
exports.placeOrder = function (req, res) {
  MongoClient.connect()
  MongoClient.connect(url, function (err, db) {
    console.log('placeOrder called')

    var _order = req.body
    if (_order.length <= 0) {
      console.log('No record to insert')
      customCallback('No record to insert', res)
      return
    }

    _order.CreatedBy = new ObjectId(_order.CreatedBy)
    var ordersTable = db.collection('Orders')
    ordersTable.insert(_order, {
      w: 1
    }, function (err, result) {
      assert(err == null)
      customCallback(result.ops[0], res)
    })
    db.close()
  })
}
exports.cancelOrder = function (req, res) {
  MongoClient.connect(url, function (err, db) {
    var id = req.body.id
    if (!id) {
      console.log('No record to update')
      customCallback('No record to update', res)
      return
    }
    console.log('cancelOrder called for ' + id)

    var collection = db.collection('Orders')
    collection.findOneAndUpdate({
      _id: ObjectId(id)
    }, {
      $set: {
        'IsActive': false
      }
    }, function (err, result) {
      assert(err == null)
      customCallback(true, res)
    })
    db.close()
  })
}
exports.updateMealOption = function (req, res) {
  MongoClient.connect(url, function (err, db) {
    var d = req.body
    if (d.length <= 0) {
      console.log('No record to update')
      customCallback('No record to update', res)
      return
    }
    console.log('updateMealOption called for ' + d._id)

    var collection = db.collection('MealOptions')
    collection.findOneAndUpdate({
      _id: ObjectId(d._id)
    }, {
      $set: {
        'IsActive': false
      }
    }, function (err, result) {
      customCallback('Updated one record', res)
    })
    db.close()
  })
}
exports.getMealOptions = function (req, res) {
  // Use connect method to connect to the server
  MongoClient.connect(url, function (err, db) {
    // write message to console if condition fails
    assert(err == null)
    console.log('getMealOptions called')

    var collection = db.collection('MealOptions')
    collection.find({
      'IsActive': true
    }).toArray(function (err, items) {
      customCallback(items, res)
    })
    db.close()
  })
}
exports.acceptOrder = function (req, res) {
  MongoClient.connect(url, function (err, db) {
    var d = req.body
    if (d.length <= 0) {
      console.log('No record to update')
      customCallback('No record to update', res)
      return
    }
    console.log('acceptOrder called for ' + d._id)

    var collection = db.collection('Orders')
    collection.findOneAndUpdate({
      _id: ObjectId(d._id)
    }, {
      $set: {
        'IsAccepted': true
      }
    }, function (err, result) {
      customCallback('Updated one record', res)
    })
    db.close()
  })
}

var customCallback = function (d, response) {
  // send json data in response
  response.send(d)
}
