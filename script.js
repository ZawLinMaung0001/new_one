/**
 * CCNA 2 Study & Practice - Vanilla JavaScript
 * Loads questions dynamically from /data/chapterN.json.
 * JSON format: [{ question, image, options, answer [, answers] }]
 */

(function () {
  "use strict";

  const OPTION_LABELS = ["A", "B", "C", "D", "E", "F"];
  const CHAPTERS = [
    { id: "chapter6", label: "Chapter 6" },
    { id: "chapter7", label: "Chapter 7" },
    { id: "chapter8", label: "Chapter 8" },
    { id: "chapter9", label: "Chapter 9" },
    { id: "chapter10", label: "Chapter 10" },
  ];

  function getDataPath(chapterId) {
    const num = chapterId.replace("chapter", "");
    return "data/chapter" + num + ".json";
  }

  function normOpt(s) {
    return (s || "").trim().toLowerCase();
  }

  function normalizeQuestionFromJson(item) {
    const options = Array.isArray(item.options) ? item.options : [];
    const correctIndexes = [];

    if (Array.isArray(item.answers) && item.answers.length > 0) {
      item.answers.forEach(function (ans) {
        const a = normOpt(ans);
        const idx = options.findIndex(function (o) { return normOpt(o) === a; });
        if (idx !== -1 && correctIndexes.indexOf(idx) === -1) correctIndexes.push(idx);
      });
    }

    if (correctIndexes.length === 0 && item.answer) {
      const a = normOpt(item.answer);
      const idx = options.findIndex(function (o) { return normOpt(o) === a; });
      if (idx !== -1) correctIndexes.push(idx);
    }

    if (correctIndexes.length === 0 && options.length) correctIndexes.push(0);
    correctIndexes.sort(function (a, b) { return a - b; });

    return {
      question: item.question || "",
      image: item.image || "",
      options: options,
      correctIndexes: correctIndexes,
    };
  }

  function loadChapterQuestions(chapterId) {
    const path = getDataPath(chapterId);
    return fetch(path)
      .then(function (res) {
        if (!res.ok) throw new Error("Failed to load " + path);
        return res.json();
      })
      .then(function (json) {
        const list = Array.isArray(json) ? json : [];
        return list.map(normalizeQuestionFromJson);
      })
      .catch(function (err) {
        console.error(err);
        return [];
      });
  }

  // ---------------------------------------------------------------------------
  // DOM
  // ---------------------------------------------------------------------------
  const loadingWrap = document.getElementById("loadingWrap");

  const navHome = document.getElementById("navHome");
  const navStudy = document.getElementById("navStudy");
  const navPractice = document.getElementById("navPractice");
  const navFinal = document.getElementById("navFinal");
  const homeSection = document.getElementById("homeSection");
  const studySection = document.getElementById("studySection");
  const practiceSection = document.getElementById("practiceSection");
  const examSection = document.getElementById("examSection");

  // Study mode
  const studyChapters = document.getElementById("studyChapters");
  const studyGroups = document.getElementById("studyGroups");
  const studyHeading = document.getElementById("studyHeading");
  const studySubheading = document.getElementById("studySubheading");
  const studyContent = document.getElementById("studyContent");
  const btnChapterExam = document.getElementById("btnChapterExam");

  // Home quick actions
  const homeGoStudy = document.getElementById("homeGoStudy");
  const homeGoPractice = document.getElementById("homeGoPractice");
  const homeGoFinal = document.getElementById("homeGoFinal");

  // Practice mode
  const chapterSelect = document.getElementById("chapterSelect");
  const progressText = document.getElementById("progressText");
  const progressFill = document.getElementById("progressFill");
  const quizSection = document.getElementById("quizSection");
  const resultsSection = document.getElementById("resultsSection");
  const questionNumber = document.getElementById("questionNumber");
  const questionText = document.getElementById("questionText");
  const questionImageWrap = document.getElementById("questionImageWrap");
  const questionImage = document.getElementById("questionImage");
  const multiHint = document.getElementById("multiHint");
  const optionsContainer = document.getElementById("optionsContainer");
  const feedback = document.getElementById("feedback");
  const correctCountEl = document.getElementById("correctCount");
  const incorrectCountEl = document.getElementById("incorrectCount");
  const totalScoreEl = document.getElementById("totalScore");
  const btnPrev = document.getElementById("btnPrev");
  const btnNext = document.getElementById("btnNext");
  const btnRestart = document.getElementById("btnRestart");

  // Exam mode
  const examIntroCard = document.getElementById("examIntroCard");
  const examTitle = document.getElementById("examTitle");
  const examSubtitle = document.getElementById("examSubtitle");
  const btnStartExam = document.getElementById("btnStartExam");
  const examQuizCard = document.getElementById("examQuizCard");
  const examResultsCard = document.getElementById("examResultsCard");
  const examProgressText = document.getElementById("examProgressText");
  const examProgressFill = document.getElementById("examProgressFill");
  const examQuestionNumber = document.getElementById("examQuestionNumber");
  const examQuestionText = document.getElementById("examQuestionText");
  const examQuestionImageWrap = document.getElementById("examQuestionImageWrap");
  const examQuestionImage = document.getElementById("examQuestionImage");
  const examOptionsContainer = document.getElementById("examOptionsContainer");
  const examBtnPrev = document.getElementById("examBtnPrev");
  const examBtnNext = document.getElementById("examBtnNext");
  const examResultsTitle = document.getElementById("examResultsTitle");
  const examCorrectCount = document.getElementById("examCorrectCount");
  const examIncorrectCount = document.getElementById("examIncorrectCount");
  const examTotalScore = document.getElementById("examTotalScore");
  const examResultsList = document.getElementById("examResultsList");
  const examRestart = document.getElementById("examRestart");

  // ---------------------------------------------------------------------------
  // App state
  // ---------------------------------------------------------------------------
  const cache = new Map(); // chapterId -> normalized questions[]

  const studyState = {
    chapterId: "chapter6",
    groupStart: 0, // 0-based
    groupSize: 10,
  };

  const practiceState = {
    chapterId: "chapter6",
    questions: [],
    currentIndex: 0,
    answers: [], // { selectedIndexes: number[], correct: boolean }
    answered: false,
  };

  const examState = {
    mode: "final", // "final" | "chapter"
    chapterId: "chapter6",
    questions: [],
    currentIndex: 0,
    answers: [], // { selectedIndexes: number[] }
  };

  // ---------------------------------------------------------------------------
  // Mode switching
  // ---------------------------------------------------------------------------
  function setMode(mode) {
    const isHome = mode === "home";
    const isStudy = mode === "study";
    const isPractice = mode === "practice";
    const isExam = mode === "exam";

    homeSection.classList.toggle("hidden", !isHome);
    studySection.classList.toggle("hidden", !isStudy);
    practiceSection.classList.toggle("hidden", !isPractice);
    examSection.classList.toggle("hidden", !isExam);

    navHome.classList.toggle("is-active", isHome);
    navStudy.classList.toggle("is-active", isStudy);
    navPractice.classList.toggle("is-active", isPractice);
    navFinal.classList.toggle("is-active", isExam);

    navHome.setAttribute("aria-current", isHome ? "page" : "false");
    navStudy.setAttribute("aria-current", isStudy ? "page" : "false");
    navPractice.setAttribute("aria-current", isPractice ? "page" : "false");
    navFinal.setAttribute("aria-current", isExam ? "page" : "false");
  }

  // ---------------------------------------------------------------------------
  // Shared helpers
  // ---------------------------------------------------------------------------
  function showLoading(show) {
    loadingWrap.classList.toggle("hidden", !show);
  }

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  function getCorrectIndexes(q) {
    if (q.correctIndexes && q.correctIndexes.length) return q.correctIndexes;
    if (typeof q.correctIndex === "number") return [q.correctIndex];
    return [];
  }

  function shuffle(list) {
    const arr = list.slice();
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }

  function sampleQuestions(list, count) {
    if (!list.length) return [];
    const max = Math.min(count, list.length);
    return shuffle(list).slice(0, max);
  }

  function selectionsMatch(a, b) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i += 1) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

  async function ensureChapterLoaded(chapterId) {
    if (cache.has(chapterId)) return cache.get(chapterId);
    showLoading(true);
    const list = await loadChapterQuestions(chapterId);
    cache.set(chapterId, list);
    showLoading(false);
    return list;
  }

  // ---------------------------------------------------------------------------
  // Study Mode
  // ---------------------------------------------------------------------------
  function buildStudyChapterButtons() {
    studyChapters.innerHTML = "";
    CHAPTERS.forEach(function (ch) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "pill";
      btn.textContent = ch.label;
      btn.dataset.chapterId = ch.id;
      btn.addEventListener("click", function () {
        selectStudyChapter(ch.id);
      });
      studyChapters.appendChild(btn);
    });
  }

  function setActivePill(container, matchFn) {
    container.querySelectorAll(".pill").forEach(function (el) {
      el.classList.toggle("is-active", matchFn(el));
    });
  }

  function makeGroupLabel(start, end) {
    return start + "-" + end;
  }

  async function selectStudyChapter(chapterId) {
    studyState.chapterId = chapterId;
    studyState.groupStart = 0;

    setActivePill(studyChapters, function (el) {
      return el.dataset.chapterId === chapterId;
    });

    const questions = await ensureChapterLoaded(chapterId);
    renderStudyGroups(questions.length);
    const chapterMatch = CHAPTERS.find(function (c) { return c.id === chapterId; });
    studyHeading.textContent = chapterMatch ? chapterMatch.label : "Questions";
    studySubheading.textContent = "Select a group to view answers.";
    studyContent.innerHTML = '<div class="muted">Choose a group above.</div>';
  }

  function renderStudyGroups(total) {
    studyGroups.innerHTML = "";
    if (!total) {
      studyGroups.innerHTML = '<div class="muted">No questions found. Run the scraper: npm run scrape.</div>';
      return;
    }

    const groupSize = studyState.groupSize;
    for (let start = 1; start <= total; start += groupSize) {
      const end = Math.min(start + groupSize - 1, total);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "pill";
      btn.textContent = makeGroupLabel(start, end);
      btn.dataset.groupStart = String(start - 1);
      btn.addEventListener("click", function () {
        selectStudyGroup(parseInt(btn.dataset.groupStart, 10));
      });
      studyGroups.appendChild(btn);
    }

    setActivePill(studyGroups, function (el) {
      return parseInt(el.dataset.groupStart || "0", 10) === studyState.groupStart;
    });
  }

  async function selectStudyGroup(groupStart) {
    studyState.groupStart = groupStart;
    setActivePill(studyGroups, function (el) {
      return parseInt(el.dataset.groupStart || "0", 10) === groupStart;
    });

    const questions = await ensureChapterLoaded(studyState.chapterId);
    renderStudyQuestions(questions);
  }

  function renderStudyQuestions(questions) {
    const total = questions.length;
    if (!total) {
      studySubheading.textContent = "No questions found for this chapter.";
      studyContent.innerHTML = '<div class="muted">Run the scraper: npm run scrape.</div>';
      return;
    }

    const startIndex = studyState.groupStart;
    const endIndex = Math.min(startIndex + studyState.groupSize, total);
    const visible = questions.slice(startIndex, endIndex);

    studySubheading.textContent = makeGroupLabel(startIndex + 1, endIndex) + " of " + total;
    studyContent.innerHTML = "";

    visible.forEach(function (q, idx) {
      const qIndex = startIndex + idx;
      const correctIndexes = getCorrectIndexes(q);
      const labels = OPTION_LABELS.slice(0, q.options.length);

      const card = document.createElement("div");
      card.className = "qcard";

      const head = document.createElement("div");
      head.className = "qcard-head";
      head.innerHTML =
        '<div><div class="qbadge">Q' +
        (qIndex + 1) +
        '</div><p class="qtext">' +
        escapeHtml(q.question) +
        "</p></div>";
      card.appendChild(head);

      if (q.image && q.image.trim()) {
        const wrap = document.createElement("div");
        wrap.className = "qimage-wrap";
        const img = document.createElement("img");
        img.className = "qimage";
        img.src = q.image;
        img.alt = "Refer to exhibit";
        img.onerror = function () { wrap.remove(); };
        wrap.appendChild(img);
        card.appendChild(wrap);
      }

      const ul = document.createElement("ul");
      ul.className = "study-options";
      q.options.forEach(function (opt, optIdx) {
        const li = document.createElement("li");
        li.className = "study-option" + (correctIndexes.indexOf(optIdx) !== -1 ? " correct" : "");
        li.innerHTML =
          '<span class="opt-label">' +
          escapeHtml(labels[optIdx] + ".") +
          "</span>" +
          "<span>" +
          escapeHtml(opt) +
          "</span>";
        ul.appendChild(li);
      });
      card.appendChild(ul);

      studyContent.appendChild(card);
    });
  }

  // ---------------------------------------------------------------------------
  // Practice Mode
  // ---------------------------------------------------------------------------
  function showPracticeQuiz() {
    quizSection.classList.remove("hidden");
    resultsSection.classList.add("hidden");
  }

  function showPracticeResults() {
    quizSection.classList.add("hidden");
    resultsSection.classList.remove("hidden");
    const correct = practiceState.answers.filter(function (a) { return a.correct; }).length;
    const incorrect = practiceState.answers.length - correct;
    const total = practiceState.questions.length;
    correctCountEl.textContent = correct;
    incorrectCountEl.textContent = incorrect;
    totalScoreEl.textContent = correct + " / " + total;
  }

  function updatePracticeProgress() {
    const total = practiceState.questions.length;
    const current = total ? practiceState.currentIndex + 1 : 0;
    progressText.textContent = "Question " + current + " of " + total;
    const pct = total > 0 ? (current / total) * 100 : 0;
    progressFill.style.width = pct + "%";
    const bar = progressFill.parentElement;
    if (bar) bar.setAttribute("aria-valuenow", String(Math.round(pct)));
  }

  function updatePracticeNavButtons() {
    btnPrev.disabled = practiceState.currentIndex === 0;
    if (practiceState.currentIndex === practiceState.questions.length - 1) {
      btnNext.textContent = practiceState.answered ? "See Results" : "Next";
    } else {
      btnNext.textContent = "Next";
    }
  }

  function renderPracticeQuestion() {
    const q = practiceState.questions[practiceState.currentIndex];
    if (!q) return;

    const correctIndexes = getCorrectIndexes(q);
    const isMulti = correctIndexes.length > 1;
    questionNumber.textContent = "Q" + (practiceState.currentIndex + 1);
    questionText.textContent = q.question;

    if (q.image && q.image.trim()) {
      questionImageWrap.hidden = false;
      questionImage.style.display = "";
      questionImage.src = q.image;
      questionImage.alt = "Refer to exhibit";
      questionImage.onerror = function () { questionImageWrap.hidden = true; };
    } else {
      questionImageWrap.hidden = true;
      questionImage.src = "";
    }

    multiHint.hidden = !isMulti;

    optionsContainer.innerHTML = "";
    feedback.className = "feedback";
    feedback.innerHTML = "";

    const labels = OPTION_LABELS.slice(0, q.options.length);
    q.options.forEach(function (optionText, index) {
      const id = "opt-" + practiceState.currentIndex + "-" + index;
      const label = document.createElement("label");
      label.className = "option";
      label.htmlFor = id;

      const input = document.createElement("input");
      input.type = isMulti ? "checkbox" : "radio";
      input.name = isMulti ? "answer-" + practiceState.currentIndex : "answer";
      input.value = String(index);
      input.id = id;
      input.disabled = practiceState.answered;

      if (isMulti) input.addEventListener("change", function () { /* wait for Check */ });
      else input.addEventListener("change", onPracticeSingleSelect);

      const spanLabel = document.createElement("span");
      spanLabel.textContent = (labels[index] || "?") + ".";
      const spanText = document.createElement("span");
      spanText.textContent = optionText;

      label.appendChild(input);
      label.appendChild(spanLabel);
      label.appendChild(spanText);
      optionsContainer.appendChild(label);
    });

    // For multi-correct, use a Check button (still vanilla, consistent with dataset).
    if (isMulti && !practiceState.answered) {
      const checkWrap = document.createElement("div");
      checkWrap.className = "nav-buttons";
      const checkBtn = document.createElement("button");
      checkBtn.type = "button";
      checkBtn.className = "btn btn-check";
      checkBtn.textContent = "Check answer";
      checkBtn.addEventListener("click", onPracticeMultiCheck);
      checkWrap.appendChild(checkBtn);
      optionsContainer.appendChild(checkWrap);
    }

    updatePracticeProgress();
    updatePracticeNavButtons();
  }

  function showPracticeFeedback(correct, q) {
    const correctIndexes = getCorrectIndexes(q);
    const labels = OPTION_LABELS.slice(0, q.options.length);
    if (correct) {
      feedback.className = "feedback correct-msg";
      feedback.textContent = "Correct";
      return;
    }
    feedback.className = "feedback incorrect-msg";
    const parts = correctIndexes.map(function (idx) {
      return labels[idx] + ". " + escapeHtml(q.options[idx]);
    });
    feedback.innerHTML =
      "Incorrect." +
      ' <span class="correct-answer">Correct answer(s): ' +
      parts.join("; ") +
      "</span>";
  }

  function lockAndMarkPracticeOptions(selectedIndexes, correct) {
    const q = practiceState.questions[practiceState.currentIndex];
    const correctIndexes = getCorrectIndexes(q);
    optionsContainer.querySelectorAll(".option").forEach(function (opt, index) {
      opt.classList.add("disabled");
      if (correctIndexes.indexOf(index) !== -1) opt.classList.add("correct");
      if (!correct && selectedIndexes.indexOf(index) !== -1 && correctIndexes.indexOf(index) === -1) {
        opt.classList.add("incorrect");
      }
    });
    optionsContainer.querySelectorAll("input").forEach(function (inp) { inp.disabled = true; });
  }

  function onPracticeSingleSelect() {
    if (practiceState.answered) return;
    const checked = document.querySelector('input[name="answer"]:checked');
    if (!checked) return;
    const selectedIndex = parseInt(checked.value, 10);

    const q = practiceState.questions[practiceState.currentIndex];
    const correctIndexes = getCorrectIndexes(q);
    const correct = correctIndexes.length === 1 && selectedIndex === correctIndexes[0];

    practiceState.answers[practiceState.currentIndex] = { selectedIndexes: [selectedIndex], correct: correct };
    practiceState.answered = true;

    showPracticeFeedback(correct, q);
    lockAndMarkPracticeOptions([selectedIndex], correct);
    updatePracticeNavButtons();
  }

  function onPracticeMultiCheck() {
    const q = practiceState.questions[practiceState.currentIndex];
    if (!q || practiceState.answered) return;
    const correctIndexes = getCorrectIndexes(q).slice().sort(function (a, b) { return a - b; });
    const selected = Array.from(optionsContainer.querySelectorAll('input[type="checkbox"]:checked')).map(function (inp) {
      return parseInt(inp.value, 10);
    }).sort(function (a, b) { return a - b; });
    const correct = selected.length === correctIndexes.length && selected.every(function (v, i) { return v === correctIndexes[i]; });

    practiceState.answers[practiceState.currentIndex] = { selectedIndexes: selected, correct: correct };
    practiceState.answered = true;

    showPracticeFeedback(correct, q);
    lockAndMarkPracticeOptions(selected, correct);
    const checkBtn = optionsContainer.querySelector(".btn-check");
    if (checkBtn) checkBtn.disabled = true;
    updatePracticeNavButtons();
  }

  function goPracticePrev() {
    if (practiceState.currentIndex <= 0) return;
    practiceState.currentIndex--;
    practiceState.answered = !!practiceState.answers[practiceState.currentIndex];
    renderPracticeQuestion();

    // If revisiting answered question, re-apply markings
    const ans = practiceState.answers[practiceState.currentIndex];
    if (ans) {
      const q = practiceState.questions[practiceState.currentIndex];
      const correctIndexes = getCorrectIndexes(q);
      const correct = ans.correct;
      showPracticeFeedback(correct, q);
      lockAndMarkPracticeOptions(ans.selectedIndexes || [], correct);
    }
  }

  function goPracticeNext() {
    if (practiceState.currentIndex < practiceState.questions.length - 1) {
      practiceState.currentIndex++;
      practiceState.answered = !!practiceState.answers[practiceState.currentIndex];
      renderPracticeQuestion();

      const ans = practiceState.answers[practiceState.currentIndex];
      if (ans) {
        const q = practiceState.questions[practiceState.currentIndex];
        showPracticeFeedback(ans.correct, q);
        lockAndMarkPracticeOptions(ans.selectedIndexes || [], ans.correct);
      }
      return;
    }

    // end
    if (!practiceState.answers[practiceState.currentIndex] && !practiceState.answered) return;
    showPracticeResults();
  }

  async function initPracticeForChapter(chapterId) {
    practiceState.chapterId = chapterId;
    practiceState.currentIndex = 0;
    practiceState.answers = [];
    practiceState.answered = false;

    showLoading(true);
    const questions = await ensureChapterLoaded(chapterId);
    showLoading(false);

    practiceState.questions = questions;
    showPracticeQuiz();

    if (!questions.length) {
      progressText.textContent = "Question 0 of 0";
      feedback.className = "feedback incorrect-msg";
      feedback.textContent = "No questions found. Run the scraper: npm run scrape.";
      optionsContainer.innerHTML = "";
      btnPrev.disabled = true;
      btnNext.disabled = true;
      return;
    }

    btnNext.disabled = false;
    renderPracticeQuestion();
  }

  function restartPractice() {
    initPracticeForChapter(chapterSelect.value);
  }

  // ---------------------------------------------------------------------------
  // Exam Mode (Chapter Practice + Final)
  // ---------------------------------------------------------------------------
  function showExamIntro(title, subtitle, buttonLabel) {
    examTitle.textContent = title;
    examSubtitle.textContent = subtitle;
    btnStartExam.textContent = buttonLabel;
    examIntroCard.classList.remove("hidden");
    examQuizCard.classList.add("hidden");
    examResultsCard.classList.add("hidden");
  }

  function showExamQuiz() {
    examIntroCard.classList.add("hidden");
    examQuizCard.classList.remove("hidden");
    examResultsCard.classList.add("hidden");
  }

  function showExamResults() {
    examQuizCard.classList.add("hidden");
    examResultsCard.classList.remove("hidden");
  }

  function updateExamProgress() {
    const total = examState.questions.length;
    const current = total ? examState.currentIndex + 1 : 0;
    examProgressText.textContent = "Question " + current + " of " + total;
    const pct = total > 0 ? (current / total) * 100 : 0;
    examProgressFill.style.width = pct + "%";
    const bar = examProgressFill.parentElement;
    if (bar) bar.setAttribute("aria-valuenow", String(Math.round(pct)));
  }

  function getExamSelectedIndexes() {
    return Array.from(examOptionsContainer.querySelectorAll("input:checked")).map(function (inp) {
      return parseInt(inp.value, 10);
    });
  }

  function storeExamSelection() {
    const selected = getExamSelectedIndexes();
    examState.answers[examState.currentIndex] = { selectedIndexes: selected };
  }

  function updateExamNextState() {
    const selected = getExamSelectedIndexes();
    examBtnNext.disabled = selected.length === 0;
  }

  function renderExamQuestion() {
    const q = examState.questions[examState.currentIndex];
    if (!q) return;

    const correctIndexes = getCorrectIndexes(q);
    const isMulti = correctIndexes.length > 1;
    const labels = OPTION_LABELS.slice(0, q.options.length);
    const existing = examState.answers[examState.currentIndex];
    const selectedIndexes = existing ? existing.selectedIndexes || [] : [];

    examQuestionNumber.textContent = "Q" + (examState.currentIndex + 1);
    examQuestionText.textContent = q.question;

    if (q.image && q.image.trim()) {
      examQuestionImageWrap.hidden = false;
      examQuestionImage.style.display = "";
      examQuestionImage.src = q.image;
      examQuestionImage.alt = "Refer to exhibit";
      examQuestionImage.onerror = function () { examQuestionImageWrap.hidden = true; };
    } else {
      examQuestionImageWrap.hidden = true;
      examQuestionImage.src = "";
    }

    examOptionsContainer.innerHTML = "";
    q.options.forEach(function (optionText, index) {
      const id = "exam-opt-" + examState.currentIndex + "-" + index;
      const label = document.createElement("label");
      label.className = "option";
      label.htmlFor = id;

      const input = document.createElement("input");
      input.type = isMulti ? "checkbox" : "radio";
      input.name = isMulti ? "exam-answer-" + examState.currentIndex : "exam-answer";
      input.value = String(index);
      input.id = id;
      input.checked = selectedIndexes.indexOf(index) !== -1;
      input.addEventListener("change", updateExamNextState);

      const spanLabel = document.createElement("span");
      spanLabel.textContent = (labels[index] || "?") + ".";
      const spanText = document.createElement("span");
      spanText.textContent = optionText;

      label.appendChild(input);
      label.appendChild(spanLabel);
      label.appendChild(spanText);
      examOptionsContainer.appendChild(label);
    });

    examBtnPrev.disabled = examState.currentIndex === 0;
    examBtnNext.textContent = examState.currentIndex === examState.questions.length - 1 ? "Finish Exam" : "Next";

    updateExamProgress();
    updateExamNextState();
  }

  function renderExamResults() {
    const total = examState.questions.length;
    let correctCount = 0;
    examResultsList.innerHTML = "";

    examState.questions.forEach(function (q, index) {
      const correctIndexes = getCorrectIndexes(q).slice().sort(function (a, b) { return a - b; });
      const answer = examState.answers[index] || { selectedIndexes: [] };
      const selected = (answer.selectedIndexes || []).slice().sort(function (a, b) { return a - b; });
      const isCorrect = selectionsMatch(selected, correctIndexes);
      if (isCorrect) correctCount += 1;

      const card = document.createElement("div");
      card.className = "qcard";

      const head = document.createElement("div");
      head.className = "qcard-head";
      head.innerHTML =
        '<div><div class="qbadge">Q' +
        (index + 1) +
        '</div><p class="qtext">' +
        escapeHtml(q.question) +
        "</p></div>";
      card.appendChild(head);

      if (q.image && q.image.trim()) {
        const wrap = document.createElement("div");
        wrap.className = "qimage-wrap";
        const img = document.createElement("img");
        img.className = "qimage";
        img.src = q.image;
        img.alt = "Refer to exhibit";
        img.onerror = function () { wrap.remove(); };
        wrap.appendChild(img);
        card.appendChild(wrap);
      }

      const ul = document.createElement("ul");
      ul.className = "study-options";
      const labels = OPTION_LABELS.slice(0, q.options.length);
      q.options.forEach(function (opt, optIdx) {
        const li = document.createElement("li");
        const isCorrectOpt = correctIndexes.indexOf(optIdx) !== -1;
        const isSelected = selected.indexOf(optIdx) !== -1;
        li.className = "study-option";
        if (isCorrectOpt) li.classList.add("correct");
        if (isSelected && !isCorrectOpt) li.classList.add("incorrect");
        li.innerHTML =
          '<span class="opt-label">' +
          escapeHtml(labels[optIdx] + ".") +
          "</span>" +
          "<span>" +
          escapeHtml(opt) +
          "</span>";
        ul.appendChild(li);
      });
      card.appendChild(ul);

      const verdict = document.createElement("p");
      verdict.className = "exam-verdict " + (isCorrect ? "correct-msg" : "incorrect-msg");
      verdict.textContent = isCorrect ? "Correct" : "Incorrect";
      card.appendChild(verdict);

      examResultsList.appendChild(card);
    });

    const incorrectCount = total - correctCount;
    examCorrectCount.textContent = correctCount;
    examIncorrectCount.textContent = incorrectCount;
    examTotalScore.textContent = correctCount + " / " + total;
  }

  async function startExamWithQuestions(title, subtitle, questions) {
    examTitle.textContent = title;
    examSubtitle.textContent = subtitle;
    examResultsTitle.textContent = title + " Results";

    examState.currentIndex = 0;
    examState.questions = questions;
    examState.answers = [];

    showExamQuiz();

    if (!questions.length) {
      examOptionsContainer.innerHTML = "";
      examQuestionText.textContent = "No questions found.";
      examProgressText.textContent = "Question 0 of 0";
      examBtnPrev.disabled = true;
      examBtnNext.disabled = true;
      return;
    }

    renderExamQuestion();
  }

  async function startChapterExam(chapterId) {
    examState.mode = "chapter";
    examState.chapterId = chapterId;
    setMode("exam");
    showLoading(true);
    const questions = await ensureChapterLoaded(chapterId);
    showLoading(false);
    const sampled = sampleQuestions(questions, 20);
    const label = CHAPTERS.find(function (c) { return c.id === chapterId; });
    const title = (label ? label.label : "Chapter") + " Practice Exam";
    const subtitle = sampled.length + " questions, 1 mark each.";
    startExamWithQuestions(title, subtitle, sampled);
  }

  async function startFinalExam() {
    examState.mode = "final";
    setMode("exam");
    showLoading(true);
    const lists = await Promise.all(CHAPTERS.map(function (c) { return ensureChapterLoaded(c.id); }));
    showLoading(false);
    const merged = [].concat.apply([], lists);
    const sampled = sampleQuestions(merged, 50);
    startExamWithQuestions("Final Exam", "50 questions from Chapters 6-10.", sampled);
  }

  function openFinalExamIntro() {
    examState.mode = "final";
    setMode("exam");
    showExamIntro("Final Exam", "50 questions from Chapters 6-10.", "Start Final Exam");
  }

  function goExamPrev() {
    if (examState.currentIndex <= 0) return;
    storeExamSelection();
    examState.currentIndex -= 1;
    renderExamQuestion();
  }

  function goExamNext() {
    storeExamSelection();
    if (examState.currentIndex < examState.questions.length - 1) {
      examState.currentIndex += 1;
      renderExamQuestion();
      return;
    }

    renderExamResults();
    showExamResults();
  }

  // ---------------------------------------------------------------------------
  // Events
  // ---------------------------------------------------------------------------
  navHome.addEventListener("click", function () { setMode("home"); });
  navStudy.addEventListener("click", function () { setMode("study"); });
  navPractice.addEventListener("click", function () { setMode("practice"); });
  navFinal.addEventListener("click", function () { openFinalExamIntro(); });

  homeGoStudy.addEventListener("click", function () { setMode("study"); });
  homeGoPractice.addEventListener("click", function () { setMode("practice"); });
  homeGoFinal.addEventListener("click", function () { startFinalExam(); });

  chapterSelect.addEventListener("change", function () {
    initPracticeForChapter(chapterSelect.value);
  });

  btnPrev.addEventListener("click", goPracticePrev);
  btnNext.addEventListener("click", goPracticeNext);
  btnRestart.addEventListener("click", restartPractice);

  btnChapterExam.addEventListener("click", function () {
    startChapterExam(studyState.chapterId);
  });

  btnStartExam.addEventListener("click", function () {
    startFinalExam();
  });
  examBtnPrev.addEventListener("click", goExamPrev);
  examBtnNext.addEventListener("click", goExamNext);
  examRestart.addEventListener("click", function () {
    if (examState.mode === "chapter") {
      startChapterExam(examState.chapterId);
    } else {
      startFinalExam();
    }
  });

  // ---------------------------------------------------------------------------
  // Boot
  // ---------------------------------------------------------------------------
  buildStudyChapterButtons();
  setMode("home");
  selectStudyChapter("chapter6");
  initPracticeForChapter("chapter6");

  // ---------------------------------------------------------------------------
  // PWA: Service worker registration (Android-friendly, lightweight)
  // ---------------------------------------------------------------------------
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("./service-worker.js").catch(function (err) {
        console.warn("Service worker registration failed:", err);
      });
    });
  }
})();
