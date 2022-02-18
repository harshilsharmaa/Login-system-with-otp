var dotenv = require('dotenv');
// load config
dotenv.config({path: './config/config.env'})

var connectDB = require("./config/db");
connectDB();

const app = require('./app');
// const app = express();








const port = 5000;

app.listen(5000,()=>{
    console.log(`Server is running at port ${port}`);
})