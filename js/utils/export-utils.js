(function () {
  let gifWorkerUrl = null;

  async function loadGifJs() {
    if (window.GIF) return;
    await new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.js";
      s.onload = resolve;
      s.onerror = () => reject(new Error("فشل تحميل GIF"));
      document.head.appendChild(s);
    });
  }

  async function loadGifWorker() {
    if (gifWorkerUrl) return gifWorkerUrl;
    const res = await fetch("https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js");
    if (!res.ok) throw new Error("فشل تحميل GIF worker");
    gifWorkerUrl = URL.createObjectURL(new Blob([await res.text()], { type: "text/javascript" }));
    return gifWorkerUrl;
  }

  async function loadDomToImage() {
    if (window.domtoimage) return;
    await new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/dom-to-image-more/3.2.0/dom-to-image-more.min.js";
      s.onload = resolve;
      s.onerror = () => reject(new Error("فشل تحميل مكتبة الصور الحديثة"));
      document.head.appendChild(s);
    });
  }

  // دالة التصوير الاحترافية والآمنة (بدون تشويه للختم أو النصوص)
  async function captureElement(el, scale = 2) {
    await loadDomToImage();
    
    const clone = el.cloneNode(true);
    
    Object.assign(clone.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '800px',
      height: 'auto',
      direction: 'rtl',
      zIndex: '-9999',
      margin: '0',
      boxSizing: 'border-box'
    });
    
    // التعديل الآمن: حقن CSS مباشر يلغي الغشاوة والأنيميشن بدون المساس بألوان الختم
    const styleFix = document.createElement('style');
    styleFix.innerHTML = `
      * {
        animation: none !important;
        transition: none !important;
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
      }
    `;
    clone.appendChild(styleFix);
    
    document.body.appendChild(clone);
    
    await document.fonts.ready;
    await new Promise((r) => setTimeout(r, 600)); 

    try {
      const width = 800;
      const height = clone.offsetHeight;

      const canvas = await domtoimage.toCanvas(clone, {
        width: width * scale,
        height: height * scale,
        bgcolor: '#ffffff',
        style: {
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          width: `${width}px`,
          height: `${height}px`,
          margin: '0'
        }
      });
      return canvas;
    } finally {
      document.body.removeChild(clone);
    }
  }

  window.exportElementAsImage = async function (el, filename) {
    const canvas = await captureElement(el, 2);
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = filename;
    link.click();
  };

  window.exportElementAsPdf = async function (el, filename) {
    const canvas = await captureElement(el, 2);
    const imgData = canvas.toDataURL("image/png");
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 5, pdfWidth, pdfHeight);
    pdf.save(filename);
  };

  window.exportElementAsGif = async function (el, filename) {
    await loadGifJs();
    const workerUrl = await loadGifWorker();

    const SCALE = 1.5;
    const canvas = await captureElement(el, SCALE);
    const gif = new window.GIF({
      workers: 2,
      quality: 10,
      width: canvas.width,
      height: canvas.height,
      workerScript: workerUrl,
      background: "#ffffff",
    });

    const frameCount = 12;
    const delay = 120;
    for (let i = 0; i < frameCount; i++) {
      const frameCanvas = await captureElement(el, SCALE);
      gif.addFrame(frameCanvas, { delay, copy: true });
    }

    gif.on("finished", (blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    });

    gif.render();
  };
})();
