require('dotenv').config();
const app = require('./index');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 3000;

const bootServer = async () => {
    // DB initialization
    await connectDB();

    app.listen(PORT, () => {
        console.log(`🚀 Server run on: http://localhost:${PORT}`);
    });
};

bootServer();