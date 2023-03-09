const fileInput = document.getElementById("insurancePic");
const fileName = document.getElementById("fileName");
const error = document.getElementById("error");

fileInput.addEventListener("change", (ev) => {
    fileName.value = fileInput.files[0].name;
});