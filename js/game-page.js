// js/game-page.js
import { getRandomSubject, saveResponse } from './supabase.js';
import { scorePlea }                       from './ia.js';
import { startTimer, formatTime, validateContent } from './game.js';
import { getPlayer, navigateTo, showToast, setLoading } from './ui.js';
import { MAX_CHARS } from './config.js';

let subject      = null;
let camp         = 'POUR';
let stopTimer    = null;
let timerStarted = false;

const campSection = document.getElementById('camp-section');
const campBadge   = document.getElementById('camp-badge');
const subjectText = document.getElementById('subject-text');
const subjectCat  = document.getElementById('subject-category');
const timerEl     = document.getElementById('timer');
const textarea    = document.getElementById('plea-textarea');
const charCount   = document.getElementById('char-count');
const submitBtn   = document.getElementById('submit-btn');
const submitForm  = document.getElementById('plea-form');
const changeBtn   = document.getElementById('change-subject-btn');
const startBtn    = document.getElementById('start-btn');
const pregameBar  = document.getElementById('pregame-bar');
const pleaSection = document.getElementById('plea-section');

const CATEGORY_LABELS = {
  absurde:       '🎭 Absurde',
  societal:      '🏛️ Sociétal',
  philosophique: '🧠 Philosophique'
};

async function init() {
  const player = getPlayer();
  if (!player) { navigateTo('index.html'); return; }

  await loadSubject();

  campSection.style.display = '';
  pregameBar.style.display  = '';
  renderCamp();

  changeBtn.addEventListener('click', async () => {
    if (timerStarted) return;
    setLoading(changeBtn, true);
    try {
      await loadSubject(subject?.id);
      renderCamp();
    } finally {
      setLoading(changeBtn, false);
    }
  });

  startBtn.addEventListener('click', () => {
    if (!subject) { showToast('Attends le chargement du sujet.', 'info'); return; }
    pregameBar.style.display = 'none';
    pleaSection.hidden = false;
    timerStarted = true;
    startGame();
  });
}

async function loadSubject(excludeId = null) {
  subjectText.textContent = 'Chargement…';
  subjectText.style.color = 'var(--color-text-muted)';
  subjectCat.textContent  = '…';
  try {
    subject = await getRandomSubject(excludeId);
    camp    = Math.random() < 0.5 ? 'POUR' : 'CONTRE';
    subjectText.textContent = subject.text;
    subjectText.style.color = '';
    subjectCat.textContent  = CATEGORY_LABELS[subject.category] || subject.category;
  } catch (err) {
    showToast('Erreur de connexion à la base de données.', 'error');
    subjectText.textContent = 'Impossible de charger un sujet.';
    console.error(err);
  }
}

function renderCamp() {
  if (!camp) return;
  campBadge.textContent = camp;
  campBadge.className   = `camp-badge camp-badge--${camp.toLowerCase()}`;
  campSection.className = `camp-section camp-section--${camp.toLowerCase()}`;
  document.getElementById('camp-instruction').textContent =
    camp === 'POUR'
      ? 'Défends cette affirmation avec conviction !'
      : 'Attaque cette affirmation sans merci !';
}

function startGame() {
  stopTimer = startTimer(
    (remaining) => {
      timerEl.textContent = formatTime(remaining);
      timerEl.className   = 'timer' + (remaining <= 20 ? ' timer--urgent' : '');
    },
    () => {
      timerEl.textContent = '00:00';
      timerEl.className   = 'timer timer--expired';
      showToast('Temps écoulé ! Soumets ta plaidoirie.', 'info');
    }
  );
}

textarea.addEventListener('input', () => {
  const len = textarea.value.length;
  charCount.textContent = `${len} / ${MAX_CHARS}`;
  charCount.className   = 'char-count' + (len > MAX_CHARS ? ' char-count--over' : '');
});

submitForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!subject) { showToast('Aucun sujet chargé.', 'error'); return; }

  const player  = getPlayer();
  const content = textarea.value;
  const err     = validateContent(content);
  if (err) { showToast(err, 'error'); return; }

  if (stopTimer) stopTimer();
  setLoading(submitBtn, true);

  try {
    const scores = await scorePlea({ subject: subject.text, camp, content });
    await saveResponse({
      playerId:  player.id,
      subjectId: subject.id,
      camp,
      content,
      scores
    });
    navigateTo('results.html', { scores, camp, subject: subject.text });
  } catch (err) {
    showToast('Erreur lors de la soumission. Réessaie.', 'error');
    console.error(err);
    setLoading(submitBtn, false);
    if (timerStarted) startGame();
  }
});

init();
