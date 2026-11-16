// Vanguard Token Launch Radar - Interactive Dashboard Controller
(function () {
  'use strict';

  const data = window.RADAR || { rows: [], as_of: 'N/A', floor_usd: 0, total_tracked: 0 };
  const state = {
    search: '',
    category: 'ALL',
    rows: data.rows || []
  };

  const el = {
    metrics: document.getElementById('metrics'),
    categories: document.getElementById('categories'),
    tbody: document.getElementById('board-body'),
    search: document.getElementById('search'),
    modal: document.getElementById('modal'),
    modalTitle: document.getElementById('modal-title'),
    modalBody: document.getElementById('modal-body'),
    modalClose: document.getElementById('modal-close'),
    modalBtnClose: document.getElementById('modal-btn-close')
  };

  function formatUsd(amount) {
    if (amount >= 1e9) return '$' + (amount / 1e9).toFixed(2) + 'B';
    if (amount >= 1e6) return '$' + (amount / 1e6).toFixed(1) + 'M';
    return '$' + Number(amount).toLocaleString();
  }

  function renderMetrics() {
    if (!el.metrics) return;
    const totalTvl = state.rows.reduce((acc, r) => acc + (r.tvl_usd || 0), 0);
    const totalImplied = state.rows.reduce((acc, r) => acc + (r.implied_value_usd || 0), 0);
    el.metrics.innerHTML = `
      <div>Tracked: <strong>${state.rows.length}</strong></div>
      <div>Total TVL: <strong>${formatUsd(totalTvl)}</strong></div>
      <div>Implied Pool: <strong>${formatUsd(totalImplied)}</strong></div>
      <div>Snapshot: <strong>${data.as_of}</strong></div>
    `;
  }

  function renderCategoryFilters() {
    if (!el.categories) return;
    const cats = ['ALL', ...new Set(state.rows.map((r) => r.category).filter(Boolean))];
    el.categories.innerHTML = cats.map((cat) => `
      <button class="pill ${state.category === cat ? 'active' : ''}" data-cat="${cat}">${cat}</button>
    `).join('');

    el.categories.querySelectorAll('.pill').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.category = btn.getAttribute('data-cat') || 'ALL';
        renderCategoryFilters();
        renderTable();
      });
    });
  }

  function openDetailModal(row) {
    if (!el.modal || !el.modalTitle || !el.modalBody) return;
    el.modalTitle.textContent = `${row.name} (#${row.rank})`;
    el.modalBody.innerHTML = `
      <div style="margin-bottom: 16px;">
        <p><strong>Category:</strong> ${row.category} | <strong>Chains:</strong> ${(row.chains || []).join(', ')}</p>
        <p><strong>TVL:</strong> ${formatUsd(row.tvl_usd)} | <strong>Implied Value:</strong> ${formatUsd(row.implied_value_usd)}</p>
      </div>
      <h3 style="margin-bottom: 12px; font-size: 14px; text-transform: uppercase; color: var(--accent);">Optimized Farming Action Plan</h3>
      <div>
        ${(row.farm_steps || []).map((step, idx) => `
          <div class="plan-step"><strong>Phase ${idx + 1}:</strong> ${step}</div>
        `).join('')}
      </div>
    `;
    el.modal.classList.remove('hidden');
  }

  function closeModal() {
    if (el.modal) el.modal.classList.add('hidden');
  }

  function renderTable() {
    if (!el.tbody) return;
    const q = state.search.toLowerCase();
    const filtered = state.rows.filter((r) => {
      const matchCat = state.category === 'ALL' || r.category === state.category;
      const matchSearch = !q || r.name.toLowerCase().includes(q) || r.slug.toLowerCase().includes(q) || (r.chains && r.chains.some((c) => c.toLowerCase().includes(q)));
      return matchCat && matchSearch;
    });

    if (filtered.length === 0) {
      el.tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 32px;">No matching launch candidates found.</td></tr>`;
      return;
    }

    el.tbody.innerHTML = filtered.map((r) => `
      <tr>
        <td class="rank-badge">#${r.rank}</td>
        <td><strong>${r.name}</strong> <span style="font-size: 11px; color: var(--text-muted); display: block;">${r.slug}</span></td>
        <td>${r.category}</td>
        <td>${(r.chains || []).slice(0, 3).join(', ')}${r.chains && r.chains.length > 3 ? '...' : ''}</td>
        <td>${formatUsd(r.tvl_usd)}</td>
        <td class="val-pill">${formatUsd(r.implied_value_usd)}</td>
        <td><button class="btn-detail" data-slug="${r.slug}">View Plan</button></td>
      </tr>
    `).join('');

    el.tbody.querySelectorAll('.btn-detail').forEach((btn) => {
      btn.addEventListener('click', () => {
        const slug = btn.getAttribute('data-slug');
        const found = state.rows.find((r) => r.slug === slug);
        if (found) openDetailModal(found);
      });
    });
  }

  if (el.search) {
    el.search.addEventListener('input', (e) => {
      state.search = e.target.value.trim();
      renderTable();
    });
  }

  if (el.modalClose) el.modalClose.addEventListener('click', closeModal);
  if (el.modalBtnClose) el.modalBtnClose.addEventListener('click', closeModal);
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

  renderMetrics();
  renderCategoryFilters();
  renderTable();
})();
