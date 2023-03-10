const fileInput = document.getElementById("insurancePic");
const pictureText = document.getElementById("pictureText");
const insuranceImage = document.getElementById("insuranceImage");
const error = document.getElementById("error");

fileInput.addEventListener("change", (ev) => {
    pictureText.innerText = "Tap here to change to a different picture.";
    
    const reader = new FileReader();
    reader.readAsDataURL(fileInput.files[0]);

    reader.onload = (ev) => {
        insuranceImage.src = ev.target.result;
    }
});