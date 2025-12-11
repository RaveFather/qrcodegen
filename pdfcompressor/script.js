function compressPDF() {
    const fileInput = document.getElementById("pdfInput");
    const status = document.getElementById("status");
    const downloadLink = document.getElementById("downloadLink");

    if (!fileInput.files.length) {
        alert("Please select a PDF file.");
        return;
    }

    const file = fileInput.files[0];

    status.innerText = "Compressing PDF... (this may take a few seconds)";

    // Browser-based compression using PDFLib
    const reader = new FileReader();

    reader.onload = async function (e) {
        try {
            const pdfBytes = new Uint8Array(e.target.result);

            const pdfDoc = await PDFLib.PDFDocument.load(pdfBytes, {
                updateMetadata: false
            });

            // Remove metadata, fonts, extra streams (light compression)
            pdfDoc.setTitle("");
            pdfDoc.setAuthor("");
            pdfDoc.setSubject("");
            pdfDoc.setKeywords([]);
            pdfDoc.setProducer("");
            pdfDoc.setCreator("");

            const compressed = await pdfDoc.save({
                useObjectStreams: true,
                compress: true
            });

            // Create download link
            const blob = new Blob([compressed], { type: "application/pdf" });
            downloadLink.href = URL.createObjectURL(blob);
            downloadLink.download = "compressed.pdf";
            downloadLink.style.display = "block";
            downloadLink.innerText = "Download Compressed PDF";

            status.innerText = "Compression complete!";

        } catch (err) {
            console.error(err);
            status.innerText = "Error compressing PDF.";
        }
    };

    reader.readAsArrayBuffer(file);
}
