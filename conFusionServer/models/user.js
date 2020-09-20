var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');

var User = new Schema({
    firstname: {
        type: String,
        default: ''
    },
    lastname: {
        type: String,
        default: ''
    },    
    admin:   {
        type: Boolean,
        default: false
    }
});

User.plugin(passportLocalMongoose);     //this will automatically add username and password for our User

module.exports = mongoose.model('User', User);
