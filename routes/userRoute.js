const express = require('express');
const router = express.Router();
const Teacher = require('../models/teacher.js');
const SecretKey = "12345678Key";
const jwt = require('jsonwebtoken');
const Std = require('../models/student.js');
const auth = require('../middleware/authenticate.js');
const authenticate = require('../middleware/authenticate.js');
const nodemailer = require("nodemailer");
const Course = require("../models/course.js")


// teacher routes
router.post('/signup', async(req, res) => {
    try {
        const existingUser = await Teacher.findOne({username: req.body.username})
        if(existingUser){
            return res.status(400).json({
                message: "User Already Existed!"
            });
        }
        const user =  new Teacher(req.body);
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

// reacher login
router.post('/Login', async(req, res) => {
  try {
    const user = await Teacher.findOne({username: req.body.username});
      
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

// create random OTp Function
function generateOTP(length) {
    let otp = '';
    for (let i = 0; i < length; i++) {
        otp += Math.floor(Math.random() * 10); // generates a random digit (0-9)
    }
    return otp;
}

// nodeMailer setup
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
            user: "israr.5aug24webgpt@gmail.com",
            pass: "payj hacj vvyg ksyn"
    },
});

// teacher created Student 
  router.post('/student', auth, async (req, res) => {
    try {
        const { name, email, DOB, Batch } = req.body;

        const existingStd = await Std.findOne({ name: name, createdBy: req.user.id });
        if (existingStd) {
            return res.status(400).json({
                message: "Student Already Existed!"
            });
        }

        const otp = generateOTP(6);

        await Std.create({
            name,
            email,
            DOB,
            Batch,
            password: otp,
            createdBy: req.user.id
        });

        const mailOptions = {
            from: "israrisrar.5aug24webgpt@gmail.com",
            to: "israrkhann08@gmail.com",
            subject: "Welcome to the Course!",
            text: `Hello ${name},\n\nYour account has been created successfully.\nYour login password is: ${otp}\n\nPlease keep it safe.\n\nBest regards`
        };

        transporter.sendMail(mailOptions, async (error, info) => {
            if (error) {
                console.error("Error sending email:", error);
                return res.status(500).json({
                    message: "Error creating student and sending email",
                    error: error.message
                });
            }
            
            // Fetch all students created by this user
            const userStudents = await Std.find({ createdBy: req.user.id });

            res.status(201).json({
                message: "Student Successfully Created and email sent",
                students: userStudents
            });
        });

    } catch (error) {
        res.status(400).json({
            message: "Error During Student Creation",
            error: error.message
        });
    }
});

// teacher student get
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

// student logged In
router.post('/stu_login' , async (req, res) => {
    const { email, password } = req.body;
    try {
        const Stu = await Std.findOne({email});
        if(!Stu){
            return res.status(401).json({
                message: "email not found"
            })
        }
        if(Stu.password !== password){
            return res.status(401).json({message: "password not match"})
        }
        const token = jwt.sign({email: Std.email, password: password}, SecretKey);
        res.status(200).json({
            message : "student is Logged In",
            token: token
        });
    } catch (error) {
        return res.status(401).json({
            message: "error"
        })
    }
})

// update student
router.put('/student/:studentId', authenticate, async (req, res) => {
    const { studentId } = req.params;
    const { name, email, DOB, Batch, password } = req.body;

    try {
        // Find the student by ID
        const student = await Std.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }

        // Check if the teacher is authorized to update this student
        // if (student.createdBy.toString() !== req.user.id) {
        //     return res.status(403).json({ message: "You are not authorized to update this student" });
        // }


        // Prepare fields to update
        const updateData = {};
        if (name) updateData.name = name;
        if (email) updateData.email = email;
        if (DOB) updateData.DOB = DOB;
        if (Batch) updateData.Batch = Batch;
        if (password) updateData.password = password;

        // Update the student record
        const updatedStudent = await Std.findByIdAndUpdate(studentId, updateData, { new: true });

        res.status(200).json({
            message: "Student updated successfully",
            student: updatedStudent,
        });
    } catch (error) {
        res.status(500).json({ message: "Error updating student", error: error.message });
    }
});

// delete student
router.delete('/student/:studentId', authenticate, async (req, res) => {
    const { studentId } = req.params;

    try {
        // Find the student by ID
        const student = await Std.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }

        // Check if the teacher is authorized to delete this student
        // if (student.createdBy.toString() !== req.user.id) {
        //     return res.status(403).json({ message: "You are not authorized to delete this student" });
        // }

        // Delete the student record
        await Std.findByIdAndDelete(studentId);

        res.status(200).json({
            message: "Student deleted successfully",
        });
    } catch (error) {
        res.status(500).json({ message: "Error deleting student", error: error.message });
    }
});

//course created
router.post('/course', authenticate, async (req, res) => {
    const { name, author, studentId } = req.body;

    try {
        // Check if the student exists
        const student = await Std.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }

        // Create a new course
        const newCourse = await Course.create({ name, author, studentId });

        res.status(201).json({
            message: "Course created successfully",
            course: newCourse,
        });
    } catch (error) {
        res.status(500).json({ message: "Error creating course", error: error.message });
    }
});

// get student course
router.get('/student/:studentId/courses', authenticate, async (req, res) => {
    const { studentId } = req.params;

    try {
        // Find all courses for the specified student
        const courses = await Course.find({ studentId });

        if (courses.length === 0) {
            return res.status(404).json({ message: "No courses found for this student" });
        }

        res.status(200).json({
            message: "Courses fetched successfully",
            courses,
        });
    } catch (error) {
        res.status(500).json({ message: "Error fetching courses", error: error.message });
    }
});

// update student course
router.put('/course/:courseId', authenticate, async (req, res) => {
    const { courseId } = req.params;
    const { name, author } = req.body;

    try {
        // Find and update the course
        const updatedCourse = await Course.findByIdAndUpdate(
            courseId,
            { name, author },
            { new: true }
        );

        if (!updatedCourse) {
            return res.status(404).json({ message: "Course not found" });
        }

        res.status(200).json({
            message: "Course updated successfully",
            course: updatedCourse,
        });
    } catch (error) {
        res.status(500).json({ message: "Error updating course", error: error.message });
    }
});

// delete student course
router.delete('/course/:courseId', authenticate, async (req, res) => {
    const { courseId } = req.params;

    try {
        // Find and delete the course
        const deletedCourse = await Course.findByIdAndDelete(courseId);

        if (!deletedCourse) {
            return res.status(404).json({ message: "Course not found" });
        }

        res.status(200).json({
            message: "Course deleted successfully",
            course: deletedCourse,
        });
    } catch (error) {
        res.status(500).json({ message: "Error deleting course", error: error.message });
    }
});


module.exports = router;