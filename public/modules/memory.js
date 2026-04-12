'use strict';
// ─────────────────────────────────────────────
// 页面：Memory 记忆管理
// ─────────────────────────────────────────────
async function renderMemory(container) {
  let mem = {};
  try { const cfg = await getConfig(); mem = (cfg && cfg.memory) || {}; } catch {}

  let files = [];
  try { files = await api('GET', '/api/memory/files') || []; } catch {}

  container.innerHTML = `
    <style>
      .mem-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
      @media (max-width: 860px) { .mem-grid { grid-template-columns: 1fr; } }
      .mem-file-list { display: flex; flex-direction: column; gap: 8px; }
      .mem-file-card {
        background: var(--surface); border: 1px solid var(--border); border-radius: 10px;
        padding: 12px 14px; cursor: pointer; transition: all 0.15s ease;
      }
      .mem-file-card:hover { border-color: var(--brand); box-shadow: 0 2px 8px rgba(0,0,0,0.05); transform: translateY(-1px); }
      .mem-file-header { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
      .mem-file-name { font-weight: 600; font-size: 13px; color: var(--text); flex: 1; }
      .mem-file-badge { font-size: 10px; padding: 2px 6px; border-radius: 4px; background: #e8f0fe; color: #1a56db; font-weight: 500; }
      .mem-file-excerpt { font-size: 12px; color: var(--text-secondary); line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      .mem-file-meta { font-size: 11px; color: var(--text-muted); margin-top: 6px; display: flex; gap: 12px; }
    </style>

    <!-- 记忆文件列表 -->
    <div class="card" style="margin-bottom:16px">
      <div class="card-header">
        <div class="card-title"><svg class="card-title-icon" width="18" height="18"><use href="#ico-brain"/></svg>📝 记忆文件</div>
        <span style="font-size:12px;color:var(--text-muted)">${files.length} 个文件</span>
      </div>
      <div class="card-body">
        ${files.length ? `<div class="mem-file-list">
          ${files.map((f, i) => `
            <div class="mem-file-card" onclick="openMemoryEditor('${esc(f.path.replace(/\\\\/g, '\\\\\\\\'))}', '${esc(f.name)}')">
              <div class="mem-file-header">
                <span class="mem-file-name">${f.special ? '⭐ ' : '📄 '}${esc(f.name)}</span>
                ${f.special ? '<span class="mem-file-badge">核心记忆</span>' : ''}
              </div>
              <div class="mem-file-excerpt">${esc(f.excerpt || '(空文件)')}</div>
              <div class="mem-file-meta">
                <span>📏 ${typeof formatBytes === 'function' ? formatBytes(f.size) : f.size + 'B'}</span>
                <span>🕐 ${f.lastModified ? timeAgo(f.lastModified) : '--'}</span>
              </div>
            </div>
          `).join('')}
        </div>` : `<div class="empty-state" style="padding:32px">
          <svg class="empty-icon"><use href="#ico-brain"/></svg>
          <div class="empty-title">暂无记忆文件</div>
          <div class="empty-desc">在 ~/.openclaw/memory/ 下创建 .md 文件</div>
        </div>`}
      </div>
    </div>

    <!-- 记忆配置 -->
    <div class="card">
      <div class="card-header"><div class="card-title"><svg class="card-title-icon" width="18" height="18"><use href="#ico-settings"/></svg>记忆配置</div></div>
      <div class="card-body"><div class="config-section">
        <div class="form-group"><label class="form-label">记忆后端</label>
          <select class="form-input" id="mem_backend">
            <option value="local" ${(mem.backend||'local')==='local'?'selected':''}>本地文件</option>
            <option value="qdrant" ${mem.backend==='qdrant'?'selected':''}>Qdrant 向量数据库</option>
            <option value="chroma" ${mem.backend==='chroma'?'selected':''}>Chroma</option>
          </select></div>
        <div class="form-group"><label class="form-label">嵌入模型</label>
          <input class="form-input" id="mem_embed_model" value="${esc(mem.embedModel || '')}" placeholder="text-embedding-3-small" /></div>
        <div class="form-group"><label class="form-label">检索数量 (Top-K)</label>
          <input class="form-input" type="number" id="mem_top_k" value="${mem.topK || 5}" /></div>
        <div class="form-group"><label class="form-label">相似度阈值</label>
          <input class="form-input" type="number" step="0.01" id="mem_threshold" value="${mem.threshold || 0.7}" /></div>
      </div></div>
    </div>
    <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:12px">
      <button class="btn btn-primary" onclick="saveMemory()">${t('save')}</button>
    </div>`;
}

async function saveMemory() {
  const mem = {
    backend: document.getElementById('mem_backend').value,
    embedModel: document.getElementById('mem_embed_model').value.trim() || undefined,
    topK: parseInt(document.getElementById('mem_top_k').value) || 5,
    threshold: parseFloat(document.getElementById('mem_threshold').value) || 0.7,
  };
  try {
    await api('POST', '/api/memory', mem);
    invalidateConfig();
    toast(t('save_ok'), 'success');
  } catch (e) { toast(t('save_fail') + ': ' + e.message, 'error'); }
}

// ─────────────────────────────────────────────
// 记忆文件编辑器 Modal
// ─────────────────────────────────────────────
async function openMemoryEditor(filePath, fileName) {
  let overlay = document.getElementById('mem-editor-overlay');
  if (overlay) overlay.remove();

  overlay = document.createElement('div');
  overlay.id = 'mem-editor-overlay';
  overlay.innerHTML = `
    <style>
      #mem-editor-overlay {
        position: fixed; inset: 0; z-index: 10000;
        background: rgba(0,0,0,0.5); backdrop-filter: blur(4px);
        display: flex; align-items: center; justify-content: center;
        animation: memFadeIn 0.2s ease;
      }
      @keyframes memFadeIn { from { opacity: 0 } to { opacity: 1 } }
      .mem-editor-dialog {
        width: min(90vw, 760px); max-height: 85vh;
        background: var(--surface); border-radius: 16px;
        box-shadow: 0 24px 64px rgba(0,0,0,0.25);
        display: flex; flex-direction: column; overflow: hidden;
        animation: memSlide 0.25s ease;
      }
      @keyframes memSlide { from { transform: translateY(24px); opacity: 0 } }
      .mem-editor-header {
        padding: 14px 20px; border-bottom: 1px solid var(--border);
        display: flex; align-items: center; justify-content: space-between;
      }
      .mem-editor-title { font-weight: 600; font-size: 15px; }
      .mem-editor-body { flex: 1; overflow: hidden; padding: 0; }
      .mem-editor-body textarea {
        width: 100%; height: 100%; min-height: 400px; border: none;
        padding: 16px 20px; font-family: var(--font-mono, 'JetBrains Mono', monospace);
        font-size: 13px; line-height: 1.7; resize: none; background: var(--bg);
        color: var(--text); outline: none;
      }
      .mem-editor-footer {
        padding: 10px 20px; border-top: 1px solid var(--border);
        display: flex; align-items: center; justify-content: space-between;
      }
      .mem-editor-meta { font-size: 12px; color: var(--text-muted); }
    </style>
    <div class="mem-editor-dialog">
      <div class="mem-editor-header">
        <span class="mem-editor-title">📝 ${esc(fileName)}</span>
        <button class="btn btn-ghost" onclick="closeMemoryEditor()">
          <svg width="18" height="18"><use href="#ico-x"/></svg>
        </button>
      </div>
      <div class="mem-editor-body">
        <textarea id="mem-editor-textarea" placeholder="加载中...">加载中...</textarea>
      </div>
      <div class="mem-editor-footer">
        <span class="mem-editor-meta" id="mem-editor-meta">加载中...</span>
        <div style="display:flex;gap:8px">
          <button class="btn btn-ghost" onclick="closeMemoryEditor()">取消</button>
          <button class="btn btn-primary" onclick="saveMemoryFileContent()">💾 保存</button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeMemoryEditor(); });

  // 保存路径供保存时使用
  window._memEditPath = filePath;
  window._memEditName = fileName;

  try {
    const data = await api('GET', `/api/memory/files/${encodeURIComponent(filePath)}`);
    const textarea = document.getElementById('mem-editor-textarea');
    if (textarea) { textarea.value = data.content || ''; textarea.focus(); }
    const meta = document.getElementById('mem-editor-meta');
    if (meta) meta.textContent = `${typeof formatBytes === 'function' ? formatBytes(data.size) : data.size + 'B'} · 修改于 ${data.lastModified ? timeAgo(data.lastModified) : '--'}`;
  } catch (e) {
    const textarea = document.getElementById('mem-editor-textarea');
    if (textarea) textarea.value = '❌ 加载失败: ' + e.message;
  }
}

function closeMemoryEditor() {
  const overlay = document.getElementById('mem-editor-overlay');
  if (overlay) overlay.remove();
  window._memEditPath = null;
  window._memEditName = null;
}

async function saveMemoryFileContent() {
  const textarea = document.getElementById('mem-editor-textarea');
  if (!textarea) return;
  const content = textarea.value;
  const filePath = window._memEditPath;
  const fileName = window._memEditName;

  try {
    await api('PUT', `/api/memory/files/${encodeURIComponent(fileName)}`, { content, path: filePath });
    toast('✅ 保存成功', 'success');
    closeMemoryEditor();
    // 刷新记忆页面
    const container = document.getElementById('pageContent');
    if (container) renderMemory(container);
  } catch (e) {
    toast('❌ 保存失败: ' + e.message, 'error');
  }
}
