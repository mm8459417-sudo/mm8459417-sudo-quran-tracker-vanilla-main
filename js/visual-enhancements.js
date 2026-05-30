document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    
    // 4. Advanced Animations
    
    // Magnetic Hover Effect
    const magneticElements = document.querySelectorAll('button, .btn, .card-soft, .premium-stat-card, .nav-item');
    
    magneticElements.forEach(el => {
      el.classList.add('magnetic');
      
      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        
        // Intensity of magnetic pull
        const pullX = x * 0.1;
        const pullY = y * 0.1;
        
        el.style.transform = `translate(${pullX}px, ${pullY}px) scale(1.02)`;
      });
      
      el.addEventListener('mouseleave', () => {
        el.style.transform = '';
      });
    });

    // Staggered Entrance Animation
    const applyEntranceAnimations = () => {
      const mainContent = document.querySelector('#app-main');
      if (!mainContent) return;
      
      const children = mainContent.querySelectorAll(
        ':scope > *, .card-soft, .premium-stat-card, .premium-hero, .ultra-cert__frame, .elite-ai-insights'
      );
      
      children.forEach((el, i) => {
        el.classList.remove('entrance-animate');
        // trigger reflow
        void el.offsetWidth;
        el.classList.add('entrance-animate');
        el.style.animationDelay = (i * 0.08) + 's';
      });
    };
    
    applyEntranceAnimations();

    // Progress Bars Animation from 0
    const progressObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const bars = entry.target.querySelectorAll('.progress-bar, [class*="progress-bar"], [style*="width:"]');
          bars.forEach(bar => {
            // Find if it has an inline width
            const targetWidth = bar.style.width;
            if(targetWidth && targetWidth !== '0%') {
              bar.style.width = '0%';
              requestAnimationFrame(() => {
                setTimeout(() => { bar.style.width = targetWidth; }, 100);
              });
            }
          });
          progressObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });

    document.querySelectorAll('.card-soft, .table, table, .progress').forEach(el => progressObserver.observe(el));

    // Re-run animations on nav changes
    document.addEventListener('click', (e) => {
      const link = e.target.closest('.nav-item');
      if (link) {
        setTimeout(applyEntranceAnimations, 50);
      }
    });

    // Ripple effect for primary buttons (Scale-down ripple click)
    document.addEventListener('mousedown', (e) => {
      const btn = e.target.closest('.btn-primary');
      if (btn) {
        btn.style.transform = 'scale(0.95)';
        setTimeout(() => {
          btn.style.transform = '';
        }, 150);
      }
    });

  }, 100);
});

// Update Chart Defaults for consistency
function updateChartDefaults() {
  if (typeof Chart !== 'undefined') {
    Chart.defaults.font.family = "'Noto Naskh Arabic', 'Cairo', sans-serif";
    Chart.defaults.color = '#1C2526';
    
    const originalUpdate = Chart.prototype.update;
    Chart.prototype.update = function(...args) {
      if (this.data && this.data.datasets) {
        this.data.datasets.forEach((dataset, i) => {
          if (!dataset._customStyled) {
            const colors = ['#1a6b3c', '#C9952A', '#3A9455', '#2D7D46'];
            if (dataset.type === 'line' || this.config.type === 'line') {
              dataset.borderColor = colors[i % colors.length];
              dataset.pointBackgroundColor = colors[i % colors.length];
              dataset.pointRadius = 5;
              dataset.pointHoverRadius = 8;
              dataset.tension = 0.4;
            }
            dataset._customStyled = true;
          }
        });
      }
      return originalUpdate.call(this, ...args);
    };
  } else {
    setTimeout(updateChartDefaults, 500);
  }
}
updateChartDefaults();
