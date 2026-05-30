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

  // الدالة النهائية الشاملة لحل مشاكل المقاسات وتدرج الألوان وتفرق الحروف
  async function captureElement(el, scale = 2) {
    const clone = el.cloneNode(true);

    Object.assign(clone.style, {
      position: 'absolute',
      top: '-9999px',
      right: '-9999px',
      width: '800px', // عرض ثابت لمنع تداخل العناصر
      height: 'auto',
      direction: 'rtl', // إجبار الاتجاه العربي
      margin: '0',
      boxSizing: 'border-box',
    });

    document.body.appendChild(clone);

    // الانتظار حتى يتم تحميل الخطوط بالكامل
    await document.fonts.ready;
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

    try {
      const canvas = await html2canvas(clone, {
        scale: scale,
        backgroundColor: "#ffffff",
        useCORS: true,
        windowWidth: 800,
        scrollX: 0,
        scrollY: 0,
        onclone: (clonedDoc) => {
          // 1. حل مشكلة المربع البني وتداخل الألوان في العناوين (إلغاء الـ Gradient Text)
          const titles = clonedDoc.querySelectorAll('h1, h2, h3, .certificate-title, span'); 
          titles.forEach(title => {
            title.style.backgroundImage = 'none';
            title.style.webkitBackgroundClip = 'initial';
            title.style.backgroundClip = 'initial';
            title.style.webkitTextFillColor = 'initial';
            title.style.color = '#C6A15B'; // لون ذهبي سادة يعطي نفس الإحساس الفخم
            title.style.backgroundColor = 'transparent';
          });

          // 2. إيقاف الأنيميشن وحل مشكلة تفرق الحروف العربية
          const allElements = clonedDoc.getElementsByTagName("*");
          for (let i = 0; i < allElements.length; i++) {
            allElements[i].style.animation = "none";
            allElements[i].style.transition = "none";
            allElements[i].style.letterSpacing = "normal"; // يمنع تشتت الحروف
          }
        }
      });
      return canvas;
    } finally {
      // مسح النسخة الخفية من الصفحة لتنظيف الكود
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
