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

  // الدالة النهائية بعد دمج التعديلات العميقة
  async function captureElement(el, scale = 3) {
    // 1. التأكد من تحميل الخطوط بالكامل قبل التصوير
    await document.fonts.ready;
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

    // 2. إعطاء العنصر ID مؤقت عشان نعرف نصطاده جوه النسخة الخفية
    const originalId = el.id;
    const tempId = 'capture-target-' + Math.random().toString(36).substr(2, 9);
    el.id = tempId;

    try {
      // 3. تشغيل المكتبة مع استخدام onclone للحفاظ على شجرة العناصر الأصلية
      const canvas = await html2canvas(el, {
        scale: scale, // دقة عالية جداً (3 بدل 2) لضمان جودة النصوص
        backgroundColor: "#ffffff",
        useCORS: true,
        allowTaint: true,
        scrollX: 0,
        scrollY: -window.scrollY, // حل سحري لمشكلة السكرول والقص
        onclone: (clonedDoc) => {
          // اصطياد العنصر من داخل النسخة المستنسخة للموقع
          const clonedEl = clonedDoc.getElementById(tempId);
          if (clonedEl) {
            // إجبار العنصر على التمدد لمقاس مناسب (800px) لمنع ضغط النصوص
            clonedEl.style.width = '800px';
            clonedEl.style.maxWidth = 'none'; // إلغاء أي تقييد للعرض
            clonedEl.style.transform = 'none'; // إلغاء أي تصغير أو تأثير زووم
            clonedEl.style.margin = '0';
            clonedEl.style.direction = 'rtl'; // تأكيد اتجاه اللغة

            // إيقاف أي أنيميشن في كامل النسخة أثناء التقاط الصورة
            const allElements = clonedDoc.getElementsByTagName("*");
            for (let i = 0; i < allElements.length; i++) {
              allElements[i].style.animation = "none";
              allElements[i].style.transition = "none";
            }
          }
        }
      });
      return canvas;
    } finally {
      // 4. إعادة العنصر لحالته الأصلية فور الانتهاء
      el.id = originalId;
    }
  }

  window.exportElementAsImage = async function (el, filename) {
    const canvas = await captureElement(el, 3);
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = filename;
    link.click();
  };

  window.exportElementAsPdf = async function (el, filename) {
    const canvas = await captureElement(el, 3);
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
