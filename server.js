const express = require("express");
const path = require("path")

const PORT = 8080;
const app = express();

//Setting up static resources
app.use(express.static(path.join(__dirname, "static/")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT);