// Using jsPDF CDN loaded in your HTML

const fileInput = document.getElementById("imageInput");
const previewContainer = document.getElementById("preview");
const convertBtn = document.getElementById("convertBtn");

let selectedImages = [];

// Preview images
fileInput.addEventListener("change", () => {
    selectedImages = Array.from(fileInput.files);
    previewContainer.innerHTML = "";

    selectedImages.forEach(file => {
        const img = document.createElement("img");
        img.src = URL.createObjectURL(file);
        previewContainer.appendChild(img);
    });
});

// Convert images -> PDF
convertBtn.addEventListener("click", async () => {
    if (selectedImages.length === 0) {
        alert("Please upload at least one image.");
        return;
    }

    convertBtn.innerText = "Converting...";
    convertBtn.disabled = true;

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
        unit: "px",
        hotfixes: ["px_scaling"]
    });

    for (let i = 0; i < selectedImages.length; i++) {
        const file = selectedImages[i];

        const imgData = await readImageAsDataURL(file);
        const img = await loadImage(imgData);

        const pageWidth = pdf.internal.pageSize.getWidth();
        const ratio = img.height / img.width;
        const pageHeight = pageWidth * ratio;

        if (i > 0) pdf.addPage();

        pdf.addImage(img, "JPEG", 0, 0, pageWidth, pageHeight);
    }

    pdf.save("converted.pdf");

    convertBtn.innerText = "Convert to PDF";
    convertBtn.disabled = false;
});

// Helpers
function readImageAsDataURL(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(file);
    });
}

function loadImage(src) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.src = src;
    });
}
