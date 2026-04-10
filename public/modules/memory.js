'use strict';
// ─────────────────────────────────────────────
// 页面：Memory 管理
// ─────────────────────────────────────────────
async function renderMemory(container) {
  let mem = {};
  try { const cfg = await getConfig(); mem = (cfg && cfg.memory) || {}; } catch {}
  container.innerHTML = `
    <div class="card" style="margin-bottom:16px">
      <div class="card-header"><div class="card-title"><svg class="card-title-icon" width="18" height="18"><use href="#ico-brain"/></svg> ${t('page_memory')}</div></div>
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
    <div style="display:flex;justify-content:flex-end;gap:8px">
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

