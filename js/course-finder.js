/**
 * NurulQuran Course Finder Wizard Modal
 * Inspired by kim-nq.pages.dev
 * Feature: Find Best Course & Personalized Recommendations
 * Special logic: Remove question for alphabet from adults
 */

(function () {
  'use strict';

  function initCourseFinder() {
    var overlay = document.getElementById('wizardOverlay');
    if (!overlay) return;

    var dialog = document.getElementById('wizardDialog');
    var closeBtn = document.getElementById('wizardClose');
    var nextBtn = document.getElementById('wizardNext');
    var backBtn = document.getElementById('wizardBack');
    var fill = document.getElementById('wizardFill');
    var progress = document.getElementById('wizardProgress');
    var stepLabel = document.getElementById('wizardStepLabel');

    // Default contact WhatsApp number
    var WA_NUMBER = "4794441171";

    var answers = {
      age: '',
      format: '',
      city: '',
      level: '',
      goals: [],
      wname: '',
      dialcode: '+1',
      phone: ''
    };

    /**
     * Determine visible steps dynamically.
     * SPECIAL USER REQUIREMENT:
     * "remove the question for alapbet from adults"
     * -> When answers.age === 'adult', Step 4 (level / alphabet question) is omitted!
     */
    function visibleSteps() {
      var s = [1, 2];
      if (answers.format === 'onsite') s.push(3);
      if (answers.age !== 'adult') {
        s.push(4); // Only ask alphabet/level to non-adults (kids/teens/family)
      }
      s.push(5, 6, 7);
      return s;
    }

    var currentStepIndex = 0;
    var lastFocusedTrigger = null;
    var autoAdvanceTimer = null;

    function clearAutoAdvanceTimer() {
      if (autoAdvanceTimer) {
        clearTimeout(autoAdvanceTimer);
        autoAdvanceTimer = null;
      }
    }

    function getFocusableElements() {
      if (!dialog) return [];
      var selector = 'button:not([disabled]):not([hidden]), [href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
      var all = Array.prototype.slice.call(dialog.querySelectorAll(selector));
      return all.filter(function (el) {
        if (el.offsetWidth === 0 && el.offsetHeight === 0 && !el.getClientRects().length) return false;
        if (el.closest('[hidden]')) return false;
        var style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden') return false;
        return true;
      });
    }

    function openWizard(triggerElement) {
      lastFocusedTrigger = triggerElement || document.activeElement;
      overlay.hidden = false;
      dialog.setAttribute('tabindex', '-1');
      requestAnimationFrame(function () {
        overlay.classList.add('open');
      });
      document.body.style.overflow = 'hidden';
      renderStep();
    }

    function closeWizard() {
      clearAutoAdvanceTimer();
      overlay.classList.remove('open');
      document.body.style.overflow = '';
      setTimeout(function () {
        overlay.hidden = true;
        if (lastFocusedTrigger && typeof lastFocusedTrigger.focus === 'function') {
          try {
            lastFocusedTrigger.focus();
          } catch (e) {}
        }
      }, 350);
    }

    window.openCourseFinder = openWizard;

    // Attach to triggers
    var triggers = [
      'finderTriggerNav',
      'finderTriggerHero',
      'finderTriggerCourses',
      'finderTriggerMobile',
      'finderTrigger2',
      'finderTriggerFooter'
    ];
    triggers.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) {
        el.addEventListener('click', function (e) {
          e.preventDefault();
          currentStepIndex = 0;
          resetAnswers();
          openWizard(el);
        });
      }
    });

    if (closeBtn) closeBtn.addEventListener('click', closeWizard);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeWizard();
    });

    // Keyboard navigation & Focus Trap
    document.addEventListener('keydown', function (e) {
      if (overlay.hidden) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        closeWizard();
        return;
      }

      if (e.key === 'Tab') {
        var focusables = getFocusableElements();
        if (focusables.length === 0) {
          e.preventDefault();
          return;
        }

        var first = focusables[0];
        var last = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first || !dialog.contains(document.activeElement)) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last || !dialog.contains(document.activeElement)) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    });

    function resetAnswers() {
      answers = {
        age: '',
        format: '',
        city: '',
        level: '',
        goals: [],
        wname: '',
        dialcode: '+1',
        phone: ''
      };
      dialog.querySelectorAll('input[type="text"], input[type="tel"]').forEach(function (inp) {
        inp.value = '';
        inp.classList.remove('input-error');
      });
      dialog.querySelectorAll('input[type="radio"], input[type="checkbox"]').forEach(function (inp) {
        inp.checked = false;
      });
      var citySel = document.getElementById('wizardCity');
      if (citySel) {
        citySel.value = '';
        citySel.classList.remove('input-error');
      }
      var dialSel = document.getElementById('wizardDial');
      if (dialSel) dialSel.value = '+1';

      // Ensure qaida option visibility reset
      var qaidaOpt = document.querySelector('.wizard-opt[data-level="qaida"]');
      if (qaidaOpt) qaidaOpt.style.display = '';
    }

    function renderStep() {
      var steps = visibleSteps();
      if (currentStepIndex >= steps.length) currentStepIndex = steps.length - 1;
      var stepNum = steps[currentStepIndex];

      // Show/hide step panels
      dialog.querySelectorAll('.wizard-step').forEach(function (el) {
        var isTarget = parseInt(el.dataset.step, 10) === stepNum;
        el.hidden = !isTarget;
      });

      // Update question for alphabet visibility:
      // If adult is selected, also guarantee the alphabet option is hidden in Step 4
      var qaidaOpt = document.querySelector('.wizard-opt[data-level="qaida"]');
      if (qaidaOpt) {
        qaidaOpt.style.display = (answers.age === 'adult') ? 'none' : '';
      }

      // Progress & Step label
      var totalQuestions = steps.length - 1; // excluding final result step
      if (stepNum === 7) {
        fill.style.width = '100%';
        progress.setAttribute('aria-valuenow', '100');
        stepLabel.textContent = 'Your Tailored Course Match';
      } else {
        var qIndex = currentStepIndex + 1;
        var pct = Math.round(((qIndex - 1) / totalQuestions) * 100);
        fill.style.width = pct + '%';
        progress.setAttribute('aria-valuenow', String(pct));
        stepLabel.textContent = 'Step ' + qIndex + ' of ' + totalQuestions;
      }

      // Back button visibility
      backBtn.style.visibility = currentStepIndex > 0 ? 'visible' : 'hidden';

      // Next / finish button label
      if (stepNum === 7) {
        nextBtn.style.display = 'none';
        backBtn.style.visibility = 'hidden';
      } else if (stepNum === 6) {
        nextBtn.style.display = '';
        nextBtn.textContent = 'Get My Recommendation →';
      } else {
        nextBtn.style.display = '';
        nextBtn.textContent = 'Next →';
      }

      restoreStep(stepNum);

      var firstInput = dialog.querySelector(
        '.wizard-step:not([hidden]) input:checked, .wizard-step:not([hidden]) input:not([type="radio"]):not([type="checkbox"]), .wizard-step:not([hidden]) select, .wizard-step:not([hidden]) input'
      );
      if (firstInput) {
        setTimeout(function () {
          firstInput.focus();
        }, 50);
      }
    }

    function restoreStep(stepNum) {
      if (stepNum === 1) restoreRadio('age');
      if (stepNum === 2) restoreRadio('format');
      if (stepNum === 3) {
        var sel = document.getElementById('wizardCity');
        if (sel && answers.city) sel.value = answers.city;
      }
      if (stepNum === 4) restoreRadio('level');
      if (stepNum === 5) {
        answers.goals.forEach(function (v) {
          var cb = dialog.querySelector('input[name="goals"][value="' + v + '"]');
          if (cb) cb.checked = true;
        });
      }
      if (stepNum === 6) {
        var nameInput = document.getElementById('wizardName');
        var dialInput = document.getElementById('wizardDial');
        var phoneInput = document.getElementById('wizardPhone');
        if (nameInput) nameInput.value = answers.wname || '';
        if (dialInput) dialInput.value = answers.dialcode || '+1';
        if (phoneInput) phoneInput.value = answers.phone || '';
      }
    }

    function restoreRadio(name) {
      var val = answers[name];
      if (!val) return;
      var r = dialog.querySelector('input[name="' + name + '"][value="' + val + '"]');
      if (r) r.checked = true;
    }

    // Auto-advance listeners
    ['age', 'format', 'level'].forEach(function (rname) {
      dialog.querySelectorAll('input[name="' + rname + '"]').forEach(function (r) {
        r.addEventListener('change', function () {
          answers[rname] = r.value;
          if (rname === 'format' && r.value === 'online') {
            answers.city = '';
          }
          clearAutoAdvanceTimer();
          autoAdvanceTimer = setTimeout(advance, 220);
        });
      });
    });

    var nameInp = document.getElementById('wizardName');
    var phoneInp = document.getElementById('wizardPhone');
    var cityInp = document.getElementById('wizardCity');

    if (nameInp) {
      nameInp.addEventListener('input', function () {
        this.classList.remove('input-error');
      });
      nameInp.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          advance();
        }
      });
    }
    if (phoneInp) {
      phoneInp.addEventListener('input', function () {
        this.classList.remove('input-error');
      });
      phoneInp.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          advance();
        }
      });
    }
    if (cityInp) {
      cityInp.addEventListener('change', function () {
        this.classList.remove('input-error');
        answers.city = this.value;
      });
    }

    function collectStep(stepNum) {
      if (stepNum === 1) {
        var r = dialog.querySelector('input[name="age"]:checked');
        answers.age = r ? r.value : '';
      }
      if (stepNum === 2) {
        var r2 = dialog.querySelector('input[name="format"]:checked');
        answers.format = r2 ? r2.value : '';
        if (answers.format === 'online') answers.city = '';
      }
      if (stepNum === 3) {
        var cityEl = document.getElementById('wizardCity');
        answers.city = cityEl ? cityEl.value : '';
      }
      if (stepNum === 4) {
        var r4 = dialog.querySelector('input[name="level"]:checked');
        answers.level = r4 ? r4.value : '';
      }
      if (stepNum === 5) {
        answers.goals = [];
        dialog.querySelectorAll('input[name="goals"]:checked').forEach(function (cb) {
          answers.goals.push(cb.value);
        });
      }
      if (stepNum === 6) {
        var nEl = document.getElementById('wizardName');
        var dEl = document.getElementById('wizardDial');
        var pEl = document.getElementById('wizardPhone');
        answers.wname = nEl ? nEl.value.trim() : '';
        answers.dialcode = dEl ? dEl.value : '+1';
        answers.phone = pEl ? pEl.value.trim() : '';
      }
    }

    function validateStep(stepNum) {
      if (stepNum === 1) return !!answers.age;
      if (stepNum === 2) return !!answers.format;
      if (stepNum === 3) {
        if (!answers.city) {
          if (cityInp) {
            cityInp.classList.add('input-error');
            cityInp.focus();
          }
          return false;
        }
        return true;
      }
      if (stepNum === 4) {
        // If adult, this step is skipped, but if checked ensure valid
        if (answers.age === 'adult') return true;
        return !!answers.level;
      }
      if (stepNum === 5) return true;
      if (stepNum === 6) {
        var valid = true;
        if (!answers.phone) {
          if (phoneInp) {
            phoneInp.classList.add('input-error');
            phoneInp.focus();
          }
          valid = false;
        }
        if (!answers.wname) {
          if (nameInp) {
            nameInp.classList.add('input-error');
            nameInp.focus();
          }
          valid = false;
        }
        return valid;
      }
      return true;
    }

    function advance() {
      clearAutoAdvanceTimer();
      var steps = visibleSteps();
      var stepNum = steps[currentStepIndex];
      collectStep(stepNum);

      if (!validateStep(stepNum)) {
        shakeNextBtn();
        return;
      }

      if (currentStepIndex < steps.length - 1) {
        currentStepIndex++;
        var newSteps = visibleSteps();
        if (currentStepIndex >= newSteps.length) currentStepIndex = newSteps.length - 1;
        renderStep();
        if (newSteps[currentStepIndex] === 7) buildResult();
      }
    }

    function shakeNextBtn() {
      nextBtn.style.transform = 'translateX(-6px)';
      setTimeout(function () {
        nextBtn.style.transform = 'translateX(6px)';
      }, 100);
      setTimeout(function () {
        nextBtn.style.transform = '';
      }, 200);
    }

    function goBack() {
      clearAutoAdvanceTimer();
      if (currentStepIndex > 0) {
        currentStepIndex--;
        renderStep();
      }
    }

    if (nextBtn) nextBtn.addEventListener('click', advance);
    if (backBtn) backBtn.addEventListener('click', goBack);

    function buildResult() {
      var title, desc, courseCode;

      // Personalized Course Recommendation logic
      if (answers.age === 'little' || answers.level === 'beginner') {
        title = "🌱 First Steps with the Qur'an &amp; Noorani Qaida";
        desc = "Perfect foundation for children and beginners: letters, sounds, recognition, and short Surahs at a gentle, loving pace.";
        courseCode = "Noorani Qaida & Kids Foundation";
      } else if (answers.level === 'advanced' || answers.goals.indexOf('hifz') !== -1 || answers.goals.indexOf('ijazah') !== -1) {
        title = "📿 Hifz &amp; Advanced Ijazah Track";
        desc = "Structured memorisation, revision circles, and tajweed precision under senior certified teachers.";
        courseCode = "Hifz & Ijazah Program";
      } else if (answers.goals.indexOf('tafseer') !== -1 || answers.goals.indexOf('understand') !== -1) {
        title = "✨ Sabeel ul Jannah / Nurun Ala Nur (Tafseer)";
        desc = "2.5-year structured Quranic study with Tajweed, Word-by-Word Translation & Tafseer, Tafheem Us Sunnah, Seerah, and post-graduate advanced Nurun Ala Nur courses.";
        courseCode = "Sabeel ul Jannah Tafseer";
      } else if (answers.goals.indexOf('seerah') !== -1) {
        title = "🕌 Seerah of the Prophet Muhammad ﷺ";
        desc = "The sublime character and transformative life of the Final Messenger ﷺ, bringing barakah and purpose into your daily life.";
        courseCode = "Seerah Course";
      } else if (answers.goals.indexOf('tajweed') !== -1 || answers.goals.indexOf('prayer') !== -1 || answers.level === 'reading') {
        title = "🎵 Tajweed Mastery &amp; Fluency Course";
        desc = "Step-by-step Tajweed articulation (Makharij & Sifaat) to recite with confidence and beauty in your daily Salah.";
        courseCode = "Tajweed & Fluency";
      } else if (answers.age === 'adult') {
        title = "🌸 Sisters' Comprehensive Qur'an Circle";
        desc = "Flexible schedule with qualified female scholars — combining Tafseer, Tajweed, and heartfelt sisterhood.";
        courseCode = "Sisters' Qur'an Circle";
      } else {
        title = "🌿 Steady Qur'an &amp; Character Program";
        desc = "Live interactive classes combining recitation improvement, understanding, and good character building.";
        courseCode = "General Quran Program";
      }

      var resTitleEl = document.getElementById('wizardResultTitle');
      var resDescEl = document.getElementById('wizardResultDesc');
      if (resTitleEl) resTitleEl.innerHTML = title;
      if (resDescEl) resDescEl.textContent = desc;

      var labels = {
        age: { little: 'Ages 5–9 (Little One)', teen: 'Ages 10–17 (Teen)', adult: 'Adult / Sister (18+)', family: 'Family Circle' },
        format: { online: 'Online (Live Video Call)', onsite: 'Onsite (In-Person Centre)' },
        level: { beginner: 'Complete Beginner', qaida: 'Knows Alphabet', reading: 'Can Read Quran', advanced: 'Advanced / Hifz' }
      };
      var goalLabels = {
        tajweed: 'Correct Tajweed',
        hifz: 'Memorisation (Hifz)',
        reading: 'Read Arabic',
        understand: 'Understand Meaning',
        tafseer: 'Tafseer',
        seerah: 'Seerah ﷺ',
        character: 'Good Character',
        ijazah: 'Ijazah Track',
        confidence: 'Recitation Confidence',
        prayer: 'Improve Salah'
      };

      var cleanDial = (answers.dialcode || '+1').replace(/-.*/, '');
      var items = [];
      if (answers.age) items.push({ k: 'Who', v: labels.age[answers.age] || answers.age });
      if (answers.format) items.push({ k: 'Format', v: labels.format[answers.format] || answers.format });
      if (answers.format === 'onsite' && answers.city) items.push({ k: 'City', v: answers.city });
      if (answers.age !== 'adult' && answers.level) {
        items.push({ k: 'Level', v: labels.level[answers.level] || answers.level });
      }
      if (answers.goals.length) {
        items.push({
          k: 'Goals',
          v: answers.goals
            .map(function (g) {
              return goalLabels[g] || g;
            })
            .join(', ')
        });
      }
      items.push({ k: 'Name', v: answers.wname });
      items.push({ k: 'WhatsApp', v: cleanDial + ' ' + answers.phone });

      var ul = document.getElementById('wizardSummaryList');
      if (ul) {
        ul.innerHTML = '';
        items.forEach(function (item) {
          var li = document.createElement('li');
          var strong = document.createElement('strong');
          strong.textContent = item.k + ': ';
          var span = document.createElement('span');
          span.textContent = item.v;
          li.appendChild(strong);
          li.appendChild(span);
          ul.appendChild(li);
        });
      }

      var msg = buildWaMessage(courseCode);
      var waHref = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(msg);
      var waBtn = document.getElementById('wizardWaBtn');
      if (waBtn) waBtn.href = waHref;
    }

    function buildWaMessage(courseCode) {
      var goalLabels = {
        tajweed: 'Correct Tajweed',
        hifz: 'Memorisation (Hifz)',
        reading: 'Learn to read Arabic',
        understand: 'Understand the meaning',
        tafseer: 'Tafseer (deep study)',
        seerah: 'Seerah of the Prophet ﷺ',
        character: 'Build good character',
        ijazah: 'Ijazah / certification',
        confidence: 'Recitation confidence',
        prayer: 'Improve Salah recitation'
      };
      var ageMap = { little: 'Ages 5–9', teen: 'Ages 10–17', adult: 'Adult / Sister (18+)', family: 'Family' };
      var cleanDial = (answers.dialcode || '+1').replace(/-.*/, '');

      var lines = [
        'Assalamu alaikum, I used the Course Finder on nurulquran.web.app.',
        '',
        'Name: ' + answers.wname,
        'WhatsApp: ' + cleanDial + ' ' + answers.phone,
        'Who: ' + (ageMap[answers.age] || answers.age),
        'Format: ' + (answers.format === 'onsite' ? 'Onsite (' + answers.city + ')' : 'Online')
      ];

      if (answers.age !== 'adult' && answers.level) {
        var lvlMap = { beginner: 'Complete beginner', qaida: 'Knows alphabet', reading: 'Can read Quran', advanced: 'Advanced/Hifz' };
        lines.push('Level: ' + (lvlMap[answers.level] || answers.level));
      }

      lines.push('Goals: ' + (answers.goals.length ? answers.goals.map(function(g){ return goalLabels[g] || g; }).join(', ') : 'General'));
      lines.push('Recommended Course: ' + courseCode);
      lines.push('');
      lines.push("I would like to arrange my free consultation, jazakum Allah khayr!");

      return lines.join('\n');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCourseFinder);
  } else {
    initCourseFinder();
  }
})();
