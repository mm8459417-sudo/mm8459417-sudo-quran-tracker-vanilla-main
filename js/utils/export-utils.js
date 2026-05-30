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

  // 1. دالة لتحميل المكتبة الحديثة (dom-to-image-more) تلقائياً
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

  // 2. دالة التصوير الاحترافية الشاملة (تمنع القص، وتحافظ على التدرج، وتمنع تشويش النصوص)
  async function captureElement(el, scale = 2) {
    await loadDomToImage();
    
    // عمل نسخة خفية من الشهادة
    const clone = el.cloneNode(true);
    
    // وضع النسخة في مكان آمن خلف الموقع تماماً لمنع القص
    Object.assign(clone.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '800px',
      height: 'auto',
      direction: 'rtl',
      zIndex: '-9999', // مخفية وراء الكواليس
      margin: '0',
      boxSizing: 'border-box'
    });
    
    document.body.appendChild(clone);
    
    // الانتظار حتى تحميل الخطوط
    await document.fonts.ready;
    
    // تنظيف النسخة من الشوائب والتأثيرات الزجاجية التي تسبب "التشويش والتمويه رمادي اللون"
    const allElements = clone.querySelectorAll('*');
    allElements.forEach(node => {
      // إيقاف أي حركات قد تفسد اللقطة
      node.style.animation = 'none';
      node.style.transition = 'none';
      
      const computed = window.getComputedStyle(node);
      
      // حل مشكلة الغشاوة (Blur) الناتجة عن التأثير الزجاجي خلف الاسم والتي تسيح على السطر التالي
      if (computed.backdropFilter !== 'none' || computed.webkitBackdropFilter !== 'none') {
        node.style.backdropFilter = 'none';
        node.style.webkitBackdropFilter = 'none';
        
        // استبدال الغشاوة بخلفية بيضاء شبه شفافة أنيقة ونظيفة للتصوير
        if (computed.backgroundColor === 'rgba(0, 0, 0, 0)' || computed.backgroundColor === 'transparent') {
            node.style.backgroundColor = 'rgba(255, 255, 255, 0.6)';
        }
      }
      
      // إزالة أي ظلال نصوص قد تتداخل مع تدرج الألوان الذهبي للعنوان
      if (computed.webkitBackgroundClip === 'text' || computed.backgroundClip === 'text') {
        node.style.textShadow = 'none';
      }
    });

    // إعطاء المتصفح لحظة لتطبيق التعديلات النظيفة
    await new Promise((r) => setTimeout(r, 600)); 

    try {
      const width = 800;
      const height = clone.offsetHeight;

      // التقاط الصورة بجودة عالية عبر المحرك الحديث
      const canvas = await domtoimage.toCanvas(clone, {
        width: width * scale,
        height: height * scale,
        bgcolor: '#ffffff',
        style: {
          transform: `scale(${scale})`,
          transformOrigin: 'top left', // ضبط نقطة التكبير للغة العربية
          width: `${width}px`,
          height: `${height}px`,
          margin: '0'
        }
      });
      return canvas;
    } finally {
      // تنظيف شجرة الـ DOM ومسح النسخة الخفية فوراً
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
