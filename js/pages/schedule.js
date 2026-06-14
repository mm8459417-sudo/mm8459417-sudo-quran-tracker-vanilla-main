(function () {
  // دالة لضبط شكل الوقت (من 17:00 إلى 5:00 م)
  function formatTime(timeStr) {
    if (!timeStr) return "--:--";
    if (timeStr.includes('م') || timeStr.includes('ص')) return timeStr;
    let [hours, minutes] = timeStr.split(':');
    let h = parseInt(hours);
    if (isNaN(h)) return timeStr;
    let ampm = h >= 12 ? 'م' : 'ص';
    h = h % 12;
    h = h ? h : 12;
    return `${h}:${minutes} ${ampm}`;
  }

  window.renderSchedulePage = function () {
    const daysOrder = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

    let autoScheduleItems = [];
    let students = window.appState?.students || [];
    let sessions = window.appState?.sessions || [];

    // فحص: هل يوجد أي طالب عنده موعد حقيقي متسجل؟
    let hasRealScheduleData = students.some(s => s.day || s.time || s.schedule || s.days);

    students.forEach((student, index) => {
        // حساب عدد الحصص اللي حضرها الطالب ده
        let studentSessionsCount = sessions.filter(s => s.participant && s.participant.id === student.id).length;

        if (hasRealScheduleData) {
            // سحب البيانات الحقيقية لو موجودة
            if (student.day && student.time) {
                autoScheduleItems.push({
                    day: student.day, time: student.time, title: student.name, gender: student.gender, sessionsCount: studentSessionsCount
                });
            }
        } else {
            // وضع تجريبي (Demo Mode) عشان نوريك شكل الجدول
            const mockDays = ['السبت', 'الإثنين', 'الأربعاء', 'الخميس'];
            const mockTimes = ['16:00', '17:00', '18:30', '19:00'];
            autoScheduleItems.push({
               day: mockDays[index % mockDays.length],
               time: mockTimes[index % mockTimes.length],
               title: student.name.split(' ')[0], // الاسم الأول فقط عشان الشكل
               gender: student.gender,
               sessionsCount: studentSessionsCount
            });
        }
    });

    // ترتيب المواعيد تصاعدياً
    autoScheduleItems.sort((a, b) => (a.time || "").localeCompare(b.time || ""));

    // إظهار الأيام النشطة فقط (اللي فيها حلقات)
    let activeDays = daysOrder.filter(d => autoScheduleItems.some(item => item.day === d));
    if (activeDays.length === 0) activeDays = daysOrder;

    // بناء أعمدة الجدول
    let daysHtml = activeDays.map(day => {
      let dayItems = autoScheduleItems.filter(item => item.day === day);

      let itemsHtml = dayItems.map((item, idx) => {
         let isFemale = item.gender === 'girl' || item.gender === 'female';
         let genderIcon = isFemale
            ? `<i class="ph-bold ph-gender-female" style="color: #ec4899; font-size: 16px;"></i>`
            : `<i class="ph-bold ph-gender-male" style="color: #3b82f6; font-size: 16px;"></i>`;

         return `
           <div style="display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 15px 0;">
              <div style="border: 2px solid #6ee7b7; background: #ecfdf5; border-radius: 30px; padding: 4px 20px; font-weight: 900; font-size: 16px; color: #047857; letter-spacing: 1px;">
                 ${formatTime(item.time)}
              </div>
              <div style="font-weight: 900; font-size: 15px; color: var(--text-primary); display: flex; align-items: center; gap: 6px;">
                 ${item.title} ${genderIcon}
              </div>
              <div style="font-size: 12px; color: #94a3b8; font-weight: bold;">
                 ${item.sessionsCount} حصة
              </div>
           </div>
           ${idx < dayItems.length - 1 ? `<hr style="border: 0; border-top: 1px dashed #cbd5e1; width: 70%; margin: 0 auto;" />` : ''}
         `;
      }).join('');

      if (dayItems.length === 0) {
          itemsHtml = `<div style="text-align:center; padding:30px 0; color:#94a3b8; font-size:13px; font-weight:bold;">لا توجد حلقات</div>`;
      }

      return `
        <div style="min-width: 220px; flex: 1; border-left: 1px solid #e2e8f0; display: flex; flex-direction: column; background: #fff;">
           <div style="background: #f8fafc; padding: 20px 15px; text-align: center; border-bottom: 2px solid var(--emerald);">
               <div style="font-weight: 900; color: var(--emerald-dark); font-size: 18px;">${day}</div>
               <div style="color: #64748b; font-size: 13px; font-weight: bold; margin-top: 4px;">${dayItems.length} حلقة</div>
           </div>
           <div style="padding: 10px; display: flex; flex-direction: column;">
              ${itemsHtml}
           </div>
        </div>
      `;
    }).join('');

    return `
      <div style="border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; margin-bottom: 30px; background: #fff;">
        
        <div style="background: #0B3D2E; padding: 30px 20px; text-align: center; color: white;">
           <h2 style="margin: 0; font-weight: 900; font-size: 26px; color: #fff;">الجدول الأسبوعي للحلقات</h2>
           <div style="margin-top: 10px; font-size: 15px; color: #a7f3d0; font-weight: bold;">
              إجمالي ${autoScheduleItems.length} حلقة · ${activeDays.length} أيام نشطة
           </div>
        </div>

        ${!hasRealScheduleData && students.length > 0 ? `
        <div style="background: #fffbeb; color: #b45309; padding: 12px; text-align: center; font-size: 13px; font-weight: bold; border-bottom: 1px solid #fde68a;">
            ⚠️ ملاحظة: لم يتم العثور على مواعيد مسجلة للطلاب. تم وضع هذه المواعيد كـ (عينة تجريبية Demo) لتوضيح التصميم الرائع!
        </div>
        ` : ''}

        ${students.length === 0 ? `
        <div style="padding: 50px; text-align: center; color: #94a3b8; font-weight: bold;">
            لا يوجد طلاب مسجلين بعد لإنشاء الجدول.
        </div>
        ` : ''}

        <div style="display: flex; overflow-x: auto;">
           ${daysHtml}
        </div>
      </div>
    `;
  };
})();
