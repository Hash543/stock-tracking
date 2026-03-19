const Summary = (() => {
  let data = [];
  let currentSort = 'default';

  function getColorClass(change) {
    if (change > 0) return 'price-up';
    if (change < 0) return 'price-down';
    return 'price-flat';
  }

  function classifySignal(signal) {
    const bullish = ['站上', '超賣', '黃金交叉'];
    const bearish = ['跌破', '超買', '死亡交叉'];
    if (bullish.some((k) => signal.includes(k))) return 'bullish';
    if (bearish.some((k) => signal.includes(k))) return 'bearish';
    return '';
  }

  function renderCard(item) {
    const cls = getColorClass(item.change);
    const arrow = item.change > 0 ? '▲' : item.change < 0 ? '▼' : '';
    const signals = (item.signals || [])
      .map((s) => `<span class="signal-tag ${classifySignal(s)}">${s}</span>`)
      .join('');

    return `
      <div class="summary-card">
        <div class="summary-card-header">
          <span class="summary-card-name">${item.name}</span>
          <span class="summary-card-symbol">${item.symbol.replace('.TW', '')}</span>
        </div>
        <div class="summary-card-price ${cls}">${item.price != null ? item.price.toFixed(2) : '-'}</div>
        <div class="summary-card-change ${cls}">
          ${arrow} ${item.change != null ? Math.abs(item.change).toFixed(2) : '-'}
          (${item.changePercent != null ? item.changePercent.toFixed(2) + '%' : '-'})
        </div>
        <div class="summary-card-meta">
          成交量: ${item.volume != null ? item.volume.toLocaleString('zh-TW') : '-'}
          | ${item.category || ''}
        </div>
        <div class="summary-signals">${signals || '<span class="signal-tag">無訊號</span>'}</div>
      </div>
    `;
  }

  function sortData(arr, sortKey) {
    if (sortKey === 'default') return arr;
    return [...arr].sort((a, b) => {
      const va = a[sortKey] ?? 0;
      const vb = b[sortKey] ?? 0;
      return vb - va; // descending
    });
  }

  function renderAll() {
    const container = document.getElementById('summary-cards');
    const sorted = sortData(data, currentSort);
    container.innerHTML = sorted.map(renderCard).join('');
  }

  async function load() {
    const container = document.getElementById('summary-cards');
    try {
      container.innerHTML = '<div class="loading">載入摘要中...</div>';
      data = await API.get('/api/summary');
      renderAll();
    } catch (err) {
      container.innerHTML = `<div class="loading">載入失敗: ${err.message}</div>`;
    }
  }

  function init() {
    document.querySelectorAll('.sort-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.sort-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        currentSort = btn.dataset.sort;
        renderAll();
      });
    });
  }

  return { init, load };
})();
