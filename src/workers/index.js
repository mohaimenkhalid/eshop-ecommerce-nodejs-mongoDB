const fs = require("fs");
const path = require("path");

// Auto-loads every *.worker.js file in this folder, so adding a new worker
// needs no registration anywhere else.
const loadWorkers = () => {
    const files = fs
        .readdirSync(__dirname)
        .filter((file) => file.endsWith(".worker.js"));

    const workers = {};

    for (const file of files) {
        const name = path.basename(file, ".worker.js");
        workers[name] = require(path.join(__dirname, file));
        console.log(`🛠  worker registered: ${name}`);
    }

    return workers;
};

module.exports = loadWorkers();
