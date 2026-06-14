(function () {
  // دالة تأمين المتغيرات عشان ميعملش Error لو اشتغل قبل أي ملف تاني
  function initScheduleState() {
    if (!window.appState) window.appState = {};
    if (!window.appState.schedule) window.appState.schedule = [];
  }

  // 2. دالة إضافة موعد جديد للجدول
  window.addScheduleItem = function () {
    initScheduleState();
    const day = document.getElementById('sched-day').value;
    const time = document.getElementById('sched-time').value;
    const title = document.getElementById('sched-title').value;

    if (!day || !time || !title) {
      alert('⚠️ يرجى إدخال جميع البيانات (اليوم، الوقت، واسم الحلقة)');
      return;
    }

    // إضافة الموعد الجديد
    window.appState.schedule.push({
      id: Date.now(),
      day: day,
      time: time,
      title: title
    });

    // ترتيب المواعيد تلقائياً تصاعدياً حسب الوقت
    window.appState.schedule.sort((a, b) => a.time.localeCompare(b.time));
    
    if (typeof saveData === 'function') saveData(); // حفظ الداتا في الـ LocalStorage
    router.render(); // تحديث الصفحة لرؤية التغيير فوراً
  };

  // 3. دالة حذف موعد من الجدول
  window.deleteScheduleItem = function (id) {
    initScheduleState();
    if(confirm('هل أنت متأكد من حذف هذا الموعد؟')) {
      window.appState.schedule = window.appState.schedule.filter(item => item.id !== id);
      if (typeof saveData === 'function') saveData();
      router.render();
    }
  };

  // 4. دالة رسم واجهة الجدول الأسبوعي
  window.renderSchedulePage = function () {
    initScheduleState(); // التأكد إن البيانات موجودة قبل الرسم

    // أيام الأسبوع (بترتيب مصر/الدول العربية)
    const days = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

    // بناء الأعمدة لكل يوم
    let daysHtml = days.map(day => {
      // فلترة مواعيد هذا اليوم فقط
      const dayItems = window.appState.schedule.filter(item => item.day === day);
      
      // بناء كروت المواعيد جوا اليوم
      let itemsHtml = dayItems.map(item => `
        <div style="background: #fff; border-right: 4px solid var(--emerald); padding: 12px; margin-bottom: 10px; border-radius: 6px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); position: relative; transition: transform 0.2s;">
          <div style="font-weight: 800; color: var(--text-primary); font-size: 14px; margin-bottom: 4px; padding-left: 20px;">${item.title}</div>
          <div style="color: var(--emerald-dark); font-size: 13px; font-weight: bold; display: flex; align-items: center; gap: 4px;">
            <i class="ph-duotone ph-clock"></i> ${item.time}
          </div>
          <button onclick="deleteScheduleItem(${item.id})" style="position: absolute; top: 10px; left: 10px; background: none; border: none; color: #ef4444; cursor: pointer; padding: 5px; border-radius: 4px; transition: background 0.2s;" onmouseover="this.style.background='#fee2e2'" onmouseout="this.style.background='none'">
            <i class="ph-duotone ph-trash" style="font-size: 16px;"></i>
          </button>
        </div>
      `).join('');

      // رسالة في حالة اليوم الفاضي
      if (dayItems.length === 0) {
        itemsHtml = `
          <div style="text-align: center; color: var(--text-muted); font-size: 13px; padding: 20px 0; background: rgba(255,255,255,0.5); border-radius: 6px; border: 1px dashed var(--color-border);">
            لا توجد حلقات
          </div>`;
      }

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
            <div style="font-size:var(--fs-xs);color:var(--text-muted);">إدارة مواعيد الحلقات والمجموعات</div>
          </div>
        </div>

        <div class="card-soft mb-4">
          <h3 style="font-size: 15px; font-weight: 800; margin-bottom: 15px; color: var(--text-primary);">
            <i class="ph-duotone ph-plus-circle" style="color: var(--emerald); margin-left: 5px;"></i>إضافة حلقة جديدة
          </h3>
          <div style="display: flex; gap: 15px; flex-wrap: wrap; align-items: flex-end;">
            
            <div style="flex: 1; min-width: 150px;">
              <label style="display: block; font-size: 13px; font-weight: bold; margin-bottom: 5px; color: var(--text-muted);">اليوم</label>
              <select id="sched-day" class="form-control" style="cursor: pointer;">
                ${days.map(d => `<option value="${d}">${d}</option>`).join('')}
              </select>
            </div>
            
            <div style="flex: 1; min-width: 150px;">
              <label style="display: block; font-size: 13px; font-weight: bold; margin-bottom: 5px; color: var(--text-muted);">الوقت</label>
              <input type="time" id="sched-time" class="form-control">
            </div>
            
            <div style="flex: 2; min-width: 200px;">
              <label style="display: block; font-size: 13px; font-weight: bold; margin-bottom: 5px; color: var(--text-muted);">اسم الحلقة / المجموعة</label>
              <input type="text" id="sched-title" class="form-control" placeholder="مثال: مجموعة التجويد - الكبار">
            </div>
            
            <div>
              <button class="btn btn-primary" onclick="addScheduleItem()" style="height: 42px;">
                <i class="ph-duotone ph-plus"></i> حفظ الموعد
              </button>
            </div>
            
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 15px;">
          ${daysHtml}
        </div>

      </div>
    `;
  };
})();
