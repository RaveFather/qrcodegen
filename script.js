function generateQR() {
    let text = document.getElementById("text").value;
    document.getElementById("qrcode").innerHTML = "";
    new QRCode(document.getElementById("qrcode"), text);
}
