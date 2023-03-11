const express = require("express");
const helmet = require("helmet");
const Tokens = require("csrf");
const path = require("path");
const fs = require("fs");
const https = require("https");
const utf8 = require("crypto-js/enc-utf8");
const AES = require("crypto-js/aes");
const MD5 = require("crypto-js/md5");
const utility = require("./utility");

//Predefined constants
const PORT = 8080;
const TEMPLATE_EXT = "view"; //file extension of templates
const KEY_PATH = path.join(__dirname, "localhost-key.pem"); //path to private key
const CERT_PATH = path.join(__dirname, "localhost.pem"); //path to certificate
const UPLOADS = path.join(__dirname, "uploads/");

const app = express();
const tokens = new Tokens();
let secret = "";
let cipherKey = "";

//Setting up static resources
app.use(express.static(path.join(__dirname, "static/")));

//Setting up secure headers
app.use(helmet());

//Setting up JSON
app.use(express.json({limit:"500kb"}));

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
            .replace(/\$csrf\$/g, `${options.csrf}`);

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

        //adding csrf token
        tokens.secret((err, secretString) => {
            if(err) throw err;
            secret = secretString;
            options.csrf = tokens.create(secret);
            res.render("index", options);
        });
    })
});

app.post("/appointment", (req, res) => {
    if(!tokens.verify(secret, req.body.csrf) || !validate(decrypt(req.body))){
        res.sendStatus(400);
    }else{
        makeAppointment(decrypt(req.body));
        res.sendStatus(200);
    }
});

app.get("/key", (req, res) => {
    cipherKey = MD5(Math.floor(Math.random*10).toString()).toString();
    res.send(cipherKey);
});

options = {
    key: fs.readFileSync(KEY_PATH),
    cert: fs.readFileSync(CERT_PATH)
}

https.createServer(options, app).listen(PORT);

function validate(data){
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

function makeAppointment(data){
    //TODO: Implement function
    console.log(data);
}

function decrypt(data){
    let decryptedData = {};
    for(const key in data){
        if(key === "csrf") continue;
        
        if(key === "insurancePic"){
            const decryptedImage = AES.decrypt(data[key], cipherKey);
            const fileName = MD5(Math.floor(Math.random*100).toString()).toString();
            fs.writeFile(path.join(UPLOADS, fileName), utility.wordArrayToUint8Array(decryptedImage), (err) => {
                if(err) throw err;
            });
            decryptedData["fileName"]  = fileName;
            continue;
        }

        decryptedData[key] = AES.decrypt(data[key], cipherKey).toString(utf8);
    }
    return decryptedData;
}