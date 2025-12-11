async function compressPDF() {
    const fileInput = document.getElementById("pdfInput");
    const level = document.getElementById("compressionLevel").value;
    const status = document.getElementById("status");
    const downloadLink = document.getElementById("downloadLink");

    if (!fileInput.files.length) {
        alert("Please select a PDF file.");
        return;
    }

    const file = fileInput.files[0];
    status.innerText = "Compressing... Please wait.";

    const reader = new FileReader();
    reader.onload = async function (e) {
        try {
            const pdfBytes = new Uint8Array(e.target.result);

            const pdfDoc = await PDFLib.PDFDocument.load(pdfBytes, {
                updateMetadata: false
            });

            // Apply compression levels
            let settings = {};

            if (level === "low") {
                settings = {
                    useObjectStreams: false,
                    compress: false,
                };
            } else if (level === "medium") {
                settings = {
                    useObjectStreams: true,
                    compress: true,
                };
            } else if (level === "high") {
                settings = {
                    useObjectStreams: true,
                    compress: true,
                };

                // Remove metadata for stronger shrinkage
                pdfDoc.setTitle("");
                pdfDoc.setAuthor("");
                pdfDoc.setSubject("");
                pdfDoc.setKeywords([]);
                pdfDoc.setProducer("");
                pdfDoc.setCreator("");
            }

            const compressed = await pdfDoc.save(settings);

            // Download
            const blob = new Blob([compressed], { type: "application/pdf" });
            downloadLink.href = URL.createObjectURL(blob);
            downloadLink.download = "compressed.pdf";
            downloadLink.style.display = "block";
            downloadLink.innerText = "Download Compressed PDF";

            status.innerText = "Compression complete!";
        }
        catch (err) {
            console.error(err);
            status.innerText = "Error compressing PDF.";
        }
    };

    reader.readAsArrayBuffer(file);
}
