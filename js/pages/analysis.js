(function () {
  let chartInstance = null;

  window.setAnalysisStudent = function (id) {
    appState.ui.analysisStudentId = id;
    router.render();
  };

  window.setAnalysisRange = function (range) {
    appState.ui.analysisRange = range;
    router.render();
  };

  window.showCertificate = function () {
    appState.ui.showCertificate = true;
    if (!appState.ui.certTheme) {
      appState.ui.certTheme = 'theme-default';
    }
    router.render();
  };

  window.hideCertificate = function () {
    appState.ui.showCertificate = false;
    router.render();
  };

  window.setCertificateTheme = function (theme) {
    appState.ui.certTheme = theme;
    router.render();
  };

  function filterSessionsByRange(sessions, range) {
    if (range === "all") return sessions;
    const now = Date.now();
    const limit = range === "week" ? 7 : 30;
    return sessions.filter((s) => new Date(s.date).getTime() >= now - limit * 86400000);
  }

  function buildChartData(sessions) {
    return sessions.slice(-20).map((s, i) => ({ label: i + 1, value: s.overall || 0 }));
  }

  function normalizeStudentSessions(sessions) {
    return sessions.map((s) => {
      if (s.participant && typeof s.participant.overall === "number") {
        return { ...s, overall: s.participant.overall };
      }
      return s;
    });
  }

  function renderCertificate(student, rangeLabel) {
    let isFemale = false;
    if (student.gender === 'girl' || student.gender === 'female') {
      isFemale = true;
    } else if (student.gender !== 'boy') {
      const firstName = student.name.split(' ')[0];
      if (firstName.endsWith('ة') || firstName.endsWith('اء') || firstName.endsWith('ى') || ['مريم', 'زينب', 'هند', 'سعاد', 'ريم', 'نور', 'فاطمة', 'عائشة', 'خديجة', 'آمنة', 'سارة', 'حفصة', 'رقية'].includes(firstName)) {
        isFemale = true;
      }
    }

    const genderSuffix = isFemale ? 'ها' : 'ه';
    const todayDate = formatArDate(new Date().toISOString());

    const defaultIntro = `تتقدم إدارة حلقات الصحبة والمعلم بخالص الشكر والتقدير إلى الطالب المتميز`;
    const defaultReason = `وذلك لتميز${genderSuffix} الواضح وتفوق${genderSuffix} في حفظ كتاب الله\nسائلين المولى عز وجل أن يجعل${genderSuffix} من أهل القرآن`;
    
    const introText = appState.ui.certIntroText !== undefined ? appState.ui.certIntroText : defaultIntro;
    const reasonText = appState.ui.certReasonText !== undefined ? appState.ui.certReasonText : defaultReason;
    const rewardAmount = appState.ui.certRewardAmount || "";

    // النظام الذكي لجلب مسار الصورة وتخطي مشاكل جيت هب
    let basePath = window.location.pathname;
    if (!basePath.endsWith('/')) {
        basePath = basePath.substring(0, basePath.lastIndexOf('/') + 1);
    }
    const imgPath = basePath + "js/pages/cert_template.jpg";

    return `
      <div style="width: 100%; display: flex; justify-content: center; overflow: hidden; background: #e2e8f0; padding: 20px 0; border-radius: 12px;">
        <div style="width: 1000px; height: 710px; transform: scale(0.60); transform-origin: top center; margin-bottom: -280px;">
          
          <div id="certificate-box" style="width: 1000px; height: 710px; position: relative; background-color: #fdfaf6; overflow: hidden; font-family: 'Cairo', sans-serif;">
            
            <img src="${imgPath}" crossorigin="anonymous" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; z-index: 0;" alt="Background Template" 
                 onerror="if(!this.dataset.tried) { this.dataset.tried=1; this.src='${basePath}js/pages/cert_template.jpeg'; } else if(this.dataset.tried=='1') { this.dataset.tried=2; this.src='${basePath}js/pages/cert_template.png'; } else if(this.dataset.tried=='2') { this.dataset.tried=3; this.src='${basePath}js/pages/cert_template.JPG'; }" />

            <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 10;">
              
              <div style="position: absolute; top: 34%; width: 100%; text-align: center;">
                <p style="font-size: 22px; color: #1c2b4d; font-weight: 800; margin: 0; padding: 0 10%; line-height: 1.5;">${introText.replace(/\n/g, '<br>')}</p>
              </div>

              <div style="position: absolute; top: 43%; width: 100%; text-align: center; display: flex; justify-content: center;">
                <div style="background: rgba(250, 248, 240, 0.65); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); border: 2px solid rgba(255, 255, 255, 0.9); border-radius: 14px; padding: 12px 60px; font-size: 42px; font-weight: 900; color: #0F9D7A; min-width: 350px; box-shadow: 0 8px 24px rgba(0,0,0,0.08), inset 0 0 12px rgba(255,255,255,0.6); text-shadow: 0px 1px 2px rgba(255,255,255,0.8);">
                  ${student.name}
                </div>
              </div>

              <div style="position: absolute; top: 56%; width: 100%; text-align: center;">
                ${reasonText ? `<p style="font-size: 20px; color: #2c3e50; font-weight: bold; line-height: 1.6; margin: 0; padding: 0 10%;">${reasonText.replace(/\n/g, '<br>')}</p>` : ''}
              </div>

              <div style="position: absolute; top: 68%; left: 50%; transform: translateX(-50%); text-align: center; width: 100%;">
                ${rewardAmount ? `
                  <div style="display: inline-flex; align-items: center; gap: 8px;">
                    <div style="font-size: 38px; line-height: 1; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));">💰</div>
                    <div style="background: linear-gradient(135deg, #d4af37, #b58d22); border-radius: 30px; padding: 6px 30px; color: #fff; font-weight: 900; font-size: 24px; box-shadow: 0 4px 10px rgba(212, 175, 55, 0.4);">
                      مكافأة: ${rewardAmount} جنيهاً
                    </div>
                  </div>
                ` : ''}
              </div>

              <div style="position: absolute; bottom: 12%; right: 12%; text-align: center; color: #1e293b;">
                <div style="font-weight: bold; font-size: 18px; margin-bottom: 5px; color: #2b5641;">توقيع المعلم</div>
                <div style="font-weight: 800; font-size: 17px;">${appState.settings.teacherName}</div>
                <div style="border-top: 2px solid #d4af37; width: 120px; margin: 5px auto 0;"></div>
              </div>

              <div style="position: absolute; bottom: 12%; left: 12%; text-align: center; color: #1e293b;">
                <div style="font-weight: bold; font-size: 18px; margin-bottom: 5px; color: #2b5641;">توقيع الإدارة</div>
                <div style="font-weight: 800; font-size: 17px;">إدارة حلقات الصحبة</div>
                <div style="border-top: 2px solid #d4af37; width: 120px; margin: 5px auto 0;"></div>
              </div>

            </div>
          </div>
        </div>
      </div>
    `;
  }

  window.exportCertificateImage = async function () {
    const el = document.getElementById("certificate-box");
    if (!el) return;
    await exportElementAsImage(el, "certificate.png");
  };

  window.exportCertificatePdf = async function () {
    const el = document.getElementById("certificate-box");
    if (!el) return;
    await exportElementAsPdf(el, "certificate.pdf");
  };

  window.exportCertificateGif = async function () {
    const el = document.getElementById("certificate-box");
    if (!el) return;
    await exportElementAsGif(el, "certificate.gif");
  };

  window.renderAnalysisPage = function () {
    const selectedId = appState.ui.analysisStudentId;
    const student = selectedId === "all" ? null : appState.students.find((s) => s.id === selectedId);

    const baseSessions = selectedId === "all"
      ? appState.sessions
      : normalizeStudentSessions(getStudentSessions(selectedId)).sort(
        (a, b) => new Date(a.date) - new Date(b.date)
      );

    const targetSessions = filterSessionsByRange(baseSessions, appState.ui.analysisRange);
    const data = buildChartData(targetSessions);

    let weeklyAvg = 0;
    let monthlyAvg = 0;
    let isFemale = false;
    
    if (student) {
      const now = Date.now();
      const weekSessions = baseSessions.filter((s) => new Date(s.date).getTime() >= now - 7 * 86400000);
      const monthSessions = baseSessions.filter((s) => new Date(s.date).getTime() >= now - 30 * 86400000);
      const calc = (arr) => arr.length ? arr.reduce((sum, s) => sum + (s.overall || 0), 0) / arr.length : 0;
      weeklyAvg = calc(weekSessions);
      monthlyAvg = calc(monthSessions);

      if (student.gender === 'girl' || student.gender === 'female') {
        isFemale = true;
      } else if (student.gender !== 'boy') {
        const firstName = student.name.split(' ')[0];
        if (firstName.endsWith('ة') || firstName.endsWith('اء') || firstName.endsWith('ى') || ['مريم', 'زينب', 'هند', 'سعاد', 'ريم', 'نور', 'فاطمة', 'عائشة', 'خديجة', 'آمنة', 'سارة', 'حفصة', 'رقية'].includes(firstName)) {
          isFemale = true;
        }
      }
    }

    const genderSuffix = isFemale ? 'ها' : 'ه';
    const defaultIntro = `تتقدم إدارة حلقات الصحبة والمعلم بخالص الشكر والتقدير إلى الطالب المتميز`;
    const defaultReason = `وذلك لتميز${genderSuffix} الواضح وتفوق${genderSuffix} في حفظ كتاب الله\nسائلين المولى عز وجل أن يجعل${genderSuffix} من أهل القرآن`;

    const showReward = student && (weeklyAvg >= 4 || monthlyAvg >= 4.5);
    const totalSessions = targetSessions.length;
    const avgRating = totalSessions ? (targetSessions.reduce((s, t) => s + (t.overall || 0), 0) / totalSessions).toFixed(1) : "0";
    const quranSessions = targetSessions.filter(s => s.sessionType !== "islamic").length;
    const islamicSessions = targetSessions.filter(s => s.sessionType === "islamic").length;

    return `
      <div>
        <div class="d-flex align-items-center gap-3 mb-5">
          <div style="width:40px;height:40px;border-radius:var(--r-md);background:var(--emerald-bg);display:flex;align-items:center;justify-content:center;">
            <i class="ph-duotone ph-chart-line-up" style="font-size: 20px; color: var(--emerald)"></i>
          </div>
          <div>
            <div style="font-weight:var(--fw-bold);font-size:var(--fs-lg);color:var(--text-primary);">تحليل الأداء</div>
            <div style="font-size:var(--fs-xs);color:var(--text-muted);">تتبع التقدم وقياس الإنجاز</div>
          </div>
        </div>

        <div class="card-soft mb-4">
          <div class="d-flex gap-3 mb-3" style="flex-wrap:wrap;">
            <select class="form-select" style="flex:1;min-width:180px;" onchange="setAnalysisStudent(this.value)">
              <option value="all" ${selectedId === "all" ? "selected" : ""}>جميع الطلاب</option>
              ${appState.students.map((s) => `<option value="${s.id}" ${s.id === selectedId ? "selected" : ""}>${s.name}</option>`).join("")}
            </select>
            <div class="d-flex gap-2">
              <button class="btn ${appState.ui.analysisRange === "week" ? "btn-primary" : "btn-outline"}" onclick="setAnalysisRange('week')">أسبوع</button>
              <button class="btn ${appState.ui.analysisRange === "month" ? "btn-primary" : "btn-outline"}" onclick="setAnalysisRange('month')">شهر</button>
              <button class="btn ${appState.ui.analysisRange === "all" ? "btn-primary" : "btn-outline"}" onclick="setAnalysisRange('all')">الكل</button>
            </div>
          </div>
        </div>

        ${data.length > 0 ? `
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:var(--sp-4);margin-bottom:var(--sp-5);">
          <div class="card-soft hover-elevation" style="text-align:center;padding:var(--sp-4);">
            <div style="font-size:var(--fs-2xl);font-weight:var(--fw-black);color:var(--emerald-dark);">${totalSessions}</div>
            <div style="font-size:var(--fs-xs);color:var(--text-muted);font-weight:600;">إجمالي الجلسات</div>
          </div>
          <div class="card-soft hover-elevation" style="text-align:center;padding:var(--sp-4);">
            <div style="font-size:var(--fs-2xl);font-weight:var(--fw-black);color:var(--gold);">${avgRating}</div>
            <div style="font-size:var(--fs-xs);color:var(--text-muted);font-weight:600;">متوسط التقييم</div>
          </div>
          <div class="card-soft hover-elevation" style="text-align:center;padding:var(--sp-4);">
            <div style="font-size:var(--fs-2xl);font-weight:var(--fw-black);color:var(--emerald);">${quranSessions}</div>
            <div style="font-size:var(--fs-xs);color:var(--text-muted);font-weight:600;">حلقات قرآن</div>
          </div>
          <div class="card-soft hover-elevation" style="text-align:center;padding:var(--sp-4);">
            <div style="font-size:var(--fs-2xl);font-weight:var(--fw-black);color:#0B3D2E;">${islamicSessions}</div>
            <div style="font-size:var(--fs-xs);color:var(--text-muted);font-weight:600;">حلقات تربية</div>
          </div>
        </div>

        <div class="card-soft mb-4">
          <div style="font-weight:var(--fw-bold);color:var(--text-primary);margin-bottom:var(--sp-3);">معدل الإنجاز</div>
          <div style="height:260px;">
            <canvas id="analysis-chart"></canvas>
          </div>
        </div>
        ` : ""}

        ${showReward ? `
          <div class="card-soft mb-4" style="background:var(--emerald-bg);border-color:rgba(15,157,122,0.15);">
            <div style="font-weight:var(--fw-bold);margin-bottom:var(--sp-3);color:var(--emerald-dark);"><i class="ph-duotone ph-confetti" style="margin-left:4px;"></i>أداء متميز</div>
            <button class="btn btn-primary w-100" onclick="showCertificate()">إصدار شهادة تفوق</button>
          </div>
        ` : ""}

        ${appState.ui.showCertificate && student ? `
          <div class="certificate-studio-wrapper card-soft mb-4" style="padding: 0; overflow: hidden; display: flex; flex-wrap: wrap; border: 1px solid var(--color-border-strong);">
            
            <div class="studio-sidebar" style="flex: 1 1 250px; max-width: 320px; background: #F8FAFC; border-left: 1px solid var(--color-border); display: flex; flex-direction: column; min-height: 500px;">
              
              <div style="padding: 20px; border-bottom: 1px solid var(--color-border); background: #fff;">
                <h3 style="margin: 0; font-size: 16px; font-weight: bold; color: var(--color-primary-800);">🎨 إعدادات الشهادة</h3>
              </div>

              <div style="padding: 20px; border-bottom: 1px solid var(--color-border); background: #fefce8;">
                <label style="font-size: 13px; font-weight: bold; color: #854d0e; display: block; margin-bottom: 5px;">النص العلوي (المقدمة)</label>
                <textarea class="form-control" style="font-size: 12px; min-height: 50px; margin-bottom: 15px; border-color: #fde047;" placeholder="..." onchange="appState.ui.certIntroText = this.value; router.render();">${appState.ui.certIntroText !== undefined ? appState.ui.certIntroText : defaultIntro}</textarea>

                <label style="font-size: 13px; font-weight: bold; color: #854d0e; display: block; margin-bottom: 5px;">النص السفلي (سبب التكريم والدعاء)</label>
                <textarea class="form-control" style="font-size: 12px; min-height: 60px; margin-bottom: 15px; border-color: #fde047;" placeholder="..." onchange="appState.ui.certReasonText = this.value; router.render();">${appState.ui.certReasonText !== undefined ? appState.ui.certReasonText : defaultReason}</textarea>

                <label style="font-size: 13px; font-weight: bold; color: #854d0e; display: block; margin-bottom: 5px;">المكافأة المالية ج.م (اختياري)</label>
                <input type="number" class="form-control" style="border-color: #fde047; font-weight: bold;" placeholder="مثال: 50 (اتركه فارغ للإخفاء)" value="${appState.ui.certRewardAmount || ''}" onchange="appState.ui.certRewardAmount = this.value; router.render();" />
              </div>

              <div style="padding: 20px; border-top: 1px solid var(--color-border); background: #fff; display: flex; flex-direction: column; gap: 10px; margin-top: auto;">
                <button class="btn btn-primary w-100" onclick="exportCertificateImage()"><i class="ph-duotone ph-image" style="margin-left:4px;"></i>تحميل كصورة</button>
                <button class="btn btn-gold w-100" onclick="exportCertificatePdf()"><i class="ph-duotone ph-file-pdf" style="margin-left:4px;"></i>تحميل PDF</button>
                <button class="btn btn-outline-danger w-100" onclick="hideCertificate()">إغلاق الاستوديو</button>
              </div>
            </div>

            <div class="studio-preview" style="flex: 1 1 500px; min-width: 0; padding: 40px 20px; background: #e2e8f0; overflow: auto; display: flex; justify-content: center; align-items: center;">
                 ${renderCertificate(student, monthlyAvg >= 4.5 ? "الشهر" : "الأسبوع")}
            </div>

          </div>
        ` : ""}
      </div>
    `;
  };

  window.initAnalysisPage = function () {
    const canvas = document.getElementById("analysis-chart");
    if (!canvas) return;

    const selectedId = appState.ui.analysisStudentId;
    const baseSessions = selectedId === "all"
      ? appState.sessions
      : normalizeStudentSessions(getStudentSessions(selectedId)).sort(
        (a, b) => new Date(a.date) - new Date(b.date)
      );

    const targetSessions = filterSessionsByRange(baseSessions, appState.ui.analysisRange);
    const data = buildChartData(targetSessions);

    if (chartInstance) {
      chartInstance.destroy();
    }

    const ctx = canvas.getContext("2d");
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.parentElement.clientHeight);
    gradient.addColorStop(0, "rgba(15, 157, 122, 0.4)");
    gradient.addColorStop(1, "rgba(15, 157, 122, 0.0)");

    chartInstance = new Chart(canvas, {
      type: "line",
      data: {
        labels: data.map((d) => d.label),
        datasets: [
          {
            label: "التقييم",
            data: data.map((d) => d.value),
            borderColor: "#0F9D7A",
            backgroundColor: gradient,
            borderWidth: 3,
            tension: 0.4,
            fill: true,
            pointBackgroundColor: "#FFFFFF",
            pointBorderColor: "#0F9D7A",
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 8,
            pointHoverBackgroundColor: "#D4AF37",
            pointHoverBorderColor: "#FFFFFF",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 1500, easing: 'easeOutQuart' },
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(255,255,255,0.95)',
            titleColor: '#0B3D2E',
            bodyColor: '#0F9D7A',
            borderColor: 'rgba(15,157,122,0.1)',
            borderWidth: 1,
            padding: 12,
            boxPadding: 6,
            usePointStyle: true,
            titleFont: { family: 'Cairo', size: 14, weight: 'bold' },
            bodyFont: { family: 'Cairo', size: 14 },
            displayColors: false,
          }
        },
        scales: {
          y: {
            min: 0, max: 5,
            grid: { color: "rgba(15,157,122,0.05)", drawBorder: false },
            ticks: { font: { family: "Cairo" }, color: '#94A3B8' },
          },
          x: {
            grid: { display: false, drawBorder: false },
            ticks: { font: { family: "Cairo" }, color: '#94A3B8' },
          },
        },
      },
    });
  };
})();
