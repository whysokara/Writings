// --- helpers ---

function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function renderPiece(rawText) {
  const text = rawText.replace(/\r\n/g, '\n').trim();
  const parts = text.split(/\n\s*\n/);
  const title = parts.shift() || '';
  const body = parts
    .map((p) => `<p>${escapeHtml(p.trim()).replace(/\n/g, '<br>')}</p>`)
    .join('');
  return `<h2>${escapeHtml(title)}</h2>${body}`;
}

async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  return res.json();
}

async function getText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  return res.text();
}

// --- tabs ---

document.querySelectorAll('.tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
  });
});

// --- Library ---

async function loadLibrary() {
  const list = document.getElementById('published-list');
  const titles = await getJson('/api/published');
  list.innerHTML = '';
  titles.forEach((title) => {
    const li = document.createElement('li');
    li.textContent = title;
    li.addEventListener('click', async () => {
      list.querySelectorAll('li').forEach((el) => el.classList.remove('active'));
      li.classList.add('active');
      const text = await getText(`/api/published/${encodeURIComponent(title)}`);
      document.getElementById('published-reader').innerHTML = renderPiece(text);
    });
    list.appendChild(li);
  });
}

// --- Draft ---

const draftSelect = document.getElementById('draft-select');
const draftNameInput = document.getElementById('draft-name');
const draftText = document.getElementById('draft-text');
const draftStatus = document.getElementById('draft-status');

async function loadDraftList(preserveSelection) {
  const drafts = await getJson('/api/drafts');
  const previous = preserveSelection ? draftSelect.value : '';
  draftSelect.innerHTML = '<option value="">— new draft —</option>';
  drafts.forEach((name) => {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    draftSelect.appendChild(opt);
  });
  if (previous && drafts.includes(previous)) draftSelect.value = previous;
  return drafts;
}

async function loadGenerateDraftList() {
  const select = document.getElementById('generate-select');
  const drafts = await getJson('/api/drafts');
  const previous = select.value;
  select.innerHTML = '';
  drafts.forEach((name) => {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    select.appendChild(opt);
  });
  if (previous && drafts.includes(previous)) select.value = previous;
}

draftSelect.addEventListener('change', async () => {
  if (draftSelect.value === '') {
    draftNameInput.classList.remove('hidden');
    draftNameInput.value = '';
    draftText.value = '';
  } else {
    draftNameInput.classList.add('hidden');
    draftText.value = await getText(`/api/drafts/${encodeURIComponent(draftSelect.value)}`);
  }
  draftStatus.textContent = '';
});

document.getElementById('draft-save').addEventListener('click', async () => {
  const name = draftSelect.value || draftNameInput.value.trim();
  if (!name) {
    draftStatus.textContent = 'Enter a name for the new draft.';
    return;
  }
  await fetch(`/api/drafts/${encodeURIComponent(name)}`, {
    method: 'PUT',
    body: draftText.value,
  });
  draftStatus.textContent = `Saved at ${new Date().toLocaleTimeString()}`;
  await loadDraftList(true);
  draftSelect.value = name;
  draftNameInput.classList.add('hidden');
  await loadGenerateDraftList();
});

// --- Generate ---

const logOutput = document.getElementById('log-output');
const generateBtn = document.getElementById('generate-btn');
const generateResult = document.getElementById('generate-result');
const versionHistory = document.getElementById('version-history');

function appendLog(line) {
  logOutput.textContent += line + '\n';
  logOutput.parentElement.scrollTop = logOutput.parentElement.scrollHeight;
}

async function renderVersionHistory(basename, activeFile) {
  const groups = await getJson('/api/final');
  const entries = groups[basename] || [];
  versionHistory.innerHTML = '';
  entries.forEach(({ file, version }) => {
    const a = document.createElement('a');
    a.href = '#';
    a.textContent = `v${String(version).padStart(2, '0')}`;
    if (file === activeFile) a.style.fontWeight = 'bold';
    a.addEventListener('click', async (e) => {
      e.preventDefault();
      const text = await getText(`/api/final/${encodeURIComponent(file)}`);
      generateResult.innerHTML = renderPiece(text);
    });
    versionHistory.appendChild(a);
  });
}

generateBtn.addEventListener('click', () => {
  const select = document.getElementById('generate-select');
  const basename = select.value;
  if (!basename) return;

  generateBtn.disabled = true;
  logOutput.textContent = '';
  generateResult.innerHTML = '<p class="empty-hint">Generating…</p>';
  versionHistory.innerHTML = '';

  const source = new EventSource(`/api/generate?basename=${encodeURIComponent(basename)}`);

  source.addEventListener('log', (e) => {
    const { line } = JSON.parse(e.data);
    appendLog(line);
  });

  source.addEventListener('error', (e) => {
    if (e.data) {
      const { message } = JSON.parse(e.data);
      appendLog(`Error: ${message}`);
      generateResult.innerHTML = `<p class="empty-hint">Generation failed: ${escapeHtml(message)}</p>`;
    }
    source.close();
    generateBtn.disabled = false;
  });

  source.addEventListener('done', async (e) => {
    const { file } = JSON.parse(e.data);
    appendLog(`Done: ${file}`);
    const text = await getText(`/api/final/${encodeURIComponent(file)}`);
    generateResult.innerHTML = renderPiece(text);
    await renderVersionHistory(basename, file);
    source.close();
    generateBtn.disabled = false;
  });
});

// --- init ---

loadLibrary();
loadDraftList(false);
loadGenerateDraftList();
