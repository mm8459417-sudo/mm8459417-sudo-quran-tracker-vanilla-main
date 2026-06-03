(function () {
  const SURAH_LIST = [
    { name: "الفاتحة", ayahs: 7 },
    { name: "البقرة", ayahs: 286 },
    { name: "آل عمران", ayahs: 200 },
    { name: "النساء", ayahs: 176 },
    { name: "المائدة", ayahs: 120 },
    { name: "الأنعام", ayahs: 165 },
    { name: "الأعراف", ayahs: 206 },
    { name: "الأنفال", ayahs: 75 },
    { name: "التوبة", ayahs: 129 },
    { name: "يونس", ayahs: 109 },
    { name: "هود", ayahs: 123 },
    { name: "يوسف", ayahs: 111 },
    { name: "الرعد", ayahs: 43 },
    { name: "إبراهيم", ayahs: 52 },
    { name: "الحجر", ayahs: 99 },
    { name: "النحل", ayahs: 128 },
    { name: "الإسراء", ayahs: 111 },
    { name: "الكهف", ayahs: 110 },
    { name: "مريم", ayahs: 98 },
    { name: "طه", ayahs: 135 },
    { name: "الأنبياء", ayahs: 112 },
    { name: "الحج", ayahs: 78 },
    { name: "المؤمنون", ayahs: 118 },
    { name: "النور", ayahs: 64 },
    { name: "الفرقان", ayahs: 77 },
    { name: "الشعراء", ayahs: 227 },
    { name: "النمل", ayahs: 93 },
    { name: "القصص", ayahs: 88 },
    { name: "العنكبوت", ayahs: 69 },
    { name: "الروم", ayahs: 60 },
    { name: "لقمان", ayahs: 34 },
    { name: "السجدة", ayahs: 30 },
    { name: "الأحزاب", ayahs: 73 },
    { name: "سبأ", ayahs: 54 },
    { name: "فاطر", ayahs: 45 },
    { name: "يس", ayahs: 83 },
    { name: "الصافات", ayahs: 182 },
    { name: "ص", ayahs: 88 },
    { name: "الزمر", ayahs: 75 },
    { name: "غافر", ayahs: 85 },
    { name: "فصلت", ayahs: 54 },
    { name: "الشورى", ayahs: 53 },
    { name: "الزخرف", ayahs: 89 },
    { name: "الدخان", ayahs: 59 },
    { name: "الجاثية", ayahs: 37 },
    { name: "الأحقاف", ayahs: 35 },
    { name: "محمد", ayahs: 38 },
    { name: "الفتح", ayahs: 29 },
    { name: "الحجرات", ayahs: 18 },
    { name: "ق", ayahs: 45 },
    { name: "الذاريات", ayahs: 60 },
    { name: "الطور", ayahs: 49 },
    { name: "النجم", ayahs: 62 },
    { name: "القمر", ayahs: 55 },
    { name: "الرحمن", ayahs: 78 },
    { name: "الواقعة", ayahs: 96 },
    { name: "الحديد", ayahs: 29 },
    { name: "المجادلة", ayahs: 22 },
    { name: "الحشر", ayahs: 24 },
    { name: "الممتحنة", ayahs: 13 },
    { name: "الصف", ayahs: 14 },
    { name: "الجمعة", ayahs: 11 },
    { name: "المنافقون", ayahs: 11 },
    { name: "التغابن", ayahs: 18 },
    { name: "الطلاق", ayahs: 12 },
    { name: "التحريم", ayahs: 12 },
    { name: "الملك", ayahs: 30 },
    { name: "القلم", ayahs: 52 },
    { name: "الحاقة", ayahs: 52 },
    { name: "المعارج", ayahs: 44 },
    { name: "نوح", ayahs: 28 },
    { name: "الجن", ayahs: 28 },
    { name: "المزمل", ayahs: 20 },
    { name: "المدثر", ayahs: 56 },
    { name: "القيامة", ayahs: 40 },
    { name: "الإنسان", ayahs: 31 },
    { name: "المرسلات", ayahs: 50 },
    { name: "النبأ", ayahs: 40 },
    { name: "النازعات", ayahs: 46 },
    { name: "عبس", ayahs: 42 },
    { name: "التكوير", ayahs: 29 },
    { name: "الانفطار", ayahs: 19 },
    { name: "المطففين", ayahs: 36 },
    { name: "الانشقاق", ayahs: 25 },
    { name: "البروج", ayahs: 22 },
    { name: "الطارق", ayahs: 17 },
    { name: "الأعلى", ayahs: 19 },
    { name: "الغاشية", ayahs: 26 },
    { name: "الفجر", ayahs: 30 },
    { name: "البلد", ayahs: 20 },
    { name: "الشمس", ayahs: 15 },
    { name: "الليل", ayahs: 21 },
    { name: "الضحى", ayahs: 11 },
    { name: "الشرح", ayahs: 8 },
    { name: "التين", ayahs: 8 },
    { name: "العلق", ayahs: 19 },
    { name: "القدر", ayahs: 5 },
    { name: "البينة", ayahs: 8 },
    { name: "الزلزلة", ayahs: 8 },
    { name: "العاديات", ayahs: 11 },
    { name: "القارعة", ayahs: 11 },
    { name: "التكاثر", ayahs: 8 },
    { name: "العصر", ayahs: 3 },
    { name: "الهمزة", ayahs: 9 },
    { name: "الفيل", ayahs: 5 },
    { name: "قريش", ayahs: 4 },
    { name: "الماعون", ayahs: 7 },
    { name: "الكوثر", ayahs: 3 },
    { name: "الكافرون", ayahs: 6 },
    { name: "النصر", ayahs: 3 },
    { name: "المسد", ayahs: 5 },
    { name: "الإخلاص", ayahs: 4 },
    { name: "الفلق", ayahs: 5 },
    { name: "الناس", ayahs: 6 },
  ];

  const RATINGS = ["ممتاز", "جيد جداً", "جيد", "يحتاج مراجعة"];
  const TAJWEED = [
    "الإدغام",
    "الإخفاء",
    "الإقلاب",
    "الغنة",
    "المدود",
    "الوقف والابتداء",
    "أخرى",
  ];

  const ISLAMIC_CATEGORIES = [
    {
      id: "asma",
      label: "أسماء الله الحسنى",
      fields: [
        { key: "name", label: "الاسم", placeholder: "مثال: الرحمن" },
        { key: "notes", label: "الشرح", placeholder: "معاني الاسم..." },
      ],
    },
    {
      id: "hadith",
      label: "حديث",
      fields: [
        { key: "text", label: "نص الحديث", placeholder: "نص الحديث الشريف..." },
        { key: "notes", label: "الشرح", placeholder: "شرح الحديث..." },
      ],
    },
    {
      id: "prophet",
      label: "قصص أنبياء",
      fields: [
        { key: "name", label: "اسم النبي", placeholder: "مثال: نوح عليه السلام" },
        { key: "lessons", label: "الدروس المستفادة", placeholder: "العبر والدروس..." },
      ],
    },
    {
      id: "aqida",
      label: "عقيدة",
      fields: [
        { key: "title", label: "اسم الدرس", placeholder: "مثال: الإيمان بالملائكة" },
        { key: "notes", label: "الشرح", placeholder: "شرح مبسط..." },
      ],
    },
    {
      id: "tawhid",
      label: "توحيد",
      fields: [
        { key: "title", label: "اسم الدرس", placeholder: "مثال: توحيد الألوهية" },
        { key: "notes", label: "الشرح", placeholder: "شرح مبسط..." },
      ],
    },
    {
      id: "tazkiya",
      label: "تزكية",
      fields: [
        { key: "title", label: "الموضوع", placeholder: "مثال: الصدق" },
        { key: "notes", label: "الشرح", placeholder: "الأثر والسلوك..." },
      ],
    },
    {
      id: "story",
      label: "قصة وعبرة",
      fields: [
        { key: "title", label: "عنوان القصة", placeholder: "عنوان القصة..." },
        { key: "lesson", label: "العبرة", placeholder: "العبرة المستفادة..." },
      ],
    },
    {
      id: "sahabi",
      label: "صحابي / صحابية",
      fields: [
        { key: "name", label: "الاسم", placeholder: "مثال: عمر بن الخطاب" },
        { key: "notes", label: "الصفات", placeholder: "أبرز الصفات..." },
      ],
    },
    {
      id: "seerah",
      label: "السيرة",
      fields: [
        { key: "title", label: "عنوان الدرس", placeholder: "مثال: الهجرة" },
        { key: "notes", label: "التفاصيل", placeholder: "تفاصيل الدرس..." },
      ],
    },
  ];

  function ensureSessionForm() {
    if (!appState.ui.sessionForm) {
      appState.ui.sessionForm = {
        scope: appState.ui.sessionScope || "individual",
        sessionType: "quran",
        studentId: "",
        groupId: "",
        sessionNumber: 0, // إضافة متغير لحفظ رقم الجلسة بالـ state
        date: new Date().toISOString().split("T")[0],
        quran: {
          hifz: { surah: "", from: "", to: "", rating: "", tajweed: [], notes: "" },
          recent: { surah: "", from: "", to: "", rating: "", tajweed: [], notes: "" },
          distant: { surah: "", from: "", to: "", rating: "", tajweed: [], notes: "" },
          tadabbur: { surah: "", from: "", to: "", attention: 0, interaction: 0 },
          closing: {
            overall: 0,
            achievement: 0,
            homework: {
              new: { surah: "", from: "", to: "" },
              recent: { surah: "", from: "", to: "" },
              distant: { surah: "", from: "", to: "" },
            },
            homeworkNotes: "",
          },
        },
        islamic: {
          categories: [],
          behavior: { attention: 0, interaction: 0 },
          homework: [],
        },
        group: {
          sync: true,
          rows: {},
        },
      };
    }
    return appState.ui.sessionForm;
  }

  function updateFormPath(path, value) {
    const form = ensureSessionForm();
    const parts = path.split(".");
    let obj = form;
    for (let i = 0; i < parts.length - 1; i += 1) {
      const key = parts[i];
      if (!obj[key]) obj[key] = {};
      obj = obj[key];
    }
    obj[parts[parts.length - 1]] = value;
  }

  function renderStars(path, value) {
    return `
      <div class="rating-stars">
        ${[1, 2, 3, 4, 5]
          .map(
            (i) => `<span class="star ${i <= value ? "" : "inactive"}" onclick="setStar('${path}', ${i})">⭐</span>`
          )
          .join("")}
        <span class="star inactive" onclick="setStar('${path}', 0)">✖</span>
      </div>
    `;
  }

  function findSurahAyahs(name) {
    const surah = SURAH_LIST.find((s) => s.name === name);
    return surah ? surah.ayahs : null;
  }

  function ensureGroupRows(groupMembers) {
    const form = ensureSessionForm();
    if (!form.group.rows) form.group.rows = {};
    groupMembers.forEach((m) => {
      if (!form.group.rows[m.id]) {
        form.group.rows[m.id] = {
          present: true,
          overridePackageNum: "",
          hifz: { from: "", to: "", rating: "" },
          recent: { from: "", to: "", rating: "" },
          distant: { from: "", to: "", rating: "" },
        };
      }
    });
  }

  function syncIslamicHomework(form) {
    const existing = form.islamic.homework || [];
    const byType = new Map(existing.map((h) => [h.type, h]));
    const updated = form.islamic.categories.map((c) => {
      if (byType.has(c.type)) return byType.get(c.type);
      return { id: `hw-${Date.now()}-${Math.random().toString(36).slice(2)}`, type: c.type, data: {} };
    });
    form.islamic.homework = updated;
  }

  window.setStar = function (path, value) {
    updateFormPath(path, value);
    router.render();
  };

  window.updateFormPath = function (path, value) {
    updateFormPath(path, value);
  };

  window.setSessionScope = function (scope) {
    appState.ui.sessionScope = scope;
    appState.ui.selectedStudentId = "";
    appState.ui.selectedGroupId = "";
    appState.ui.sessionForm = null;
    router.render();
  };

  window.updateSearchQuery = function (value) {
    appState.ui.searchQuery = value;
    router.render();
  };

  window.updateSearchGender = function (value) {
    appState.ui.searchGender = value;
    router.render();
  };

  window.selectStudent = function (id) {
    const form = ensureSessionForm();
    appState.ui.sessionScope = "individual";
    appState.ui.selectedStudentId = id;
    appState.ui.selectedGroupId = "";
    form.scope = "individual";
    form.studentId = id;
    form.sessionNumber = 0; // تصفير لتوليده تلقائياً بناء على حقول الطالب المحدثة
    router.render();
  };

  window.selectGroup = function (id) {
    const form = ensureSessionForm();
    appState.ui.sessionScope = "group";
    appState.ui.selectedGroupId = id;
    appState.ui.selectedStudentId = "";
    form.scope = "group";
    form.groupId = id;
    router.render();
  };

  window.clearSelection = function () {
    appState.ui.selectedStudentId = "";
    appState.ui.selectedGroupId = "";
    appState.ui.sessionForm = null;
    router.render();
  };

  window.toggleTajweed = function (section, item, checked) {
    const form = ensureSessionForm();
    const list = form.quran[section].tajweed;
    if (checked) {
      if (!list.includes(item)) list.push(item);
    } else {
      form.quran[section].tajweed = list.filter((t) => t !== item);
    }
  };

  window.toggleGroupPresence = function (studentId, checked) {
    const form = ensureSessionForm();
    if (!form.group.rows[studentId]) return;
    form.group.rows[studentId].present = checked;
    router.render();
  };

  window.updateGroupRow = function (studentId, section, field, value) {
    const form = ensureSessionForm();
    if (!form.group.rows[studentId]) return;
    if (!form.group.rows[studentId][section]) form.group.rows[studentId][section] = {};
    form.group.rows[studentId][section][field] = value;
  };

  window.updateGroupPackageOverride = function (studentId, value) {
    const form = ensureSessionForm();
    if (!form.group.rows[studentId]) return;
    form.group.rows[studentId].overridePackageNum = value;
  };

  window.toggleGroupSync = function (checked) {
    const form = ensureSessionForm();
    form.group.sync = checked;
    router.render();
  };

  window.addIslamicCategory = function (type) {
    const form = ensureSessionForm();
    const cat = ISLAMIC_CATEGORIES.find((c) => c.id === type);
    if (!cat) return;
    form.islamic.categories.push({
      id: `cat-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      type,
      data: {},
    });
    syncIslamicHomework(form);
    router.render();
  };

  window.updateIslamicCategory = function (id, field, value) {
    const form = ensureSessionForm();
    const block = form.islamic.categories.find((c) => c.id === id);
    if (!block) return;
    block.data[field] = value;
  };

  window.removeIslamicCategory = function (id) {
    const form = ensureSessionForm();
    form.islamic.categories = form.islamic.categories.filter((c) => c.id !== id);
    syncIslamicHomework(form);
    router.render();
  };

  window.updateIslamicHomework = function (id, field, value) {
    const form = ensureSessionForm();
    const block = form.islamic.homework.find((c) => c.id === id);
    if (!block) return;
    block.data[field] = value;
  };

  window.removeIslamicHomework = function (id) {
    const form = ensureSessionForm();
    form.islamic.homework = form.islamic.homework.filter((c) => c.id !== id);
    router.render();
  };

  function computeOverall(sessionType, form) {
    if (sessionType === "quran") return form.quran.closing.overall || 0;
    const b = form.islamic.behavior;
    if (!b) return 0;
    return b.attention + b.interaction > 0
      ? Math.round(((b.attention + b.interaction) / 2) * 10) / 10
      : 0;
  }

  function buildReportText(sessionData) {
    const lines = [];
    const title = sessionData.sessionType === "quran" ? "تقرير حلقة قرآن" : "تقرير تربية إسلامية";
    lines.push(title);
    lines.push(`المعلم: ${appState.settings.teacherName}`);
    lines.push(`التاريخ: ${sessionData.dateAr || formatArDate(sessionData.date)}`);

    if (sessionData.mode === "group") {
      lines.push(`المجموعة: ${sessionData.groupName || ""}`);
      const presentCount = sessionData.participants.filter((p) => p.present !== false).length;
      lines.push(`عدد الحضور: ${presentCount}`);
    } else {
      lines.push(`الطالب: ${sessionData.studentName || ""}`);
    }

    if (sessionData.sessionType === "quran") {
      if (sessionData.quran?.hifz?.surah) {
        lines.push(`التسميع: ${sessionData.quran.hifz.surah} (${sessionData.quran.hifz.from}-${sessionData.quran.hifz.to})`);
      }
      if (sessionData.quran?.recent?.surah) {
        lines.push(`قريب: ${sessionData.quran.recent.surah} (${sessionData.quran.recent.from}-${sessionData.quran.recent.to})`);
      }
      if (sessionData.quran?.distant?.surah) {
        lines.push(`بعيد: ${sessionData.quran.distant.surah} (${sessionData.quran.distant.from}-${sessionData.quran.distant.to})`);
      }
      // ✅ إصلاح مشكلة 3: إضافة التدبر في نص التقرير
      if (sessionData.quran?.tadabbur?.surah) {
        lines.push(`التدبر: سورة ${sessionData.quran.tadabbur.surah} (${sessionData.quran.tadabbur.from || ""}-${sessionData.quran.tadabbur.to || ""})`);
      }
      lines.push(`التقييم العام: ${sessionData.quran?.closing?.overall || 0} نجمة`);
    } else {
      sessionData.islamic?.categories?.forEach((c) => {
        lines.push(`- ${c.label || "درس"}: ${c.summary || ""}`);
      });
      lines.push(`التقييم السلوكي: ${sessionData.overall || 0}`);
    }

    return lines.join("\n");
  }

 window.sendReportWhatsApp = async function () {
    if (!appState.ui.report) return;
    
    const el = document.getElementById('session-report-box');
    if (!el) return;

    showToast("⏳ جاري تجهيز الصورة...");

    try {
      const canvas = await html2canvas(el, { scale: 2, useCORS: true });
      
      canvas.toBlob(async (blob) => {
        const file = new File([blob], "session-report.png", { type: "image/png" });

        // 1. محاولة المشاركة المباشرة (هتشتغل بامتياز على الموبايلات)
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: 'تقرير الجلسة'
            });
            return; // لو نجحت، اقفل الدالة
          } catch (shareErr) {
            console.log("تم إلغاء المشاركة:", shareErr);
          }
        } 
        
        // 2. الخطة البديلة للكمبيوتر (لو المتصفح رفض المشاركة المباشرة للملفات)
        try {
           const item = new ClipboardItem({ "image/png": blob });
           await navigator.clipboard.write([item]);
           
           showToast("✅ تم نسخ الصورة! (افتح الشات واضغط Paste أو Ctrl+V)");
           
           // هيفتحلك شاشة الواتساب اللي إنت متعود عليها عشان تختار الشخص وتعمل لصق
           setTimeout(() => {
              window.open(`https://wa.me/`, "_blank");
           }, 800);

        } catch (clipErr) {
           console.error("المتصفح يمنع النسخ التلقائي:", clipErr);
           showToast("❌ جهازك يمنع النسخ المباشر، استخدم زر 'حفظ صورة'.");
        }

      }, "image/png");

    } catch (err) {
      console.error("خطأ في توليد الصورة:", err);
      showToast("❌ فشل تجهيز الصورة.");
    }
  };

  window.closeReport = function () {
    appState.ui.report = null;
    appState.ui.sessionForm = null;
    appState.ui.selectedStudentId = "";
    appState.ui.selectedGroupId = "";
    showToast("✨ تم إنهاء الجلسة، تفضل باختيار طالب جديد");
    router.render();
  };

  window.editReportSession = function () {
    if (!appState.ui.report) return;
    const { data, id } = appState.ui.report;
    appState.ui.editSessionId = id;

    const form = ensureSessionForm();
    form.scope = data.mode === "group" ? "group" : "individual";
    form.studentId = data.studentId || "";
    form.groupId = data.groupId || "";
    form.date = data.date || form.date;
    form.sessionNumber = data.packageSessionNum || 1; // استرجاع رقم الجلسة للتعديل
    form.quran = data.quran || form.quran;
    form.islamic = data.islamic || form.islamic;
    form.group = data.groupForm || form.group;

    appState.ui.report = null;
    router.render();
  };

  window.saveSession = async function () {
    const form = ensureSessionForm();
    if (form.scope === "individual" && !form.studentId) {
      showToast("اختر طالباً أولاً");
      return;
    }
    if (form.scope === "group" && !form.groupId) {
      showToast("اختر مجموعة أولاً");
      return;
    }

    if (form.sessionType === "quran" && !form.quran.hifz.surah) {
      showToast("حدد سورة التسميع أولاً");
      return;
    }

    const overall = computeOverall(form.sessionType, form);
    let sessionData = {
      date: form.date,
      dateAr: formatArDate(form.date),
      sessionType: form.sessionType,
      mode: form.scope,
      overall,
    };

    if (form.scope === "individual") {
      const student = getStudentById(form.studentId);
      // ✅ إصلاح مشكلة 1: جعل التقرير يعتمد على رقم العداد المخزن في الـ State
      const packageSessionNum = parseInt(form.sessionNumber, 10) || 1;
      
      sessionData = {
        ...sessionData,
        studentId: form.studentId,
        studentName: student?.name || "",
        packageSessionNum, // حفظ الرقم المعدل يدوياً ليعرض بالتقرير والشيت
        quran: form.sessionType === "quran" ? form.quran : null,
        islamic: form.sessionType === "islamic" ? form.islamic : null,
      };
    } else {
      const group = getGroupById(form.groupId);
      const members = getGroupMembers(form.groupId);
      ensureGroupRows(members);

      const participants = members.map((m) => {
        const row = form.group.rows[m.id];
        const limit = m.sessionLimit || appState.settings.defaultLimit || 12;
        const nextNum = getNextPackageNum(m.id, limit);
        const present = row.present !== false;
        const currentCount = countStudentSessions(m.id);
        const fallbackNum = currentCount % limit || 0;
        const overrideNum = parseInt(row.overridePackageNum, 10);
        const packageSessionNum = Number.isNaN(overrideNum)
          ? present
            ? nextNum
            : fallbackNum
          : overrideNum;

        const pickSection = (key) => {
          if (form.group.sync) {
            return { from: form.quran[key].from, to: form.quran[key].to, rating: form.quran[key].rating };
          }
          return row[key];
        };

        return {
          studentId: m.id,
          studentName: m.name,
          present,
          packageSessionNum,
          overall,
          quran: form.sessionType === "quran" ? {
            hifz: pickSection("hifz"),
            recent: pickSection("recent"),
            distant: pickSection("distant"),
          } : null,
        };
      });

      sessionData = {
        ...sessionData,
        groupId: form.groupId,
        groupName: group?.name || "",
        participants,
        quran: form.sessionType === "quran" ? form.quran : null,
        islamic: form.sessionType === "islamic" ? form.islamic : null,
        groupForm: form.group,
      };
    }

    try {
      let saved = null;
      if (appState.ui.editSessionId) {
        await dbModule.updateSession(appState.ui.editSessionId, sessionData);
        saved = { ...sessionData, id: appState.ui.editSessionId };
        showToast("تم تحديث الجلسة");
        appState.ui.editSessionId = null;
      } else {
        saved = await dbModule.addSession(sessionData);
        showToast("تم تسجيل الجلسة بنجاح");
      }
      appState.ui.report = { id: saved.id, data: saved };
      router.render();
    } catch (err) {
      console.error(err);
      showToast("خطأ أثناء حفظ الجلسة");
    }
  };

  function renderSurahInput(label, pathPrefix, value) {
    const maxAyah = findSurahAyahs(value) || "";
    return `
      <div class="row g-2">
        <div class="col-12 col-md-4">
          <label class="form-label">${label}</label>
          <input class="form-control" list="surah-list" value="${value}" oninput="updateFormPath('${pathPrefix}.surah', this.value)" placeholder="اختر السورة" />
        </div>
        <div class="col-6 col-md-4">
          <label class="form-label">من آية</label>
          <input type="number" class="form-control" min="1" max="${maxAyah}" value="${findValue(pathPrefix + '.from')}" oninput="updateFormPath('${pathPrefix}.from', this.value)" />
        </div>
        <div class="col-6 col-md-4">
          <label class="form-label">إلى آية</label>
          <input type="number" class="form-control" min="1" max="${maxAyah}" value="${findValue(pathPrefix + '.to')}" oninput="updateFormPath('${pathPrefix}.to', this.value)" />
        </div>
      </div>
    `;
  }

  function findValue(path) {
    const form = ensureSessionForm();
    const parts = path.split(".");
    let obj = form;
    for (let i = 0; i < parts.length; i += 1) {
      if (!obj) return "";
      obj = obj[parts[i]];
    }
    return obj ?? "";
  }

  function renderRatingPills(selectedValue, onChangeCode) {
    const RATINGS_CONFIG = [
      { val: "ممتاز", emoji: "✨" },
      { val: "جيد جداً", emoji: "👍" },
      { val: "جيد", emoji: "🙂" },
      { val: "يحتاج مراجعة", emoji: "📚" }
    ];
    
    return `
      <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px;">
        ${RATINGS_CONFIG.map(r => {
          const isSelected = selectedValue === r.val;
          const bg = isSelected ? '#f0fdf4' : '#ffffff';
          const border = isSelected ? '#10b981' : '#e2e8f0';
          const color = isSelected ? '#065f46' : '#475569';
          const shadow = isSelected ? '0 0 0 1px #10b981' : 'none';
          
          const finalVal = isSelected ? "" : r.val; 
          const action = onChangeCode.replace('__VAL__', finalVal);
          
          return `
            <button type="button" 
                    onclick="${action}; router.render();" 
                    style="background: ${bg}; border: 1px solid ${border}; color: ${color}; box-shadow: ${shadow}; border-radius: 30px; padding: 8px 12px; font-size: 14px; font-weight: 700; cursor: pointer; transition: 0.2s; display: flex; align-items: center; justify-content: center; gap: 6px; flex: 1; min-width: 120px;">
              <span style="font-size: 16px;">${r.emoji}</span> ${r.val}
            </button>
          `;
        }).join('')}
      </div>
    `;
  }

  function renderQuranSection(title, key) {
    const form = ensureSessionForm();
    const section = form.quran[key];
    return `
      <div class="card-soft mb-2" style="background:${key === "hifz" ? "#f0fdf4" : "#f9fafb"};">
        <div style="font-weight:700;margin-bottom:10px;color:#065f46;">${title}</div>
        ${renderSurahInput("السورة", `quran.${key}`, section.surah)}
        
        <div class="mt-3">
          <label class="form-label" style="font-weight: bold;">التقييم</label>
          ${renderRatingPills(section.rating, `updateFormPath('quran.${key}.rating', '__VAL__')`)}
        </div>
        
        <div class="mt-3">
          <label class="form-label" style="font-weight: bold;">أخطاء التجويد</label>
          <div class="d-flex flex-wrap gap-2 mt-1">
            ${TAJWEED.map(
              (t) => `
                <label class="form-check" style="background: white; border: 1px solid #e2e8f0; padding: 4px 10px; border-radius: 8px; margin: 0; cursor: pointer;">
                  <input class="form-check-input" style="margin-left: 6px;" type="checkbox" ${section.tajweed.includes(t) ? "checked" : ""} onchange="toggleTajweed('${key}', '${t}', this.checked)" />
                  <span class="form-check-label">${t}</span>
                </label>
              `
            ).join("")}
          </div>
        </div>
        
        <div class="mt-3">
          <label class="form-label" style="font-weight: bold;">ملاحظات</label>
          <textarea class="form-control mt-1" oninput="updateFormPath('quran.${key}.notes', this.value)">${section.notes}</textarea>
        </div>
      </div>
    `;
  }

  function renderGroupRows(members, form, showDetails) {
    ensureGroupRows(members);
    return members
      .map((m) => {
        const row = form.group.rows[m.id];
        const limit = m.sessionLimit || appState.settings.defaultLimit || 12;
        const nextNum = getNextPackageNum(m.id, limit);
        return `
          <div class="card-soft mb-2" style="background:#f9fafb;">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <div style="font-weight:700;">${m.gender === "girl" ? "🧕" : "👦"} ${m.name}</div>
              <div class="d-flex align-items-center gap-2">
                <label class="form-check m-0">
                  <input class="form-check-input" type="checkbox" ${row.present ? "checked" : ""} onchange="toggleGroupPresence('${m.id}', this.checked)" />
                  <span class="form-check-label">حاضر</span>
                </label>
                <input type="number" class="form-control" style="width:90px;" placeholder="الحصة" value="${row.overridePackageNum || nextNum}" oninput="updateGroupPackageOverride('${m.id}', this.value)" />
              </div>
            </div>
            ${form.group.sync || !showDetails ? "" : `
              <div class="row g-2">
                <div class="col-12 col-md-4">
                  <label class="form-label" style="font-weight: bold;">التسميع</label>
                  <div class="d-flex gap-2 mb-2">
                    <input type="number" class="form-control" placeholder="من" value="${row.hifz.from}" oninput="updateGroupRow('${m.id}', 'hifz', 'from', this.value)" />
                    <input type="number" class="form-control" placeholder="إلى" value="${row.hifz.to}" oninput="updateGroupRow('${m.id}', 'hifz', 'to', this.value)" />
                  </div>
                  ${renderRatingPills(row.hifz.rating, `updateGroupRow('${m.id}', 'hifz', 'rating', '__VAL__')`)}
                </div>
                <div class="col-12 col-md-4">
                  <label class="form-label" style="font-weight: bold;">قريب</label>
                  <div class="d-flex gap-2 mb-2">
                    <input type="number" class="form-control" placeholder="من" value="${row.recent.from}" oninput="updateGroupRow('${m.id}', 'recent', 'from', this.value)" />
                    <input type="number" class="form-control" placeholder="إلى" value="${row.recent.to}" oninput="updateGroupRow('${m.id}', 'recent', 'to', this.value)" />
                  </div>
                  ${renderRatingPills(row.recent.rating, `updateGroupRow('${m.id}', 'recent', 'rating', '__VAL__')`)}
                </div>
                <div class="col-12 col-md-4">
                  <label class="form-label" style="font-weight: bold;">بعيد</label>
                  <div class="d-flex gap-2 mb-2">
                    <input type="number" class="form-control" placeholder="من" value="${row.distant.from}" oninput="updateGroupRow('${m.id}', 'distant', 'from', this.value)" />
                    <input type="number" class="form-control" placeholder="إلى" value="${row.distant.to}" oninput="updateGroupRow('${m.id}', 'distant', 'to', this.value)" />
                  </div>
                  ${renderRatingPills(row.distant.rating, `updateGroupRow('${m.id}', 'distant', 'rating', '__VAL__')`)}
                </div>
              </div>
            `}
          </div>
        `;
      })
      .join("");
  }

  function renderIslamicBlocks(form) {
    if (!form.islamic.categories.length) {
      return `<div style="font-size:12px;color:#9ca3af;">لم يتم إضافة تصنيفات بعد.</div>`;
    }
    return form.islamic.categories
      .map((block) => {
        const cat = ISLAMIC_CATEGORIES.find((c) => c.id === block.type);
        if (!cat) return "";
        return `
          <div class="card-soft mb-2" style="background:#f9fafb;">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <div style="font-weight:700;">${cat.label}</div>
              <button class="btn btn-light" onclick="removeIslamicCategory('${block.id}')">×</button>
            </div>
            ${cat.fields
              .map(
                (f) => `
                  <div class="mb-2">
                    <label class="form-label">${f.label}</label>
                    <input class="form-control" value="${block.data[f.key] || ""}" placeholder="${f.placeholder}" oninput="updateIslamicCategory('${block.id}', '${f.key}', this.value)" />
                  </div>
                `
              )
              .join("")}
          </div>
        `;
      })
      .join("");
  }

  function renderIslamicHomework(form) {
    if (!form.islamic.homework.length) {
      return `<div style="font-size:12px;color:#9ca3af;">لم يتم إنشاء واجبات بعد.</div>`;
    }
    return form.islamic.homework
      .map((block) => {
        const cat = ISLAMIC_CATEGORIES.find((c) => c.id === block.type);
        if (!cat) return "";
        return `
          <div class="card-soft mb-2" style="background:#fdfaf3;">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <div style="font-weight:700;">واجب ${cat.label}</div>
              <button class="btn btn-light" onclick="removeIslamicHomework('${block.id}')">×</button>
            </div>
            ${cat.fields
              .map(
                (f) => `
                  <div class="mb-2">
                    <label class="form-label">${f.label}</label>
                    <input class="form-control" value="${block.data[f.key] || ""}" placeholder="${f.placeholder}" oninput="updateIslamicHomework('${block.id}', '${f.key}', this.value)" />
                  </div>
                `
              )
              .join("")}
          </div>
        `;
      })
      .join("");
  }

  function renderReportModal() {
    const report = appState.ui.report;
    if (!report) return "";
    const data = report.data;

    const getRatingBadge = (rating) => {
      if (!rating) return "";
      let color = "#6b7280"; let bg = "#f3f4f6";
      if (rating === "ممتاز") { color = "#065f46"; bg = "#d1fae5"; }
      else if (rating === "جيد جداً") { color = "#0369a1"; bg = "#e0f2fe"; }
      else if (rating === "جيد") { color = "#b45309"; bg = "#fef3c7"; }
      else if (rating === "يحتاج مراجعة") { color = "#be123c"; bg = "#ffe4e6"; }
      return `<span style="background:${bg}; color:${color}; padding: 2px 10px; border-radius: 12px; font-size: 13px; font-weight: 700; display: inline-block;">التقييم: ${rating}</span>`;
    };

    const renderTajweed = (errors) => {
      if (!errors || errors.length === 0) return "";
      return `<div style="font-size: 13px; color: #b45309; margin-top: 6px; display: flex; align-items: start; gap: 6px;">
                <span><i class="ph-duotone ph-warning-circle" style="color:#b45309;"></i></span> <span>أخطاء التجويد: ${errors.join("، ")}</span>
              </div>`;
    };

    const renderNotes = (notes) => {
      if (!notes) return "";
      return `<div style="font-size: 13px; color: #6b7280; margin-top: 6px; display: flex; align-items: start; gap: 6px;">
                <span><i class="ph-duotone ph-pencil-line"></i></span> <span>${notes}</span>
              </div>`;
    };

    const renderMiniStars = (label, value) => {
      if (value === undefined || value === 0) return `<div style="text-align: center;"><div style="font-size: 12px; color: #1c1c2e; font-weight: 700; margin-bottom: 4px;">${label}</div><div style="direction: ltr; font-size: 16px; color: #e5e7eb;">★★★★★</div></div>`;
      const stars = Array.from({length: 5}, (_, i) => `<span style="color: ${i < value ? '#eab308' : '#e5e7eb'}; font-size: 16px;">★</span>`).join('');
      return `<div style="text-align: center;">
                <div style="font-size: 12px; color: #1c1c2e; font-weight: 700; margin-bottom: 4px;">${label}</div>
                <div style="direction: ltr;">${stars}</div>
              </div>`;
    };

    const isGroup = data.mode === "group";

    return `
      <div class="report-overlay" style="backdrop-filter: blur(8px); background: rgba(0,0,0,0.6); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 20px;">
        <div class="report-modal" style="padding: 0; border-radius: 16px; width: min(450px, 100%); background: #f9fafb; overflow: hidden; font-family: 'Cairo', sans-serif; display: flex; flex-direction: column; max-height: 95vh;">
          
          <div id="session-report-box" style="background: #fff; flex: 1; overflow-y: auto;">
            <div style="background: #0f5846; padding: 24px 20px 32px; text-align: center; color: white;">
              <div style="font-family: var(--font-arabic); font-size: 32px; font-weight: 700; margin-bottom: 8px;">
                ${data.sessionType === "quran" ? "تقرير حلقة القرآن الكريم" : "تقرير التربية الإسلامية"}
              </div>
              <div style="color: #a7f3d0; font-size: 15px; font-weight: 600;">المعلم: ${appState.settings.teacherName}</div>
            </div>

            <div style="padding: 0 20px 20px;">
              <div style="background: #f3f4f6; border-radius: 12px; padding: 12px 16px; margin-top: -16px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
                <div style="font-size: 13px; color: #6b7280; font-weight: 600;">${data.dateAr || formatArDate(data.date)}</div>
                <div style="display: flex; align-items: center; gap: 8px; font-weight: 700; font-size: 15px; color: #1c1c2e;">
                  ${isGroup ? data.groupName : data.studentName}
                  <span style="color: #4b5563; font-size: 18px;">${isGroup ? "<i class='ph-duotone ph-users'></i>" : "<i class='ph-duotone ph-user'></i>"}</span>
                </div>
              </div>

              <div style="margin-top: 24px; display: flex; flex-direction: column; gap: 20px;">
                ${data.sessionType === "quran" ? `
                  ${["hifz", "recent", "distant"].map(secKey => {
                    const sec = data.quran[secKey];
                    if (!sec || !sec.surah) return "";
                    
                    const titles = { hifz: "<i class='ph-duotone ph-star' style='margin-left:4px;'></i>التسميع", recent: "<i class='ph-duotone ph-arrows-clockwise' style='margin-left:4px;'></i>الماضي القريب", distant: "<i class='ph-duotone ph-clock' style='margin-left:4px;'></i>الماضي البعيد" };
                    const borders = { hifz: "#065f46", recent: "#0284c7", distant: "#92400e" };
                    
                    return `
                      <div style="position: relative; padding-right: 16px; text-align: right;">
                        <div style="position: absolute; right: 0; top: 0; bottom: 0; width: 4px; border-radius: 4px; background: ${borders[secKey]};"></div>
                        <div style="font-weight: 700; color: #1c1c2e; font-size: 16px; margin-bottom: 8px;">${titles[secKey]}</div>
                        <div style="font-weight: 500; font-size: 15px; color: #4b5563; margin-bottom: 8px;">
                          سورة ${sec.surah} <span style="font-size: 13px; color: #6b7280;">(آية ${sec.from} - ${sec.to})</span>
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 4px;">
                          <div>${getRatingBadge(sec.rating)}</div>
                          ${renderTajweed(sec.tajweed)}
                          ${renderNotes(sec.notes)}
                        </div>
                      </div>
                    `;
                  }).join("")}

                  ${data.quran?.tadabbur?.surah ? `
                    <div style="position: relative; padding-right: 16px; text-align: right;">
                      <div style="position: absolute; right: 0; top: 0; bottom: 0; width: 4px; border-radius: 4px; background: #eab308;"></div>
                      <div style="font-weight: 700; color: #1c1c2e; font-size: 16px; margin-bottom: 8px;"><i class='ph-duotone ph-book-open' style='margin-left:4px;'></i>التدبر والملاحظة</div>
                      <div style="font-weight: 500; font-size: 15px; color: #4b5563; margin-bottom: 4px;">
                        سورة ${data.quran.tadabbur.surah} ${data.quran.tadabbur.from ? `<span style="font-size: 13px; color: #6b7280;">(من آية ${data.quran.tadabbur.from} إلى ${data.quran.tadabbur.to})</span>` : ""}
                      </div>
                    </div>
                  ` : ""}

                  <div style="display: flex; justify-content: space-around; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px 8px; margin-top: 12px;">
                    ${renderMiniStars("تفاعل", data.quran.tadabbur?.interaction)}
                    ${renderMiniStars("حضور", data.quran.tadabbur?.attention)}
                  </div>

                  ${(data.quran.closing?.homework?.new?.surah || data.quran.closing?.homework?.recent?.surah || data.quran.closing?.homework?.distant?.surah) ? `
                    <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 16px; margin-top: 8px; text-align: right;">
                        <i class="ph-duotone ph-books" style="margin-left:4px;"></i>واجب الحلقة القادمة
                      <div style="display: flex; flex-direction: column; gap: 8px; font-size: 14px; color: #374151;">
                        ${data.quran.closing.homework.new?.surah ? `<div><strong style="color:#065f46;"><i class="ph-duotone ph-star" style="margin-left:4px;"></i>تسميع:</strong> سورة ${data.quran.closing.homework.new.surah} (من ${data.quran.closing.homework.new.from} لـ ${data.quran.closing.homework.new.to})</div>` : ""}
                        ${data.quran.closing.homework.recent?.surah ? `<div><strong style="color:#0284c7;"><i class="ph-duotone ph-arrows-clockwise" style="margin-left:4px;"></i>قريب:</strong> سورة ${data.quran.closing.homework.recent.surah} (من ${data.quran.closing.homework.recent.from} لـ ${data.quran.closing.homework.recent.to})</div>` : ""}
                        ${data.quran.closing.homework.distant?.surah ? `<div><strong style="color:#92400e;"><i class="ph-duotone ph-clock" style="margin-left:4px;"></i>بعيد:</strong> سورة ${data.quran.closing.homework.distant.surah} (من ${data.quran.closing.homework.distant.from} لـ ${data.quran.closing.homework.distant.to})</div>` : ""}
                      </div>
                      ${data.quran.closing.homeworkNotes ? `<div style="margin-top: 8px; font-size: 13px; color: #4b5563;">ملاحظة: ${data.quran.closing.homeworkNotes}</div>` : ""}
                    </div>
                  ` : ""}
                ` : `
                  ${data.islamic?.categories?.length ? data.islamic.categories.map(c => {
                    const catTitle = ISLAMIC_CATEGORIES.find(x => x.id === c.type)?.label || "درس";
                    const fields = ISLAMIC_CATEGORIES.find(x => x.id === c.type)?.fields || [];
                    const details = fields.map(f => c.data[f.key] ? `<span style="color:#065f46; font-weight:700;">${f.label}:</span> ${c.data[f.key]}` : "").filter(Boolean).join(" <br/> ");
                    return `
                    <div style="position: relative; padding-right: 16px; text-align: right; margin-bottom: 12px;">
                      <div style="position: absolute; right: 0; top: 0; bottom: 0; width: 4px; border-radius: 4px; background: #c9973a;"></div>
                      <div style="font-weight: 700; color: #1c1c2e; font-size: 16px; margin-bottom: 8px;"><i class="ph-duotone ph-books" style="margin-left:4px;"></i>${catTitle}</div>
                      <div style="font-size: 14px; color: #4b5563; line-height: 1.6;">${details || "تم الشرح"}</div>
                    </div>
                  `}).join("") : '<div style="color:var(--c-gray); text-align:center;">لم يتم تسجيل تفاصيل الدرس</div>'}
                  
                  <div style="display: flex; justify-content: space-around; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px 8px; margin-top: 12px;">
                    ${renderMiniStars("السلوك", data.overall)}
                    ${renderMiniStars("تفاعل", data.islamic?.behavior?.interaction)}
                    ${renderMiniStars("انتباه", data.islamic?.behavior?.attention)}
                  </div>
                `}

                ${!isGroup && data.packageSessionNum ? `
                  <div style="text-align: center; color: #065f46; font-weight: bold; font-size: 14px; margin-top: 8px; background: #f0fdf4; padding: 6px; border-radius: 8px;">
                    الحلقة رقم ${data.packageSessionNum} من الباقة
                  </div>
                ` : ""}
              </div>
            </div>
          </div>
          
          <div style="padding: 16px 20px; display: flex; flex-direction: column; gap: 10px; background: #f9fafb;">
            <div style="display: flex; gap: 10px;">
              <button class="btn" style="flex: 1; background: #22c55e; color: white; font-weight: 700; border-radius: 8px; padding: 10px; font-size: 15px;" onclick="sendReportWhatsApp()">
                <i class="ph-bold ph-share-network" style="margin-left:4px;"></i>مشاركة نصية
              </button>
              <button class="btn" style="flex: 1; background: #0f5846; color: white; font-weight: 700; border-radius: 8px; padding: 10px; font-size: 15px;" onclick="exportElementAsImage(document.getElementById('session-report-box'), 'report.png')">
                <i class="ph-bold ph-download-simple" style="margin-left:4px;"></i>حفظ صورة
              </button>
            </div>
            <button class="btn" style="width: 100%; background: #e5e7eb; color: #374151; font-weight: 700; border-radius: 8px; padding: 10px; font-size: 14px;" onclick="editReportSession()">
              <i class="ph-bold ph-pencil-simple" style="margin-left:4px;"></i>تعديل الجلسة
            </button>
            <button class="btn btn-link" style="width: 100%; color: #6b7280; text-decoration: none; font-weight: 600; padding: 4px; font-size: 13px;" onclick="closeReport()">
              إغلاق (Esc)
            </button>
          </div>
        </div>
      </div>
    `;
  }

  window.renderSessionForm = function () {
    const form = ensureSessionForm();
    const scope = appState.ui.sessionScope;
    const query = appState.ui.searchQuery.toLowerCase();
    const gender = appState.ui.searchGender;

    const students = appState.students.filter((s) => {
      const matchesName = s.name.toLowerCase().includes(query);
      const matchesGender = gender === "all" ? true : s.gender === gender;
      return matchesName && matchesGender;
    });

    const groups = appState.groups.filter((g) => {
      const groupName = (g.name || "").toLowerCase();
      const matchesGroup = groupName.includes(query);
      const memberNames = appState.students
        .filter((s) => g.studentIds?.includes(s.id))
        .map((s) => s.name.toLowerCase())
        .join(" ");
      return matchesGroup || memberNames.includes(query);
    });

    const selectedStudent = getStudentById(appState.ui.selectedStudentId);
    const selectedGroup = getGroupById(appState.ui.selectedGroupId);

    const hasSelection = scope === "individual" ? !!selectedStudent : !!selectedGroup;

    if (!hasSelection) {
      return `
        <div class="dash-search">
          <span class="dash-search__icon"><i class="ph-duotone ph-magnifying-glass"></i></span>
          <input class="dash-search__input" placeholder="ابحث عن طالب أو مجموعة..." value="${appState.ui.searchQuery}" oninput="updateSearchQuery(this.value)" />
          <select class="dash-search__filter" onchange="updateSearchGender(this.value)">
            <option value="all" ${gender === "all" ? "selected" : ""}>الكل</option>
            <option value="boy" ${gender === "boy" ? "selected" : ""}>أولاد</option>
            <option value="girl" ${gender === "girl" ? "selected" : ""}>بنات</option>
          </select>
        </div>

        <div class="dash-picker-grid">
          <div class="dash-picker-col">
            <div class="dash-picker-header">
              <div class="dash-picker-header__icon individual"><i class="ph-duotone ph-user"></i></div>
              <div class="dash-picker-header__text">
                <div class="dash-picker-header__title">حلقات فردية</div>
                <div class="dash-picker-header__count">${students.length} طالب</div>
              </div>
            </div>
            <div class="dash-picker-list">
              ${students.length === 0 ? `
                <div class="elite-empty-state">
                  <div class="elite-empty-icon"><i class="ph-duotone ph-user"></i></div>
                  <div class="elite-empty-title">لا يوجد طلاب</div>
                  <div class="elite-empty-desc">أضف طلابك من صفحة الإعدادات لتبدأ تسجيل جلساتهم.</div>
                </div>
              ` :
                students.map(s => `
                  <button class="dash-item" onclick="selectStudent('${s.id}')">
                    <div class="dash-item__avatar"><i class="ph-duotone ph-user"></i></div>
                    <div class="dash-item__name">${s.name}</div>
                  </button>
                `).join('')}
            </div>
          </div>

          <div class="dash-picker-col">
            <div class="dash-picker-header">
              <div class="dash-picker-header__icon group"><i class="ph-duotone ph-users"></i></div>
              <div class="dash-picker-header__text">
                <div class="dash-picker-header__title">حلقات جماعية</div>
                <div class="dash-picker-header__count">${groups.length} مجموعة</div>
              </div>
            </div>
            <div class="dash-picker-list">
              ${groups.length === 0 ? `
                <div class="elite-empty-state">
                  <div class="elite-empty-icon"><i class="ph-duotone ph-users"></i></div>
                  <div class="elite-empty-title">لا توجد مجموعات</div>
                  <div class="elite-empty-desc">أنشئ المجموعات من صفحة الإعدادات لتبدأ المتابعة الجماعية.</div>
                </div>
              ` :
                groups.map(g => {
                  const names = appState.students
                    .filter(s => g.studentIds?.includes(s.id))
                    .map(s => s.name).join("، ");
                  return `
                    <button class="dash-item" onclick="selectGroup('${g.id}')">
                      <div class="dash-item__avatar"><i class="ph-duotone ph-users"></i></div>
                      <div class="dash-item__name">${g.name}</div>
                      <div class="dash-item__meta">${names || "—"}</div>
                    </button>
                  `;
                }).join('')}
            </div>
          </div>
        </div>
      `;
    }

    const headerTarget = scope === "individual" ? selectedStudent?.name : selectedGroup?.name;
    const groupMembers = scope === "group" ? getGroupMembers(selectedGroup.id) : [];

    // ✅ احتساب وتأمين توليد رقم الجلسة التلقائي الأولي دون أن يتصفر عند أي Re-render
    const limit = selectedStudent?.sessionLimit || appState.settings.defaultLimit || 12;
    if (scope === "individual" && selectedStudent && form.sessionNumber === 0) {
        form.sessionNumber = getNextPackageNum(selectedStudent.id, limit) || 1;
    }

    const progressPercent = Math.min(100, Math.round(((form.sessionNumber || 1) / limit) * 100));

    return `
      ${renderReportModal()}
      <div class="dash-form-card">
        <div class="dash-form-header">
          <div class="dash-form-header__info">
            <div class="dash-form-header__avatar"><i class="ph-duotone ${scope === 'individual' ? 'ph-user' : 'ph-users'}"></i></div>
            <div>
              <div class="dash-form-header__name">${headerTarget || ""}</div>
              <div class="dash-form-header__type">${scope === "individual" ? "جلسة فردية" : "جلسة جماعية"}</div>
            </div>
          </div>
          <button class="dash-form-back" onclick="clearSelection()">← تغيير</button>
        </div>

        <div class="dash-date-row">
          <span style="font-size:20px; color:var(--text-muted);"><i class="ph-duotone ph-calendar-blank"></i></span>
          <input type="date" class="dash-date-input" value="${form.date}" onchange="updateFormPath('date', this.value)" />
        </div>

        <div style="background: #f8fafc; border-radius: 12px; padding: 16px; margin-bottom: 16px; border: 1px solid #e2e8f0; display: flex; flex-direction: column; gap: 14px;">
          <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
            <div style="display: flex; align-items: center; gap: 10px; font-weight: 700; color: #475569; font-size: 15px;">
              <div style="background: #94a3b8; color: white; padding: 2px 4px; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 14px;">
                <i class="ph-fill ph-numpad"></i>
              </div>
              الحلقة الحالية في الباقة
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <button type="button" onclick="let current = parseInt(document.getElementById('session-number').value, 10) || 1; if(current > 1) { updateFormPath('sessionNumber', current - 1); router.render(); }" 
                      style="background: #f1f5f9; color: #64748b; border: 1px solid #cbd5e1; width: 36px; height: 36px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 18px; display: flex; align-items: center; justify-content: center; transition: 0.2s;">
                -
              </button>
              <input type="number" id="session-number" value="${form.sessionNumber || 1}" min="1" oninput="updateFormPath('sessionNumber', parseInt(this.value, 10) || 1); router.render();"
                     style="text-align: center; font-weight: 900; font-size: 18px; color: #065f46; border: 2px solid #065f46; border-radius: 8px; width: 65px; height: 36px; padding: 0; background: white; outline: none;">
              <button type="button" onclick="let current = parseInt(document.getElementById('session-number').value, 10) || 1; updateFormPath('sessionNumber', current + 1); router.render();" 
                      style="background: #f1f5f9; color: #64748b; border: 1px solid #cbd5e1; width: 36px; height: 36px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 18px; display: flex; align-items: center; justify-content: center; transition: 0.2s;">
                +
              </button>
            </div>
          </div>
          <div style="height: 6px; background: #e2e8f0; border-radius: 10px; width: 100%; overflow: hidden; display: flex;">
            <div style="width: ${progressPercent}%; background: #065f46; border-radius: 10px; transition: 0.3s;"></div>
          </div>
        </div>

        <div class="dash-type-switch">
          <button class="dash-type-btn ${form.sessionType === "quran" ? "active" : ""}" onclick="updateFormPath('sessionType','quran'); router.render();"><i class="ph-duotone ph-book-open-text" style="margin-left: 4px;"></i>قرآن</button>
          <button class="dash-type-btn ${form.sessionType === "islamic" ? "active gold-active" : ""}" onclick="updateFormPath('sessionType','islamic'); router.render();"><i class="ph-duotone ph-books" style="margin-left: 4px;"></i>تربية إسلامية</button>
        </div>

        ${form.sessionType === "quran" ? `
          ${renderQuranSection("التسميع", "hifz")}
          ${renderQuranSection("الماضي القريب", "recent")}
          ${renderQuranSection("الماضي البعيد", "distant")}

          <div class="card-soft mb-2">
            <div style="font-weight:var(--fw-bold);color:var(--gold);margin-bottom:10px;font-size:var(--fs-lg);">✨ التدبر</div>
            ${renderSurahInput("السورة", "quran.tadabbur", form.quran.tadabbur.surah)}
            <div class="mt-2">
              <label class="form-label">الحضور والانتباه</label>
              ${renderStars("quran.tadabbur.attention", form.quran.tadabbur.attention)}
            </div>
            <div class="mt-2">
              <label class="form-label">التفاعل</label>
              ${renderStars("quran.tadabbur.interaction", form.quran.tadabbur.interaction)}
            </div>
          </div>

          <div class="card-soft mb-2">
            <div style="font-weight:700;color:#065f46;margin-bottom:10px;">الختام</div>
            <div class="mb-2">
              <label class="form-label">التقييم العام</label>
              ${renderStars("quran.closing.overall", form.quran.closing.overall)}
            </div>
            <div class="mb-2">
              <div style="font-weight:var(--fw-bold);margin-bottom:10px;color:var(--gold);">📚 واجب الحلقة القادمة</div>
              ${renderSurahInput("الحفظ الجديد", "quran.closing.homework.new", form.quran.closing.homework.new.surah)}
              ${renderSurahInput("الماضي القريب", "quran.closing.homework.recent", form.quran.closing.homework.recent.surah)}
              ${renderSurahInput("الماضي البعيد", "quran.closing.homework.distant", form.quran.closing.homework.distant.surah)}
              <label class="form-label mt-2">ملاحظات الواجب</label>
              <textarea class="form-control" oninput="updateFormPath('quran.closing.homeworkNotes', this.value)">${form.quran.closing.homeworkNotes}</textarea>
            </div>
          </div>

          ${scope === "group" ? `
            <div class="card-soft mb-2">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <div style="font-weight:700;color:#065f46;">إدارة الباقة للمجموعة</div>
                <label class="form-check m-0">
                  <input class="form-check-input" type="checkbox" ${form.group.sync ? "checked" : ""} onchange="toggleGroupSync(this.checked)" />
                  <span class="form-check-label">تزامن الحقول</span>
                </label>
              </div>
              ${renderGroupRows(groupMembers, form, true)}
            </div>
          ` : ""}
        ` : `
          <div class="card-soft mb-2">
            <div style="font-weight:700;color:#92400e;margin-bottom:10px;">تصنيفات التربية الإسلامية</div>
            <div class="d-flex flex-wrap gap-2 mb-2">
              ${ISLAMIC_CATEGORIES.map(
                (c) => `<button class="btn btn-light" onclick="addIslamicCategory('${c.id}')">➕ ${c.label}</button>`
              ).join("")}
            </div>
            ${renderIslamicBlocks(form)}
          </div>

          <div class="card-soft mb-2">
            <div style="font-weight:var(--fw-bold);color:var(--gold);margin-bottom:10px;font-size:var(--fs-lg);">🌟 التقييم السلوكي</div>
            <label class="form-label">الحضور والانتباه</label>
            ${renderStars("islamic.behavior.attention", form.islamic.behavior.attention)}
            <label class="form-label mt-2">المشاركة والتفاعل</label>
            ${renderStars("islamic.behavior.interaction", form.islamic.behavior.interaction)}
          </div>

          <div class="card-soft mb-2">
            <div style="font-weight:var(--fw-bold);color:var(--gold);margin-bottom:10px;font-size:var(--fs-lg);">📚 واجب الحصة القادمة</div>
            ${renderIslamicHomework(form)}
          </div>

          ${scope === "group" ? `
            <div class="card-soft mb-2">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <div style="font-weight:700;color:#065f46;">إدارة الباقة للمجموعة</div>
                <label class="form-check m-0">
                  <input class="form-check-input" type="checkbox" ${form.group.sync ? "checked" : ""} onchange="toggleGroupSync(this.checked)" />
                  <span class="form-check-label">تزامن الحقول</span>
                </label>
              </div>
              ${renderGroupRows(groupMembers, form, false)}
            </div>
          ` : ""}
        `}

        <button class="dash-save-btn" onclick="saveSession()"><i class="ph-duotone ph-floppy-disk" style="margin-left: 8px;"></i>حفظ وتسجيل الجلسة</button>
      </div>

      <datalist id="surah-list">
        ${SURAH_LIST.map((s) => `<option value="${s.name}"></option>`).join("")}
      </datalist>
    `;
  };

  window.initSessionForm = function () {
    const form = ensureSessionForm();
    if (form.scope === "group" && form.groupId) {
      const groupMembers = getGroupMembers(form.groupId);
      ensureGroupRows(groupMembers);
    }
  };
})();
