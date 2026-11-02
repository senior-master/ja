const { createClient } = supabase;
const sb = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

const $app = document.getElementById('app');

const state = {
  screen: 'home',
  subjects: [],
  selectedSubject: null,
  questions: [],
  index: 0,
  answers: [],
  count: 40,
};

function prettyName(slug) {
  return slug.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
}

function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

async function boot() {
  $app.innerHTML = '<div class="card center">Loading subjects…</div>';
  try {
    const { data, error } = await sb
      .from('question_stats')
      .select('subject_slug, total')
      .order('subject_slug');
    if (error) throw error;
    state.subjects = (data || []).filter(s => s.total >= 10);
    if (!state.subjects.length) throw new Error('No subjects with enough questions yet. Import still running.');
    render();
  } catch (err) {
    $app.innerHTML = `<div class="card error">❌ ${escapeHtml(err.message)}</div>`;
  }
}

function render() {
  if (state.screen === 'home') renderHome();
  else if (state.screen === 'quiz') renderQuiz();
  else if (state.screen === 'results') renderResults();
}

function renderHome() {
  const cards = state.subjects.map(s => `
    <button class="subject-card" data-slug="${escapeHtml(s.subject_slug)}">
      <div class="name">${prettyName(s.subject_slug)}</div>
      <div class="count">${s.total} questions</div>
    </button>
  `).join('');

  $app.innerHTML = `
    <div class="home">
      <div class="controls">
        <label>Questions per quiz:
          <select id="count-select">
            <option value="20">20</option>
            <option value="40" selected>40</option>
            <option value="60">60</option>
            <option value="100">100</option>
          </select>
        </label>
      </div>
      <div class="subject-grid">${cards}</div>
    </div>
  `;

  document.getElementById('count-select').addEventListener('change', e => {
    state.count = parseInt(e.target.value, 10);
  });
  $app.querySelectorAll('.subject-card').forEach(btn => {
    btn.addEventListener('click', () => startQuiz(btn.dataset.slug));
  });
}

async function startQuiz(slug) {
  $app.innerHTML = `<div class="card center">Loading ${prettyName(slug)} questions…</div>`;
  try {
    const { data, error } = await sb.rpc('get_random_questions', {
      p_subject: slug,
      p_count: state.count,
    });
    if (error) throw error;
    if (!data || !data.length) throw new Error('No questions available for this subject yet.');
    state.screen = 'quiz';
    state.selectedSubject = slug;
    state.questions = data;
    state.index = 0;
    state.answers = [];
    render();
  } catch (err) {
    $app.innerHTML = `<div class="card error">❌ ${escapeHtml(err.message)}<br><br><button class="btn" onclick="location.reload()">Back</button></div>`;
  }
}

function renderQuiz() {
  const q = state.questions[state.index];
  const total = state.questions.length;
  const progress = (state.index / total * 100).toFixed(1);
  const userAnswer = state.answers[state.index];

  const options = ['A', 'B', 'C', 'D'].map(letter => {
    const text = q['option_' + letter.toLowerCase()];
    let cls = 'option';
    if (userAnswer) {
      if (letter === q.correct_answer) cls += ' correct';
      else if (letter === userAnswer.chosen) cls += ' wrong';
    }
    return `<button class="${cls}" data-letter="${letter}" ${userAnswer ? 'disabled' : ''}>
      <span class="letter">${letter}</span>
      <span class="text">${escapeHtml(text)}</span>
    </button>`;
  }).join('');

  const footer = userAnswer ? `
    <div class="explanation">
      <strong>${userAnswer.chosen === q.correct_answer ? '✅ Correct!' : '❌ Incorrect — correct answer is ' + q.correct_answer}</strong>
      ${q.explanation ? `<div class="explain-text">${escapeHtml(q.explanation)}</div>` : ''}
    </div>
    <button class="btn primary" id="next-btn">${state.index + 1 === total ? 'See Results →' : 'Next Question →'}</button>
  ` : '';

  $app.innerHTML = `
    <div class="quiz">
      <div class="quiz-header">
        <div class="progress-bar"><div class="progress-fill" style="width:${progress}%"></div></div>
        <div class="meta">
          <span>${prettyName(state.selectedSubject)}</span>
          <span>${state.index + 1} / ${total}</span>
        </div>
      </div>
      <div class="question-block">
        <div class="topic-tag">${escapeHtml(q.topic)} · ${escapeHtml(q.subtopic)}</div>
        <h2 class="question-text">${escapeHtml(q.question)}</h2>
        <div class="options">${options}</div>
        ${footer}
      </div>
    </div>
  `;

  if (!userAnswer) {
    $app.querySelectorAll('.option').forEach(btn => {
      btn.addEventListener('click', () => chooseAnswer(btn.dataset.letter));
    });
  } else {
    document.getElementById('next-btn').addEventListener('click', nextQuestion);
  }
}

function chooseAnswer(letter) {
  const q = state.questions[state.index];
  state.answers[state.index] = { chosen: letter, correct: letter === q.correct_answer };
  render();
}

function nextQuestion() {
  if (state.index + 1 >= state.questions.length) {
    state.screen = 'results';
    render();
    return;
  }
  state.index++;
  render();
}

function renderResults() {
  const total = state.questions.length;
  const correct = state.answers.filter(a => a && a.correct).length;
  const pct = Math.round(correct / total * 100);

  const wrongItems = state.questions
    .map((q, i) => ({ q, a: state.answers[i] }))
    .filter(({ a }) => a && !a.correct)
    .map(({ q, a }) => `
      <div class="wrong-item">
        <div class="wrong-q">${escapeHtml(q.question)}</div>
        <div class="wrong-meta">
          <span class="bad">Your answer: ${a.chosen}) ${escapeHtml(q['option_' + a.chosen.toLowerCase()])}</span>
          <span class="good">Correct: ${q.correct_answer}) ${escapeHtml(q['option_' + q.correct_answer.toLowerCase()])}</span>
        </div>
      </div>
    `).join('');

  $app.innerHTML = `
    <div class="results">
      <div class="score-card">
        <div class="score-pct">${pct}%</div>
        <div class="score-detail">${correct} / ${total} correct</div>
      </div>
      <div class="result-actions">
        <button class="btn primary" id="retry-btn">Retry ${prettyName(state.selectedSubject)}</button>
        <button class="btn" id="home-btn">Other Subject</button>
      </div>
      ${wrongItems
        ? `<div class="wrong-list"><h3>Review (${total - correct} missed)</h3>${wrongItems}</div>`
        : '<div class="perfect">🎉 Perfect score!</div>'}
    </div>
  `;

  document.getElementById('retry-btn').addEventListener('click', () => startQuiz(state.selectedSubject));
  document.getElementById('home-btn').addEventListener('click', () => {
    state.screen = 'home';
    render();
  });
}

boot();
