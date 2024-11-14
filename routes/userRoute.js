const express = require('express');
const router = express.Router();
const User = require('../models/user.js');
const SecretKey = "12345678Key";
const jwt = require('jsonwebtoken');
const Std = require('../models/student.js');
const auth = require('../middleware/authenticate.js');
const authenticate = require('../middleware/authenticate.js');

router.post('/signup', async(req, res) => {
    try {
        const existingUser = await User.findOne({username: req.body.username})
        if(existingUser){
            return res.status(400).json({
                message: "User Already Existed!"
            });
        }
        const user =  new User(req.body);
        await user.save();

        res.status(200).json({
            message: "User Successfully SignIn"
        })
    } catch (error) {
        res.status(400).json({
            message: "Error During Signup",
            error: error.message
        })
    }
})



router.post('/Login', async(req, res) => {
  try {
    const user = await User.findOne({username: req.body.username});
      
    if(!user){
        return res.status(400).json({message: "invalid username & passowrd"})
    }

    if(user.password !== req.body.password){
        return res.status(400).json({
            message: "Invalid Username & Password"
        })
    }
    const token = jwt.sign({id: user._id, username: user.username}, SecretKey);
    console.log(token);
    res.cookie('token', token).status(200).json({
        message: "SignIn Successfully ",
        username: user.username,
        token
    })
    
  } catch (error) {
    return res.status(400).json({
        message: error.message
    })
  }
});



router.post('/student', auth, async (req, res) => {
    try {
        const existingStd = await Std.findOne({ name: req.body.name, createdBy: req.user.id });
        if (existingStd) {
            return res.status(400).json({
                message: "Student Already Existed!"
            });
        }

        const student = new Std({
            ...req.body,
            createdBy: req.user.id
        });

        await student.save();

        const userStudents = await Std.find({ createdBy: req.user.id });

        res.status(200).json({
            message: "Student Successfully Created",
            students: userStudents  // Send all students created by this user
        });
    } catch (error) {
        res.status(400).json({
            message: "Error During Student Creation",
            error: error.message
        });
    }
});

router.get('/TeacherStd', authenticate ,async(req, res) => {
  try {
    const user = await Std.find({createdBy: req.user.id})
    res.status(200).json({
        user
    })
  } catch (error) {
    res.status(401).json({
        message: error.message
    })
  }
})



module.exports = router;