(function () {
  function formatTime(timeStr) {
    if (!timeStr) return "--:--";
    if (timeStr.includes('م') || timeStr.includes('ص') || timeStr.includes('AM') || timeStr.includes('PM')) return timeStr;
    let [hours, minutes] = timeStr.split(':');
    let h = parseInt(hours);
    if (isNaN(h)) return timeStr;
    let ampm = h >= 12 ? 'م' : 'ص';
    h = h % 12;
    h = h ? h : 12;
    return `${h}:${minutes} ${ampm}`;
  }

  window.renderSchedulePage = function () {
    const allDays = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

    let autoScheduleItems = [];
    let students = window.appState?.students || [];
    let sessions = window.appState?.sessions || [];

    // سحب البيانات الحقيقية من الطلاب بذكاء أكبر وتغطية أوسع
    students.forEach((student) => {
        let studentSessionsCount = sessions.filter(s => s.participant && s.participant.id === student.id).length;
        
        let studentSchedules = [];

        // الفحص الشامل لكل الأماكن المحتملة لحفظ المواعيد
        const possibleScheduleArrays = [
            student.schedule,
            student.days,
            student.appointments,
            student.weeklySchedule,
            student.times
        ];

        possibleScheduleArrays.forEach(scheduleArray => {
            if (Array.isArray(scheduleArray)) {
                scheduleArray.forEach(s => {
                    // نتأكد إن الميعاد ده مش موجود قبل كده لنفس الطالب عشان التكرار
                    if (s.day && s.time && !studentSchedules.some(existing => existing.day === s.day && existing.time === s.time)) {
                        studentSchedules.push({ day: s.day, time: s.time });
                    }
                });
            }
        });

        // لو مفيش قائمة، هنفحص لو متسجل كقيمة مفردة
        if (studentSchedules.length === 0 && student.day && student.time) {
            studentSchedules.push({ day: student.day, time: student.time });
        }

        // تفريغ كل المواعيد اللي لقيناها للطالب ده في الجدول الرئيسي
        studentSchedules.forEach(sched => {
            autoScheduleItems.push({
                day: sched.day, 
                time: sched.time, 
                title: student.name, 
                gender: student.gender, 
                sessionsCount: studentSessionsCount
            });
        });
    });

    // ترتيب المواعيد تصاعدياً
    autoScheduleItems.sort((a, b) => (a.time || "").localeCompare(b.time || ""));

    // بناء أعمدة الجدول
    let daysHtml = allDays.map((day, index) => {
      let dayItems = autoScheduleItems.filter(item => item.day === day);

      let itemsHtml = dayItems.map((item, idx) => {
         let isFemale = item.gender === 'girl' || item.gender === 'female';
         let genderIcon = isFemale
            ? `<i class="ph-bold ph-gender-female" style="color: #ec4899; font-size: 16px;"></i>`
            : `<i class="ph-bold ph-gender-male" style="color: #3b82f6; font-size: 16px;"></i>`;

         return `
           <div style="display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 15px 0;">
              <div style="border: 2px solid #6ee7b7; background: #ecfdf5; border-radius: 30px; padding: 4px 20px; font-weight: 900; font-size: 14px; color: #047857; letter-spacing: 1px; direction: ltr;">
                 ${formatTime(item.time)}
              </div>
              <div style="font-weight: 900; font-size: 14px; color: var(--text-primary); text-align: center; line-height: 1.4;">
                 ${item.title.split(' ').slice(0, 2).join(' ')} ${genderIcon}
              </div>
              <div style="font-size: 12px; color: #94a3b8; font-weight: bold;">
                 ${item.sessionsCount} حصة
              </div>
           </div>
           ${idx < dayItems.length - 1 ? `<hr style="border: 0; border-top: 1px dashed #cbd5e1; width: 70%; margin: 0 auto;" />` : ''}
         `;
      }).join('');

      if (dayItems.length === 0) {
          itemsHtml = `<div style="text-align:center; padding:30px 0; color:#94a3b8; font-size:12px; font-weight:bold;">لا توجد حلقات</div>`;
      }

      let borderStyle = index !== 0 ? 'border-right: 1px solid #e2e8f0;' : '';

      return `
        <div style="flex: 1; min-width: 130px; display: flex; flex-direction: column; background: #fff; ${borderStyle}">
           <div style="background: #f8fafc; padding: 15px 10px; text-align: center; border-bottom: 2px solid var(--emerald);">
               <div style="font-weight: 900; color: var(--emerald-dark); font-size: 16px;">${day}</div>
               <div style="color: #64748b; font-size: 12px; font-weight: bold; margin-top: 4px;">${dayItems.length} حلقة</div>
           </div>
           <div style="padding: 10px; display: flex; flex-direction: column;">
              ${itemsHtml}
           </div>
        </div>
      `;
    }).join('');

    return `
      <div style="border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; margin-bottom: 30px; background: #fff; direction: rtl;">
        
        <div style="background: #0B3D2E; padding: 25px 20px; text-align: center; color: white;">
           <h2 style="margin: 0; font-weight: 900; font-size: 24px; color: #fff;">الجدول الأسبوعي للحلقات</h2>
           <div style="margin-top: 8px; font-size: 14px; color: #a7f3d0; font-weight: bold;">
              إجمالي ${autoScheduleItems.length} حلقة مسجلة
           </div>
        </div>

        <div style="display: flex; overflow-x: auto; width: 100%;">
           ${daysHtml}
        </div>
      </div>
    `;
  };
})();
