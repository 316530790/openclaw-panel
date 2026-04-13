'use strict';
// ─────────────────────────────────────────────
// 页面：用量统计
// ─────────────────────────────────────────────
async function renderUsage(container) {
  container.innerHTML = `<div class="card"><div class="card-body" style="text-align:center;padding:48px;color:var(--text-muted)">⏳ 正在统计用量数据...</div></div>`;

  let data;
  try {
    data = await api('GET', '/api/usage');
  } catch (e) {
    container.innerHTML = `<div class="card"><div class="card-body" style="padding:24px;color:#e74c3c">❌ 加载失败: ${esc(e.message)}</div></div>`;
    return;
  }

  const t_total = data.totals || {};
  const maxDaily = Math.max(...(data.daily || []).map(d => d.totalTokens), 1);
  const maxModel = Math.max(...(data.byModel || []).map(d => d.totalTokens), 1);

  container.innerHTML = `
    <style>
      .usage-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 20px; }
      .usage-card {
        background: var(--surface); border: 1px solid var(--border); border-radius: 12px;
        padding: 16px 18px; position: relative; overflow: hidden;
      }
      .usage-card::before {
        content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
        border-radius: 12px 12px 0 0;
      }
      .usage-card:nth-child(1)::before { background: linear-gradient(90deg, #e8772e, #f0a060); }
      .usage-card:nth-child(2)::before { background: linear-gradient(90deg, #3498db, #74b9ff); }
      .usage-card:nth-child(3)::before { background: linear-gradient(90deg, #27ae60, #6dd5a0); }
      .usage-card:nth-child(4)::before { background: linear-gradient(90deg, #8e44ad, #c39bd3); }
      .usage-card-label { font-size: 12px; color: var(--text-muted); margin-bottom: 4px; }
      .usage-card-value { font-size: 26px; font-weight: 700; color: var(--text); }
      .usage-card-sub { font-size: 11px; color: var(--text-secondary); margin-top: 2px; }

      .usage-section { margin-bottom: 20px; }
      .usage-section-title { font-size: 14px; font-weight: 600; color: var(--text); margin-bottom: 12px; display: flex; align-items: center; gap: 6px; }

      .usage-chart { display: flex; align-items: flex-end; gap: 4px; height: 120px; padding: 8px 0; }
      .usage-bar-group { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; }
      .usage-bar {
        width: 100%; max-width: 32px; border-radius: 4px 4px 0 0; min-height: 2px;
        background: linear-gradient(180deg, #e8772e, #f0a060);
        transition: height 0.4s ease;
      }
      .usage-bar-label { font-size: 10px; color: var(--text-muted); text-align: center; line-height: 1.2; }
      .usage-bar-value { font-size: 10px; color: var(--text-secondary); font-weight: 500; }

      .usage-model-row {
        display: flex; align-items: center; gap: 12px; padding: 8px 0;
        border-bottom: 1px solid var(--border);
      }
      .usage-model-row:last-child { border-bottom: none; }
      .usage-model-name { font-size: 13px; font-weight: 500; width: 160px; flex-shrink: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .usage-model-bar-wrap { flex: 1; height: 20px; background: var(--bg); border-radius: 10px; overflow: hidden; }
      .usage-model-bar { height: 100%; border-radius: 10px; background: linear-gradient(90deg, #6c5ce7, #a29bfe); transition: width 0.4s ease; }
      .usage-model-tokens { font-size: 12px; color: var(--text-muted); width: 80px; text-align: right; flex-shrink: 0; }

      .usage-agent-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px; }
      .usage-agent-card {
        background: var(--surface); border: 1px solid var(--border); border-radius: 10px;
        padding: 12px 14px; display: flex; flex-direction: column; gap: 6px;
      }
      .usage-agent-name { font-weight: 600; font-size: 13px; }
      .usage-agent-stat { font-size: 12px; color: var(--text-secondary); display: flex; justify-content: space-between; }
    </style>

    <!-- 顶部数字卡片 -->
    <div class="usage-cards">
      <div class="usage-card">
        <div class="usage-card-label">📊 总 Token 用量</div>
        <div class="usage-card-value">${formatTokens(t_total.totalTokens)}</div>
        <div class="usage-card-sub">最近20个会话</div>
      </div>
      <div class="usage-card">
        <div class="usage-card-label">📥 输入 Token</div>
        <div class="usage-card-value">${formatTokens(t_total.inputTokens)}</div>
        <div class="usage-card-sub">${t_total.inputTokens ? ((t_total.inputTokens / t_total.totalTokens * 100) || 0).toFixed(0) : 0}% 占比</div>
      </div>
      <div class="usage-card">
        <div class="usage-card-label">📤 输出 Token</div>
        <div class="usage-card-value">${formatTokens(t_total.outputTokens)}</div>
        <div class="usage-card-sub">${t_total.outputTokens ? ((t_total.outputTokens / t_total.totalTokens * 100) || 0).toFixed(0) : 0}% 占比</div>
      </div>
      <div class="usage-card">
        <div class="usage-card-label">💰 费用估算</div>
        <div class="usage-card-value">$${estimateAllCost(data)}</div>
        <div class="usage-card-sub">${(data.byModel || []).length} 个模型</div>
      </div>
    </div>

    <!-- 每日趋势 -->
    <div class="card usage-section">
      <div class="card-header"><div class="card-title">📈 每日 Token 用量趋势</div></div>
      <div class="card-body">
        ${(data.daily && data.daily.length) ? `
          <div class="usage-chart">
            ${data.daily.map(d => `
              <div class="usage-bar-group">
                <div class="usage-bar-value">${formatTokens(d.totalTokens)}</div>
                <div class="usage-bar" style="height:${Math.max((d.totalTokens / maxDaily) * 100, 2)}%"></div>
                <div class="usage-bar-label">${d.date.slice(5)}</div>
              </div>
            `).join('')}
          </div>
        ` : `<div style="text-align:center;padding:24px;color:var(--text-muted)">暂无每日数据</div>`}
      </div>
    </div>

    <!-- 模型分布 -->
    <div class="card usage-section">
      <div class="card-header"><div class="card-title">🧠 模型用量分布</div></div>
      <div class="card-body">
        ${(data.byModel || []).length ? data.byModel.map(m => `
          <div class="usage-model-row">
            <div class="usage-model-name" title="${esc(m.model)}">${esc(m.model)}</div>
            <div class="usage-model-bar-wrap">
              <div class="usage-model-bar" style="width:${(m.totalTokens / maxModel * 100).toFixed(1)}%"></div>
            </div>
            <div class="usage-model-tokens">${formatTokens(m.totalTokens)}</div>
          </div>
        `).join('') : '<div style="text-align:center;padding:24px;color:var(--text-muted)">暂无模型数据</div>'}
      </div>
    </div>

    <!-- Agent 用量 -->
    <div class="card usage-section">
      <div class="card-header"><div class="card-title">🤖 Agent 用量明细</div></div>
      <div class="card-body">
        <div class="usage-agent-grid">
          ${(data.byAgent || []).map(a => `
            <div class="usage-agent-card">
              <div class="usage-agent-name">${esc(a.name || a.agentId)}</div>
              <div class="usage-agent-stat"><span>📥 输入</span><span>${formatTokens(a.inputTokens)}</span></div>
              <div class="usage-agent-stat"><span>📤 输出</span><span>${formatTokens(a.outputTokens)}</span></div>
              <div class="usage-agent-stat"><span>📊 合计</span><span style="font-weight:600">${formatTokens(a.totalTokens)}</span></div>
              <div class="usage-agent-stat"><span>💬 会话数</span><span>${a.sessions}</span></div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>`;
}

// estimateAllCost is now provided by app.js (uses estimateCostUnified with PROVIDER_PRESETS pricing)
