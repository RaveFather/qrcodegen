// PDF -> Image converter using pdf.js + JSZip
const fileInput = document.getElementById('fileInput');
const convertBtn = document.getElementById('convertBtn');
const statusEl = document.getElementById('status');
const preview = document.getElementById('preview');
const downloadAllBtn = document.getElementById('downloadAllBtn');
const formatSelect = document.getElementById('format');
const qualityRange = document.getElementById('quality');
const qualityLabel = document.getElementById('qualityLabel');

let pdfDoc = null;
let pagesImages = []; // {pageNum, blob, name}

// enable/disable quality control depending on format
function updateQualityControl(){
  if(formatSelect.value === 'jpeg'){
    qualityRange.style.display = 'inline-block';
    qualityLabel.style.display = 'inline-block';
  } else {
    qualityRange.style.display = 'none';
    qualityLabel.style.display = 'none';
  }
}
formatSelect.addEventListener('change', updateQualityControl);
updateQualityControl();

// file selected
fileInput.addEventListener('change', () => {
  convertBtn.disabled = !fileInput.files.length;
  statusEl.textContent = fileInput.files.length ? '' : 'Choose a PDF file to convert.';
});

// main convert action
convertBtn.addEventListener('click', async () => {
  if(!fileInput.files.length) return;
  const file = fileInput.files[0];

  // small safety cap: avoid huge PDFs on low-memory devices
  if(file.size > 150 * 1024 * 1024){
    if(!confirm('This file is large (>150MB) and may be slow or fail in low-memory devices. Continue?')) return;
  }

  convertBtn.disabled = true;
  preview.innerHTML = '';
  pagesImages = [];
  downloadAllBtn.style.display = 'none';
  statusEl.textContent = 'Loading PDF…';

  // read file
  const arrayBuffer = await file.arrayBuffer();

  // pdf.js setup
  const loadingTask = pdfjsLib.getDocument({data: arrayBuffer});
  loadingTask.onProgress = (p) => {
    statusEl.textContent = `Loading PDF… ${Math.round(p.loaded / p.total * 100)}%`;
  };

  try {
    pdfDoc = await loadingTask.promise;
  } catch(err) {
    console.error(err);
    statusEl.textContent = 'Error loading PDF.';
    convertBtn.disabled = false;
    return;
  }

  statusEl.textContent = `PDF loaded — ${pdfDoc.numPages} page(s). Rendering pages…`;
  // render each page sequentially (keeps memory lower)
  for(let p=1;p<=pdfDoc.numPages;p++){
    statusEl.textContent = `Rendering page ${p} / ${pdfDoc.numPages}…`;
    const page = await pdfDoc.getPage(p);

    // viewport scale - choose px width roughly 1200 for good quality
    const viewport = page.getViewport({scale: 1});
    const targetWidth = 1200;
    const scale = targetWidth / viewport.width;
    const scaledViewport = page.getViewport({scale});

    // canvas
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = Math.round(scaledViewport.width);
    canvas.height = Math.round(scaledViewport.height);

    // render
    await page.render({canvasContext: context, viewport: scaledViewport}).promise;

    // convert to blob
    const format = formatSelect.value === 'jpeg' ? 'image/jpeg' : 'image/png';
    const quality = parseFloat(qualityRange.value) || 0.9;

    // toBlob may be async — wrap in Promise
    const blob = await new Promise(resolve => {
      if(format === 'image/png'){
        canvas.toBlob(resolve, format);
      } else {
        canvas.toBlob(resolve, format, quality);
      }
    });

    const nameExt = (format === 'image/png') ? 'png' : 'jpg';
    const filename = `${file.name.replace(/\.pdf$/i,'')}_page-${String(p).padStart(3,'0')}.${nameExt}`;

    pagesImages.push({pageNum: p, blob, name: filename, width: canvas.width, height: canvas.height});

    // show preview card
    const card = document.createElement('div');
    card.className = 'page';
    const thumb = document.createElement('canvas');
    // create thumbnail copy scaled down for preview
    const thumbCtx = thumb.getContext('2d');
    const thumbMaxW = 360;
    const thumbScale = Math.min(thumbMaxW / canvas.width, 1);
    thumb.width = Math.round(canvas.width * thumbScale);
    thumb.height = Math.round(canvas.height * thumbScale);
    thumbCtx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, thumb.width, thumb.height);
    card.appendChild(thumb);

    const info = document.createElement('small');
    info.textContent = `Page ${p} — ${thumb.width}×${thumb.height}`;
    card.appendChild(info);

    const actions = document.createElement('div');
    actions.className = 'actions';

    // single download
    const dl = document.createElement('button');
    dl.textContent = 'Download';
    dl.addEventListener('click', () => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    });
    actions.appendChild(dl);

    card.appendChild(actions);
    preview.appendChild(card);
  } // end pages loop

  statusEl.textContent = `Done — ${pagesImages.length} images ready`;
  if(pagesImages.length) downloadAllBtn.style.display = 'inline-block';
  convertBtn.disabled = false;
});

// Download all as zip
downloadAllBtn.addEventListener('click', async () => {
  if(!pagesImages.length) return;
  downloadAllBtn.disabled = true;
  downloadAllBtn.textContent = 'Preparing ZIP…';
  const zip = new JSZip();
  for(const p of pagesImages){
    zip.file(p.name, p.blob);
  }
  const content = await zip.generateAsync({type:'blob'}, (meta) => {
    statusEl.textContent = `Zipping… ${Math.round(meta.percent)}%`;
  });
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(fileInput.files[0]?.name || 'document').replace(/\.pdf$/i,'')}_images.zip`;
  a.click();
  URL.revokeObjectURL(url);
  downloadAllBtn.disabled = false;
  downloadAllBtn.textContent = 'Download All as ZIP';
  statusEl.textContent = 'ZIP ready and downloaded.';
});
