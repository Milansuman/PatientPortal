const fileInput = document.getElementById("insurancePic");
const pictureText = document.getElementById("pictureText");
const insuranceImage = document.getElementById("insuranceImage");
const error = document.getElementById("error");
const success = document.getElementById("success");

const form = document.getElementById("form");
const submit = document.getElementById("submit");

fileInput.addEventListener("change", (ev) => {
    pictureText.innerText = "Tap here to change to a different picture.";
    
    const reader = new FileReader();
    reader.readAsDataURL(fileInput.files[0]);

    reader.onload = (ev) => {
        insuranceImage.src = ev.target.result;
    }
});

submit.addEventListener("click", async (ev) => {
    ev.preventDefault();

    let data = new FormData(form);
    let encryptedFormData = {};
    let cipherKey = "";

    try{
        cipherKey = await get("/key");
    }catch(err){
        error.className = "visible";
        return;
    }

    for(const key of data.keys()){
        if(key === "csrf"){
            encryptedFormData[key] = data.get(key);
            continue;
        }

        if(key === "insurancePic") continue;

        const value = data.get(key);
        if(value !== null){
            encryptedFormData[key] = CryptoJS.AES.encrypt(value, cipherKey).toString();
        }
    }

    const reader = new FileReader();
    reader.onload = async () => {
        const wordArray = CryptoJS.lib.WordArray.create(reader.result);
        encryptedFormData["insurancePic"] = CryptoJS.AES.encrypt(wordArray, cipherKey).toString();
        try{
            await post("/appointment", JSON.stringify(encryptedFormData)); //making sure image is added to the request
            success.className = "visible";
            error.className = "invisible";
        }catch(err){
            error.className = "visible";
            success.className = "invisible";
        }finally{
            window.scrollTo({top: 0, behavior: "smooth"});
        }
    }
    reader.readAsArrayBuffer(data.get("insurancePic"));
    
});

async function get(path){
    return await fetch(path)
        .then((response) => {
            if(!response.ok) throw new Error("Unable to obtain encryption key.");
            return response.text();
        }).then((value) => {
            return value;
        });
}

async function post(path, data){
    return await fetch(path, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: data
    }).then(response => {
        if (!response.ok) throw new Error(`${response.statusText}`);
    });
}