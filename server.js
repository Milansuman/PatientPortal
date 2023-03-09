const express = require("express");
const helmet = require("helmet");
const multer = require("multer");
const Tokens = require("csrf");
const path = require("path");
const fs = require("fs");
const https = require("https");

//Predefined constants
const PORT = 8080;
const TEMPLATE_EXT = "view"; //file extension of templates
const KEY_PATH = path.join(__dirname, "localhost.key"); //path to private key
const CERT_PATH = path.join(__dirname, "localhost.crt"); //path to certificate

const app = express();
const upload = multer({dest: path.join(__dirname, "uploads/")});
const tokens = new Tokens();
let secret = "";

//setting up cookies

//Setting up static resources
app.use(express.static(path.join(__dirname, "static/")));

//Setting up secure headers
app.use(helmet());

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
            .replace(/\$open-times\$/g,`${options.openTimes}`)
            .replace(/\$csrf\$/g, `${options.csrf}`)
            .replace(/\$visible\$/g, `${options.error}`);

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
        options = JSON.parse(content.toString());

        if(req.headers.cookie.split("=")[1] === "1"){
            options.error = "visible";
        }else{
            options.error = "invisible";
        }
        //adding csrf token
        tokens.secret((err, secretString) => {
            if(err) throw err;
            secret = secretString;
            options.csrf = tokens.create(secret);
            res.render("index", options);
        });
    })
});

app.post("/appointment", upload.single("insurancePic") ,(req, res) => {
    if(!tokens.verify(secret, req.body.csrf) || !validate(req.body, req.file)){
        res.cookie("error", "1", {httpOnly: true}).redirect("/");
    }else{
        makeAppointment(req.body, req.file);
        res.cookie("error", "0", {httpOnly: true}).redirect("/");
    }
});

options = {
    key: fs.readFileSync(KEY_PATH),
    cert: fs.readFileSync(CERT_PATH)
}

https.createServer(options, app).listen(PORT);

function validate(data, file){
    const nameRegex = RegExp("[<>;:\"?\\/\\!@#\\$%^&*()|~`\\-_]", "g");

    //validating formdata
    for(let key in data){
        if(data.key === ''){
            continue;
        }

        switch(key){
            case "firstName":
            case "middleName":
            case "lastName":
                if(data[key].match(nameRegex) !== null) return false;
                break;
            case "dob":
                if(data[key].match(/^\d{4}-\d{2}-\d{2}$/g) === null || data[key].length !== 10) return false;
                break;
            case "address":
                if(data[key].match(/[^A-Za-z0-9#\/,\s]/g) !== null) return false;
                break;
            case "city":
            case "state":
                if(data[key].match(/^\w+$/g) === null) return false;
                break;
            case "zipCode":
                if(data[key].match(/^\d{5}(?:-\d{4})?$/g) === null) return false;
                break;
            case "tel":
                if(data[key].match(/[^\+0-9-()]/g) !== null) return false;
                break;
            case "email":
                if(data[key].match(/^\w+(?:\.\w+)*(?:\+\w+)?@\w+\.\w+$/g) === null) return false;
                break;
            case "insuranceName":
                if(data[key].match(/[<>;:\"?\/\\!@#\$%^&*()|~`]/g) !== null) return false;
                break;
            case "insuranceNumber":
                if(data[key].match(/\d+/g) === null) return false;
                break;
        }
    }

    return true;
}

function makeAppointment(data, file){
    //TODO: Implement function
    console.log(data);
    console.log(file);
}