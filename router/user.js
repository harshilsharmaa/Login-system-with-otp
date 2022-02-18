const router = require('express').Router();
const User = require("../model/user");
const Otp = require("../model/otp");
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const cookie = require('cookie-parser');
const otpGenrator = require("otp-generator");
var unirest = require("unirest");

var dotenv = require('dotenv');
const { isAuthenticated } = require('../middleware/auth');
// load config
dotenv.config({ path: '../config/config.env' })



// For uploading image
var path = require('path');
var multer = require('multer');
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images')
    },
    filename: (req, file, cb) => {
        console.log(file);
        cb(null, Date.now() + path.extname(file.originalname))
    }
})
const upload = multer({ storage: storage })



router.get('/login', (req, res) => {
    res.render("login");
})
router.get('/signup', (req, res) => {
    res.render("index");
})
router.get('/signup/verify', (req, res) => {
    res.render("confirmSignup");
})
router.get('/editprofile/:id', async (req, res) => {

    try {
        const user = await User.findById(req.params.id);
        res.render("editprofile", { user });

    } catch (error) {
        console.log(error);
    }

})

router.get('/editprofile/:id', isAuthenticated, async (req, res) => {

    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.send(404).json({
                message: "User not found"
            })
        }

    } catch (error) {
        console.log(error);
    }
})


router.post('/editprofile/:id', upload.single('mainimage'), async (req, res) => {

    try {
        const user = await User.findById(req.params.id);

        const { name, bio, interest } = req.body;

        if (req.file) {
            var mainimage = req.file.filename
        }
        const update = {
            name,
            bio,
            profileImage: mainimage
        }


        await user.updateOne(update);

        await user.save();

        res.redirect(`/api/user/profile/${user._id}`);

    } catch (error) {
        console.log(error);
    }

})

router.post('/signup', async (req, res) => {

    try {

        const user = await User.findOne({
            number: req.body.number
        });
        if (user) return res.status(400).send("User already registered");
        const OTP = otpGenrator.generate(4, {
            digits: true,
            lowerCaseAlphabets: false,
            upperCaseAlphabets: false,
            specialChars: false
        });



        const number = req.body.number;
        const otp = new Otp({ number: number, otp: OTP });
        const salt = await bcrypt.genSalt(10);
        otp.otp = await bcrypt.hash(otp.otp, salt);
        const result = await otp.save();

        var req = unirest("GET", "https://www.fast2sms.com/dev/bulk");

        req.query({
            "authorization": process.env.OTP_API,
            "sender_id": "FSTSMS",
            "message": `OTP is ${OTP}`,
            "language": "english",
            "route": "p",
            "numbers": `${number}`,
        });

        req.headers({
            "cache-control": "no-cache
        });

        req.end(function (res) {
            if (res.error) throw new Error(res.error);


        });
        res.status(200).render("confirmSignup", { number });

    } catch (error) {
        return res.status(400).send(error);
    }
})


router.post('/signup/verify', async (req, res) => {

    const otpHolder = await Otp.find({
        number: req.body.number
    });
    if (otpHolder.length === 0) return res.status(400).send("You are using expired otp!")
    const rightOtpFind = otpHolder[otpHolder.length - 1];

    const validUser = await bcrypt.compare(req.body.otp, rightOtpFind.otp);

    if (rightOtpFind.number === req.body.number && validUser) {
        const user = new User({ name: req.body.name, password: req.body.password, number: req.body.number });
        const token = user.generateJWT();
        const result = await user.save();

        const OtpDelete = await Otp.deleteMany({
            number: rightOtpFind.number
        });

        return res.redirect('/api/user/login', 200);
    }
    else {
        return res.status(400).send("Wrong otp")
    }
})


router.get('/profile/:id', isAuthenticated, async (req, res) => {

    try {
        const user = await User.findById(req.params.id);
        res.render('profile', { user })



    } catch (error) {
        console.log(error);
    }

})





router.post('/login', async (req, res) => {
    try {

        const user = await User.findOne({
            number: req.body.number
        });

        if (!user) {
            console.log("nahi mila");
            res.render("login")
        }
        else {

            if (await bcrypt.compare(req.body.password, user.password)) {

                let token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET)

                res.status(200)
                    .cookie("token", token, { expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), httpOnly: true })

                    .redirect(`profile/${user._id}`);
            }
            else {
                res.status(400).render("login", { incorectpassword })
            }

        }


    } catch (error) {
        res.status(400).send(error);
    }
})


module.exports = router;