const pdfInput = document.getElementById("pdfInput");
const convertBtn = document.getElementById("convertBtn");
const output = document.getElementById("output");

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

convertBtn.addEventListener("click", async () => {
  output.innerHTML = "";

  if (!pdfInput.files.length) {
    alert("Upload a PDF first.");
    return;
  }

  const file = pdfInput.files[0];
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);

    // HIGH SCALE = LOSSLESS QUALITY
    const scale = 4;
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({
      canvasContext: ctx,
      viewport: viewport
    }).promise;

    const img = document.createElement("img");
    img.src = canvas.toDataURL("image/png"); // LOSSLESS PNG
    img.alt = `Page ${pageNum}`;

    const download = document.createElement("a");
    download.href = img.src;
    download.download = `page-${pageNum}.png`;
    download.textContent = `Download Page ${pageNum}`;

    const wrapper = document.createElement("div");
    wrapper.className = "image-block";
    wrapper.appendChild(img);
    wrapper.appendChild(download);

    output.appendChild(wrapper);
  }
});
