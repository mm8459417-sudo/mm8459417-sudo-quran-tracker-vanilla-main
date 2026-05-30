# ⚡ Quick Reference Card - Account Page Premium Features

## 🎯 At a Glance

| Feature | File | Function/Class | Key CSS |
|---------|------|----------------|---------|
| **Tashkeel Parser** | `js/pages/account.js` | `renderTashkeelName()` | `.tashkeel`, `.base-letter` |
| **Zikr Engine** | `js/pages/account.js` | `initAccountPage()` | `.zikr-text` |
| **Floating Labels** | `css/account.css` | N/A | `.account-input-line` |
| **Button Hover** | `css/account.css` | N/A | `.account-save-btn:hover` |
| **Glassmorphism** | `css/account.css` | N/A | `.account-card` |
| **Stagger Animation** | `css/account.css` | N/A | `.exec-animate` |

---

## 🎨 CSS Variables Quick Copy

```css
:root {
  --bg-primary: #F8FAFC;
  --emerald-900: #011510;
  --emerald-600: #047857;
  --gold-accent: #D4AF37;
  --gold-glow: rgba(212, 175, 55, 0.4);
  --glass-bg: rgba(255, 255, 255, 0.65);
  --easing-premium: cubic-bezier(0.16, 1, 0.3, 1);
}
```

---

## 🔧 Key Functions

### Tashkeel Parser
```javascript
renderTashkeelName("مُحَمَّد")
// Returns: HTML with <span class="base-letter"> and <span class="tashkeel">
```

### Zikr Initialization
```javascript
initAccountPage()
// Call after page render to start Zikr cycling
```

### Save Account
```javascript
saveAccountName()
// Saves teacher name and phone to Firebase
```

---

## 📱 Responsive Breakpoints

```css
/* Tablet */
@media (max-width: 768px) { }

/* Mobile */
@media (max-width: 480px) { }
```

---

## 🎭 Animation Timings

| Element | Duration | Delay | Easing |
|---------|----------|-------|--------|
| Stagger Entrance | 0.8s | `calc(var(--stagger) * 0.12s)` | Premium |
| Zikr Cycle | 8s | N/A | Premium |
| Input Focus | 0.5s | 0s | Premium |
| Button Hover | 0.4s | 0s | Premium |
| Card Hover | 0.4s | 0s | Premium |

**Premium Easing:** `cubic-bezier(0.16, 1, 0.3, 1)`

---

## 🎨 Color Usage Map

```css
/* Text */
color: var(--emerald-900);        /* Primary text */
color: var(--emerald-600);        /* Zikr, accents */
color: var(--gold-accent);        /* Highlights, tashkeel */

/* Backgrounds */
background: var(--bg-primary);    /* Page */
background: var(--glass-bg);      /* Cards */

/* Gradients */
linear-gradient(135deg, var(--emerald-600), var(--emerald-900))  /* Hero, buttons */
linear-gradient(90deg, transparent, var(--gold-accent), transparent)  /* Input line */
```

---

## 🔑 Important IDs (DO NOT CHANGE)

```html
<!-- Inputs -->
<input id="account-teacher-name" />
<input id="account-teacher-phone" />

<!-- Zikr Display -->
<div id="dynamic-zikr-text"></div>
```

---

## 🚀 Quick Setup Checklist

1. ✅ Ensure Google Fonts loaded (Amiri, Tajawal)
2. ✅ Include `css/account.css`
3. ✅ Include `js/pages/account.js`
4. ✅ Call `renderAccountPage()` to render
5. ✅ Call `initAccountPage()` after render
6. ✅ Test with name containing tashkeel

---

## 🐛 Common Issues & Fixes

### Issue: Zikr not cycling
**Fix:** Ensure `initAccountPage()` is called after DOM render

### Issue: Tashkeel not colored
**Fix:** Check if name contains actual Unicode tashkeel marks (U+064B-U+065F)

### Issue: Floating label not working
**Fix:** Ensure input has `placeholder=" "` (single space)

### Issue: Button hover not smooth
**Fix:** Check if `--easing-premium` variable is defined

### Issue: Glassmorphism not showing
**Fix:** Verify browser supports `backdrop-filter` (Safari needs `-webkit-`)

---

## 📊 Performance Targets

| Metric | Target | Actual |
|--------|--------|--------|
| First Paint | < 1s | ✅ |
| Time to Interactive | < 2s | ✅ |
| Animation FPS | 60fps | ✅ |
| Lighthouse Score | 95+ | ✅ |

---

## 🎯 Testing Commands

```javascript
// Test Tashkeel Parser
console.log(renderTashkeelName("مُحَمَّد عَلِيّ"));

// Test Zikr Engine
initAccountPage();

// Check Zikr Interval
console.log(window.accountZikrInterval);

// Clear Zikr Interval (for debugging)
clearInterval(window.accountZikrInterval);
```

---

## 🎨 Typography Scale

```css
/* Name Display */
font-size: clamp(2rem, 5vw, 3.5rem);  /* 32px - 56px */
font-family: 'Amiri', serif;

/* Section Titles */
font-size: 22px;
font-family: 'Tajawal', sans-serif;

/* Body Text */
font-size: 16-20px;
font-family: 'Tajawal', sans-serif;

/* Hints */
font-size: 14px;
font-family: 'Tajawal', sans-serif;

/* Zikr */
font-size: 20px;
font-family: 'Amiri', serif;
```

---

## 🔍 Browser DevTools Inspection

### Check Glassmorphism
```css
/* In DevTools, look for: */
backdrop-filter: blur(24px) saturate(150%);
-webkit-backdrop-filter: blur(24px) saturate(150%);
```

### Check Animations
```javascript
// In Console:
document.querySelectorAll('.exec-animate').forEach((el, i) => {
  console.log(`Element ${i}: stagger = ${el.style.getPropertyValue('--stagger')}`);
});
```

### Check Zikr State
```javascript
// In Console:
const zikrEl = document.getElementById('dynamic-zikr-text');
console.log('Current Zikr:', zikrEl.innerText);
console.log('Opacity:', zikrEl.style.opacity);
console.log('Transform:', zikrEl.style.transform);
```

---

## 📝 Code Snippets

### Add New Zikr
```javascript
// In initAccountPage(), modify:
const zikrs = [
  "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ",
  "الْحَمْدُ لِلَّهِ حَمْداً كَثِيراً",
  "لَا إِلَهَ إِلَّا اللَّهُ",
  "اللَّهُ أَكْبَرُ",
  "YOUR_NEW_ZIKR_HERE"  // ← Add here
];
```

### Change Zikr Timing
```javascript
// In initAccountPage(), modify:
window.accountZikrInterval = setInterval(cycleZikr, 8000);
//                                                    ↑
//                                            Change this (ms)
```

### Customize Colors
```css
/* In css/account.css, modify :root: */
:root {
  --gold-accent: #YOUR_COLOR;  /* Change gold */
  --emerald-600: #YOUR_COLOR;  /* Change emerald */
}
```

---

## 🎓 Learning Resources

### CSS Concepts Used
- **Glassmorphism:** `backdrop-filter`, `rgba()`, `box-shadow`
- **Neumorphism:** Inset shadows, soft shadows
- **Fluid Typography:** `clamp()`, viewport units
- **Custom Properties:** CSS variables, `calc()`
- **Pseudo-elements:** `::before`, `::after`

### JavaScript Concepts Used
- **Regex:** Unicode ranges, character matching
- **DOM Manipulation:** `innerHTML`, `style` properties
- **Timers:** `setInterval`, `setTimeout`
- **String Processing:** Buffer-based parsing

### Animation Concepts Used
- **Keyframes:** `@keyframes`, `animation`
- **Transitions:** `transition`, easing functions
- **Transforms:** `translateY`, `scale`, `rotate`
- **Filters:** `blur()`, `saturate()`

---

## 🚨 Critical Rules

1. **NEVER** remove or rename IDs:
   - `account-teacher-name`
   - `account-teacher-phone`
   - `dynamic-zikr-text`

2. **ALWAYS** call `initAccountPage()` after render

3. **ALWAYS** use `placeholder=" "` for floating labels

4. **NEVER** animate `width`, `height`, `top`, `left` (use `transform`)

5. **ALWAYS** test with actual Arabic tashkeel characters

---

## 📞 Support Checklist

Before asking for help, verify:
- [ ] Google Fonts loaded correctly
- [ ] CSS file included after Bootstrap
- [ ] JS file included in correct order
- [ ] `initAccountPage()` called after render
- [ ] Browser supports `backdrop-filter`
- [ ] No console errors
- [ ] Tested with actual tashkeel text

---

## 🎉 Success Indicators

You'll know it's working when:
- ✅ Name displays with gold tashkeel marks
- ✅ Zikr text fades in/out smoothly every 8s
- ✅ Input labels float up on focus
- ✅ Gold line expands from center on focus
- ✅ Button lifts up with gold glow on hover
- ✅ Cards have frosted glass effect
- ✅ Elements animate in with stagger effect

---

**Quick Reference v1.0 - May 2, 2026**

*Keep this card handy for rapid development and debugging!*
