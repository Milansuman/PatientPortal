const fileInput = document.getElementById("insurancePic");
const fileName = document.getElementById("fileName");

fileInput.addEventListener("change", (ev) => {
    fileName.value = fileInput.files[0].name;
});