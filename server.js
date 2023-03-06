const express = require("express");
const path = require("path");
const fs = require("fs");

//Predefined constants
const PORT = 8080;
const TEMPLATE_EXT = "view"; //file extension of templates

const app = express();

//Setting up static resources
app.use(express.static(path.join(__dirname, "static/")));

//Setting up a templating engine so clinics can easily change text to suit their needs
app.engine(TEMPLATE_EXT, (filePath, options, callback) => {
    fs.readFile(filePath, (err, content) => {
        
        if(err) return callback(err);

        let rendered = content.toString()
            .replace(/\$description\$/g, `${options.description}`)
            .replace(/\$clinic-name\$/g, `${options.clinicName}`)
            .replace(/\$url\$/g, `${options.url}`)
            .replace(/\$address\$/g, `${options.address}`)
            .replace(/\$email\$/g, `${options.email}`)
            .replace(/\$footer\$/g, `${options.footer}`)
            .replace(/\$open-days\$/g, `${options.openDays}`)
            .replace(/\$open-times\$/g,`${options.openTimes}`);

        //dynamically adding phone numbers
        for(let i=0; i<options.tel.length; i++){
            const regex = new RegExp(`\\$tel${i}\\$`, "g");
            rendered = rendered.replace(regex, `${options.tel[i]}`);
        }

        return callback(null, rendered);
    });
});

app.set("views", path.join(__dirname, "templates/"));
app.set("view engine", TEMPLATE_EXT);

app.get("/", (req, res) => {
    fs.readFile(path.join(__dirname, "config.json") , (err, content) => {
        if (err) throw err;
        res.render("index", JSON.parse(content.toString()));
    })
});

app.listen(PORT);