'use strict';
// ─────────────────────────────────────────────
// 页面：Cron
// ─────────────────────────────────────────────
async function renderCron(container) {
  let jobs = [];
  try { jobs = await api('GET', '/api/cron') || []; } catch {}

  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div class="card-title"><svg class="card-title-icon" width="18" height="18"><use href="#ico-cron"/></svg>${t('page_cron')}</div>
        <button class="btn btn-primary btn-sm" onclick="openAddCronModal()">${t('cron_add')}</button>
      </div>
      <div class="card-body">
        ${renderCronTable(jobs)}
      </div>
    </div>`;
}

function renderCronTable(jobs) {
  if (!jobs.length) return `<div class="empty-state"><div class="empty-icon">⏰</div><div class="empty-title">${t('no_data')}</div><div class="empty-desc">点击右上角新增定时任务</div></div>`;
  return `<table class="data-table">
    <thead><tr><th>ID</th><th>名称</th><th>调度</th><th>状态</th><th>上次运行</th><th>操作</th></tr></thead>
    <tbody>${jobs.map(j => {
      const sched = j.schedule ? (j.schedule.expr || j.schedule.kind + ':' + (j.schedule.everyMs||j.schedule.at||'')) : '--';
      const state = j.state || {};
      return `<tr>
        <td class="mono">${esc(j.id)}</td>
        <td>${esc(j.name)}</td>
        <td class="mono" style="font-size:0.78rem">${esc(sched)}</td>
        <td><span class="badge ${j.enabled?'badge-green':'badge-gray'}">${j.enabled?t('cron_enabled'):t('cron_disabled')}</span></td>
        <td style="font-size:0.78rem">${state.lastRunAtMs ? new Date(state.lastRunAtMs).toLocaleString() : '--'}</td>
        <td>
          <button class="btn btn-sm" onclick="toggleCronEnabled('${esc(j.id)}', ${!j.enabled})">${j.enabled?'暂停':'启用'}</button>
          <button class="btn btn-sm btn-danger" onclick="deleteCron('${esc(j.id)}')"><svg width="13" height="13" style="flex-shrink:0"><use href="#ico-trash"/></svg></button>
        </td>
      </tr>`;
    }).join('')}</tbody>
  </table>`;
}

function openAddCronModal() {
  openModal(`
    <div class="modal modal-lg">
      <div class="modal-header"><div class="modal-title">新增定时任务</div><button class="modal-close" onclick="closeModal()" title="关闭"><svg width="16" height="16"><use href="#ico-x"/></svg></button></div>
      <div class="modal-body">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">${t('cron_id')} <span class="required">*</span></label>
            <input type="text" id="cron_id" class="form-input mono" placeholder="daily-summary" />
          </div>
          <div class="form-group">
            <label class="form-label">${t('cron_name')} <span class="required">*</span></label>
            <input type="text" id="cron_name" class="form-input" placeholder="每日摘要" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">${t('cron_schedule')}</label>
          <div class="radio-group" id="schedKindGroup">
            <label class="radio-option"><input type="radio" name="schedKind" value="cron" checked onchange="updateCronScheduleForm()"> ${t('cron_type_cron')}</label>
            <label class="radio-option"><input type="radio" name="schedKind" value="every" onchange="updateCronScheduleForm()"> ${t('cron_type_every')}</label>
            <label class="radio-option"><input type="radio" name="schedKind" value="at" onchange="updateCronScheduleForm()"> ${t('cron_type_at')}</label>
          </div>
          <div id="schedSubForm" style="margin-top:10px">
            <input type="text" id="cron_expr" class="form-input mono" placeholder="0 9 * * *（每天9点）" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">${t('cron_payload')}</label>
          <div class="radio-group">
            <label class="radio-option"><input type="radio" name="payloadKind" value="agentTurn" checked onchange="updateCronPayloadForm()"> ${t('cron_payload_agent')}</label>
            <label class="radio-option"><input type="radio" name="payloadKind" value="systemEvent" onchange="updateCronPayloadForm()"> ${t('cron_payload_system')}</label>
          </div>
          <div id="payloadSubForm" style="margin-top:10px">
            <textarea id="cron_message" class="form-textarea" placeholder="请你总结今日工作内容..." rows="3"></textarea>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Session 目标</label>
            <select id="cron_sessionTarget" class="form-select">
              <option value="main">main（主会话）</option>
              <option value="isolated">isolated（独立会话）</option>
              <option value="current">current（当前会话）</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">状态</label>
            <select id="cron_enabled" class="form-select">
              <option value="true">启用</option>
              <option value="false">禁用</option>
            </select>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn" onclick="closeModal()">${t('cancel')}</button>
        <button class="btn btn-primary" onclick="saveCron()">${t('save')}</button>
      </div>
    </div>`);
}

function updateCronScheduleForm() {
  const kind = document.querySelector('input[name="schedKind"]:checked')?.value || 'cron';
  const sub = document.getElementById('schedSubForm');
  if (!sub) return;
  if (kind === 'cron') sub.innerHTML = `<input type="text" id="cron_expr" class="form-input mono" placeholder="0 9 * * *" />`;
  else if (kind === 'every') sub.innerHTML = `<input type="number" id="cron_everyMs" class="form-input" placeholder="3600000（1小时）" />`;
  else sub.innerHTML = `<input type="datetime-local" id="cron_at" class="form-input" />`;
}

function updateCronPayloadForm() {
  const kind = document.querySelector('input[name="payloadKind"]:checked')?.value || 'agentTurn';
  const sub = document.getElementById('payloadSubForm');
  if (!sub) return;
  if (kind === 'agentTurn') sub.innerHTML = `<textarea id="cron_message" class="form-textarea" placeholder="请你总结今日工作内容..." rows="3"></textarea>`;
  else sub.innerHTML = `<input type="text" id="cron_sysText" class="form-input" placeholder="heartbeat" />`;
}

async function saveCron() {
  const id = document.getElementById('cron_id')?.value?.trim();
  const name = document.getElementById('cron_name')?.value?.trim();
  if (!id || !name) { toast(t('required_field'), 'error'); return; }

  const kind = document.querySelector('input[name="schedKind"]:checked')?.value || 'cron';
  let schedule;
  if (kind === 'cron') schedule = { kind: 'cron', expr: document.getElementById('cron_expr')?.value || '' };
  else if (kind === 'every') schedule = { kind: 'every', everyMs: parseInt(document.getElementById('cron_everyMs')?.value || '0') };
  else schedule = { kind: 'at', at: document.getElementById('cron_at')?.value || '' };

  const payloadKind = document.querySelector('input[name="payloadKind"]:checked')?.value || 'agentTurn';
  let payload;
  if (payloadKind === 'agentTurn') payload = { kind: 'agentTurn', message: document.getElementById('cron_message')?.value || '' };
  else payload = { kind: 'systemEvent', text: document.getElementById('cron_sysText')?.value || '' };

  const body = {
    id, name,
    enabled: document.getElementById('cron_enabled')?.value !== 'false',
    schedule,
    sessionTarget: document.getElementById('cron_sessionTarget')?.value || 'main',
    wakeMode: 'next-heartbeat',
    payload,
  };

  try {
    await api('POST', '/api/cron', body);
    toast(t('save_ok'), 'success');
    closeModal();
    navigate('cron');
  } catch (e) { toast(t('save_fail') + ': ' + e.message, 'error'); }
}

async function toggleCronEnabled(id, enabled) {
  try {
    await api('PUT', `/api/cron/${encodeURIComponent(id)}`, { enabled });
    toast(t('save_ok'), 'success');
    navigate('cron');
  } catch (e) { toast(t('op_fail') + ': ' + e.message, 'error'); }
}

async function deleteCron(id) {
  confirmDialog('删除定时任务', `确认删除任务 "${id}"？`, async () => {
    try {
      await api('DELETE', `/api/cron/${encodeURIComponent(id)}`);
      toast(t('delete_ok'), 'success');
      navigate('cron');
    } catch (e) { toast(t('op_fail') + ': ' + e.message, 'error'); }
  }, true);
}

