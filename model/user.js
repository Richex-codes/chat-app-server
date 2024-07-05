const mongoose = require('mongoose')
const schema = mongoose.Schema;

const userSchema = new schema({
    name: { 
        type: String, 
        required: true 
    },
    username: { type: String, 
        required: true, 
        unique: true 
    },
    email: { type: String, 
        required: true, 
        unique: true 
    },
    password: { 
        type: String, 
        required: true 
    },
    dateOfBirth: { 
        type: Date, 
        required: true 
    },
    country: { 
        type: String,  
        required: true 
    },
    phoneNumber: { 
        type: String, 
        required: true 
    }
})

module.exports = mongoose.model('user', userSchema, 'users');
