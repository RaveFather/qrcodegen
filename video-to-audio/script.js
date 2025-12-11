const { createFFmpeg, fetchFile } = FFmpeg;

const fileInput = document.getElementById("fileInput");
const convertBtn = document.getElementById("convertBtn");
const downloadBtn = document.getElementById("downloadBtn");
const progress = document.getElementById("progress");
const progressBar = document.getElementById("progressBar");
const progressText = document.getElementById("progressText");

let selectedFile = null;
let mp3Blob = null;

fileInput.addEventListener("change", (e) => {
    selectedFile = e.target.files[0];

    if (!selectedFile) return;

    if (selectedFile.size > 100 * 1024 * 1024) {
        alert("File too large! Please use a file under 100 MB.");
        fileInput.value = "";
        selectedFile = null;
        return;
    }

    convertBtn.disabled = false;
});

convertBtn.addEventListener("click", async () => {
    if (!selectedFile) return;

    convertBtn.disabled = true;
    convertBtn.textContent = "Converting...";
    progress.style.display = "block";

    const ffmpeg = createFFmpeg({
        log: false,
        progress: ({ ratio }) => {
            const percent = Math.round(ratio * 100);
            progressBar.style.width = percent + "%";
            progressText.textContent = percent + "%";
        }
    });

    await ffmpeg.load();

    ffmpeg.FS("writeFile", "input.mp4", await fetchFile(selectedFile));

    await ffmpeg.run("-i", "input.mp4", "-vn", "-acodec", "libmp3lame", "output.mp3");

    const data = ffmpeg.FS("readFile", "output.mp3");
    mp3Blob = new Blob([data.buffer], { type: "audio/mpeg" });

    convertBtn.textContent = "Done!";
    downloadBtn.style.display = "inline-block";
});

downloadBtn.addEventListener("click", () => {
    if (!mp3Blob) return;

    const url = URL.createObjectURL(mp3Blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "converted.mp3";
    a.click();

    URL.revokeObjectURL(url);
});
