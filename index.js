const express = require('express');
const app = express();
const port = 4000;
const connectDB = require('./config/db.js')
const userRoute = require('./routes/userRoute.js')
const cors = require('cors');


connectDB();
app.use(express.json());
app.use(cors());

app.use('/user', userRoute);


app.listen(port, () => {
    console.log(`App running on port ${port}`);
})