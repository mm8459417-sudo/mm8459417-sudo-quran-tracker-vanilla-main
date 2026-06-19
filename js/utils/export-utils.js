(function () {
  let gifWorkerUrl = null;

  // 1. نظام التحميل الذكي (Lazy Loading) للمكتبات
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

  async function loadJsPdf() {
    if (window.jspdf) return;
    await new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
      s.onload = resolve;
      s.onerror = () => reject(new Error("فشل تحميل مكتبة الـ PDF"));
      document.head.appendChild(s);
    });
  }

  // 2. إصلاح تقطيع الشهادة أثناء التصوير
  async function captureElement(el, scale = 2) {
    await loadDomToImage();
    
    const clone = el.cloneNode(true);
    
    // الحل الجذري للتقطيع: نأخذ العرض الحقيقي للعنصر بدلاً من تثبيته بـ 800px
    const rect = el.getBoundingClientRect();
    const actualWidth = rect.width > 800 ? rect.width : 800; // لو الشهادة أعرض من 800، ياخد عرضها
    
    clone.style.cssText = `
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: ${actualWidth}px !important; 
      height: auto !important;
      direction: rtl !important;
      z-index: -9999 !important;
      margin: 0 !important;
      box-sizing: border-box !important;
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
      background-color: transparent !important;
      overflow: visible !important; /* مهم جداً لمنع قص الأطراف */
    `;
    
    const styleFix = document.createElement('style');
    styleFix.innerHTML = `
      * {
        animation: none !important;
        transition: none !important;
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
        max-width: none !important; /* يمنع العناصر الداخلية من الانكماش */
      }
      .royal-certificate-wrapper {
         overflow: visible !important; 
         background-color: transparent !important;
      }
    `;
    clone.appendChild(styleFix);
    
    document.body.appendChild(clone);
    
    await document.fonts.ready;
    await new Promise((r) => setTimeout(r, 1000)); 

    try {
      const height = clone.offsetHeight;

      const canvas = await domtoimage.toCanvas(clone, {
        width: actualWidth * scale,
        height: height * scale,
        bgcolor: '#ffffff', // الحفاظ على خلفية بيضاء لو فيه فراغات
        style: {
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          width: `${actualWidth}px`,
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
    if(window.showToast) window.showToast("جاري التجهيز بجودة عالية... ⏳");
    try {
      const canvas = await captureElement(el, 2);
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = filename;
      link.click();
      if(window.showToast) window.showToast("تم التحميل بنجاح! 🎉");
    } catch(err) {
      console.error(err);
      if(window.showToast) window.showToast("حدث خطأ أثناء التصوير.");
    }
  };

  window.exportElementAsPdf = async function (el, filename) {
    if(window.showToast) window.showToast("جاري تجهيز הـ PDF... ⏳");
    try {
      await loadJsPdf(); // تحميل المكتبة فقط عند ضغط الزر
      
      const canvas = await captureElement(el, 2);
      const imgData = canvas.toDataURL("image/png");
      const { jsPDF } = window.jspdf;
      
      const pdf = new jsPDF("l", "mm", "a4"); 
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(filename);
      if(window.showToast) window.showToast("تم تحميل הـ PDF! 🎉");
    } catch(err) {
      console.error(err);
      if(window.showToast) window.showToast("حدث خطأ أثناء التصوير.");
    }
  };

  window.exportElementAsGif = async function (el, filename) {
    if(window.showToast) window.showToast("جاري استخراج الـ GIF... ⏳");
    try {
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
        if(window.showToast) window.showToast("تم التحميل! 🎉");
      });

      gif.render();
    } catch (err) {
      console.error(err);
      if(window.showToast) window.showToast("حدث خطأ أثناء إنشاء الـ GIF.");
    }
  };
})();
