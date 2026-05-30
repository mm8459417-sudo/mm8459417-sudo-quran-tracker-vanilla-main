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

  // 1. دالة جديدة لتحميل المكتبة الحديثة (dom-to-image-more) تلقائياً
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

  // 2. دالة التصوير باستخدام المحرك الجديد (تمنع القص وتحافظ على التدرج والشفافية)
  async function captureElement(el, scale = 2) {
    await loadDomToImage();
    
    // إنشاء نسخة خفية لضبط المقاسات
    const clone = el.cloneNode(true);
    
    // التعديل الجذري: وضع النسخة داخل الشاشة ولكن خلف الموقع لمنع القص
    Object.assign(clone.style, {
      position: 'fixed',
      top: '0',
      left: '0', // استخدام اليسار بدل اليمين لمنع أي خروج عن حدود المتصفح
      width: '800px', // تثبيت العرض
      height: 'auto',
      direction: 'rtl',
      zIndex: '-9999', // إخفاء النسخة خلف الواجهة الرئيسية
      margin: '0',
      boxSizing: 'border-box'
    });
    
    document.body.appendChild(clone);
    
    await document.fonts.ready;
    // إعطاء المتصفح وقت كافي لرسم الشهادة بالكامل بكل تأثيراتها
    await new Promise((r) => setTimeout(r, 600)); 

    try {
      const width = 800;
      const height = clone.offsetHeight;

      // استخدام المحرك مع ضبط نقطة التكبير
      const canvas = await domtoimage.toCanvas(clone, {
        width: width * scale,
        height: height * scale,
        bgcolor: '#ffffff', // ضمان خلفية بيضاء نظيفة للشهادة
        style: {
          transform: `scale(${scale})`,
          transformOrigin: 'top left', // بدء التكبير من الزاوية العلوية اليسرى لمنع ترحيل العناصر
          width: `${width}px`,
          height: `${height}px`,
          margin: '0'
        }
      });
      return canvas;
    } finally {
      // مسح النسخة من الصفحة لتنظيف الكود
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
