// الدالة النهائية بعد حل مشكلة تدرج الألوان (Text Gradient) وتفرق الحروف
  async function captureElement(el, scale = 2) {
    const clone = el.cloneNode(true);

    Object.assign(clone.style, {
      position: 'absolute',
      top: '-9999px',
      right: '-9999px',
      width: '800px', 
      height: 'auto',
      direction: 'rtl', 
      margin: '0',
      boxSizing: 'border-box',
    });

    document.body.appendChild(clone);

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
          
          // 1. حل مشكلة المربع البني وتداخل الألوان في العناوين
          // بنستهدف كل العناوين عشان نمسح تأثير الـ Gradient ونحط لون ذهبي سادة
          const titles = clonedDoc.querySelectorAll('h1, h2, h3, .certificate-title, span'); 
          titles.forEach(title => {
            // لو العنصر واخد تأثير خلفية على النص، بنلغيه هنا
            title.style.backgroundImage = 'none';
            title.style.webkitBackgroundClip = 'initial';
            title.style.backgroundClip = 'initial';
            title.style.webkitTextFillColor = 'initial';
            title.style.color = '#C6A15B'; // لون ذهبي سادة مريح للمكتبة
            title.style.backgroundColor = 'transparent';
          });

          // 2. إيقاف الأنيميشن وحل مشكلة تفرق الحروف العربية في الأسفل
          const allElements = clonedDoc.getElementsByTagName("*");
          for (let i = 0; i < allElements.length; i++) {
            allElements[i].style.animation = "none";
            allElements[i].style.transition = "none";
            allElements[i].style.letterSpacing = "normal"; // بيمنع تشتت الحروف زي (ف ق ن ي س)
          }
        }
      });
      return canvas;
    } finally {
      document.body.removeChild(clone);
    }
  }
