(function () {
  window.renderSchedulePage = function () {
    const days = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

    // 1. تجميع مواعيد الطلاب تلقائياً من قاعدة البيانات
    let autoScheduleItems = [];

    if (window.appState && window.appState.students && window.appState.students.length > 0) {
      window.appState.students.forEach(student => {
        // بنسحب اليوم والوقت الخاص بالطالب (لو متسجلين)
        if (student.day && student.time) {
          autoScheduleItems.push({
            day: student.day,
            time: student.time,
            title: student.name
          });
        }
        // إضافة دعم لو إنت مسجل للطالب أكتر من يوم في مصفوفة (Array)
        else if (student.days && Array.isArray(student.days)) {
          student.days.forEach(d => {
            autoScheduleItems.push({
              day: d.day || d,
              time: d.time || student.time || 'غير محدد',
              title: student.name
            });
          });
        }
      });
    }

    // 2. ترتيب المواعيد تصاعدياً حسب الوقت عشان الجدول يبقى مظبوط
    autoScheduleItems.sort((a, b) => (a.time || "").localeCompare(b.time || ""));

    // 3. بناء الأعمدة لكل يوم
    let daysHtml = days.map(day => {
      // فلترة الحلقات الخاصة باليوم ده بس
      const dayItems = autoScheduleItems.filter(item => item.day === day);
      
      let itemsHtml = dayItems.map(item => `
        <div style="background: #fff; border-right: 4px solid var(--emerald); padding: 12px; margin-bottom: 10px; border-radius: 6px; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
          <div style="font-weight: 800; color: var(--text-primary); font-size: 14px; margin-bottom: 4px;">${item.title}</div>
          <div style="color: var(--emerald-dark); font-size: 13px; font-weight: bold; display: flex; align-items: center; gap: 4px;">
            <i class="ph-duotone ph-clock"></i> ${item.time}
          </div>
        </div>
      `).join('');

      // لو اليوم فاضي مفيش فيه طلاب
      if (dayItems.length === 0) {
        itemsHtml = `
          <div style="text-align: center; color: var(--text-muted); font-size: 13px; padding: 20px 0; background: rgba(255,255,255,0.5); border-radius: 6px; border: 1px dashed var(--color-border);">
            لا توجد حلقات
          </div>`;
      }

      // الشكل النهائي لعمود اليوم
      return `
        <div style="background: var(--card-bg); border: 1px solid var(--color-border); border-radius: 8px; padding: 15px;">
          <h4 style="text-align: center; color: var(--emerald-dark); font-weight: 900; margin-bottom: 15px; border-bottom: 2px solid var(--emerald-bg); padding-bottom: 10px; font-size: 16px;">${day}</h4>
          ${itemsHtml}
        </div>
      `;
    }).join('');

    return `
      <div>
        <div class="d-flex align-items-center gap-3 mb-5">
          <div style="width:40px;height:40px;border-radius:var(--r-md);background:var(--emerald-bg);display:flex;align-items:center;justify-content:center;">
            <i class="ph-duotone ph-calendar-check" style="font-size: 20px; color: var(--emerald)"></i>
          </div>
          <div>
            <div style="font-weight:var(--fw-bold);font-size:var(--fs-lg);color:var(--text-primary);">الجدول الأسبوعي</div>
            <div style="font-size:var(--fs-xs);color:var(--text-muted);">عرض مواعيد حلقات الطلاب تلقائياً</div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 15px;">
          ${daysHtml}
        </div>
      </div>
    `;
  };
})();
