const Watchlist = (() => {
  let refreshTimer = null;
  let activeCategory = null;
  let allQuotes = [];
  let healthData = {};

  function formatNumber(n) {
    if (n == null) return '-';
    return n.toLocaleString('zh-TW');
  }

  function formatPrice(n) {
    if (n == null) return '-';
    return n.toFixed(2);
  }

  function getColorClass(change) {
    if (change > 0) return 'price-up';
    if (change < 0) return 'price-down';
    return 'price-flat';
  }

  function getHealthClass(level) {
    if (level === '強勢') return 'health-strong';
    if (level === '偏多') return 'health-bullish';
    if (level === '中性') return 'health-neutral';
    if (level === '偏空') return 'health-bearish';
    if (level === '弱勢') return 'health-weak';
    return '';
  }

  function renderHealthCell(symbol) {
    const h = healthData[symbol];
    if (!h || h.score == null) return '<td class="health-cell">-</td>';
    const cls = getHealthClass(h.level);
    return `<td class="health-cell"><span class="health-badge ${cls}" title="MA:${h.details.ma} RSI:${h.details.rsi} MACD:${h.details.macd} 量能:${h.details.volume} 動能:${h.details.momentum}">${h.score} <small>${h.level}</small></span></td>`;
  }

  function renderRow(q) {
    const cls = getColorClass(q.change);
    const arrow = q.change > 0 ? '▲' : q.change < 0 ? '▼' : '';
    return `
      <tr class="stock-row" data-symbol="${q.symbol}">
        <td>${q.symbol.replace('.TW', '')}</td>
        <td>${q.name}</td>
        ${renderHealthCell(q.symbol)}
        <td class="${cls}">${formatPrice(q.price)}</td>
        <td class="${cls}">${arrow} ${formatPrice(Math.abs(q.change))}</td>
        <td class="${cls}">${q.changePercent != null ? q.changePercent.toFixed(2) + '%' : '-'}</td>
        <td>${formatNumber(q.volume)}</td>
        <td>${formatPrice(q.dayHigh)}</td>
        <td>${formatPrice(q.dayLow)}</td>
      </tr>
    `;
  }

  function renderFilterBar() {
    const categories = [...new Set(allQuotes.map((q) => q.category).filter(Boolean))].sort();
    const bar = document.getElementById('category-filters');
    if (!bar || categories.length <= 1) {
      if (bar) bar.innerHTML = '';
      return;
    }

    const allActive = activeCategory === null ? 'active' : '';
    let html = `<button class="filter-btn ${allActive}" data-category="">全部</button>`;
    categories.forEach((cat) => {
      const active = activeCategory === cat ? 'active' : '';
      html += `<button class="filter-btn ${active}" data-category="${cat}">${cat}</button>`;
    });
    bar.innerHTML = html;

    bar.querySelectorAll('.filter-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeCategory = btn.dataset.category || null;
        renderTable();
      });
    });
  }

  function renderTable() {
    const body = document.getElementById('watchlist-body');
    const filtered = activeCategory
      ? allQuotes.filter((q) => q.category === activeCategory)
      : allQuotes;

    if (filtered.length === 0) {
      body.innerHTML = '<tr><td colspan="9" class="loading">沒有符合的股票</td></tr>';
      renderFilterBar();
      return;
    }

    body.innerHTML = filtered.map(renderRow).join('');
    renderFilterBar();
    bindRowClicks();
  }

  async function loadHealth() {
    try {
      const results = await API.get('/api/health');
      healthData = {};
      results.forEach((h) => { healthData[h.symbol] = h; });
    } catch (err) {
      console.error('Failed to load health data:', err.message);
    }
  }

  async function load() {
    const body = document.getElementById('watchlist-body');
    try {
      const [quotes] = await Promise.all([API.get('/api/quotes'), loadHealth()]);
      allQuotes = quotes;
      if (allQuotes.length === 0) {
        body.innerHTML = '<tr><td colspan="9" class="loading">自選股清單是空的，請至設定新增股票</td></tr>';
        return;
      }
      renderTable();
    } catch (err) {
      body.innerHTML = `<tr><td colspan="9" class="loading">載入失敗: ${err.message}</td></tr>`;
    }
  }

  function bindRowClicks() {
    document.querySelectorAll('.stock-row').forEach((row) => {
      row.addEventListener('click', () => {
        ChartView.show(row.dataset.symbol);
      });
    });
  }

  function startAutoRefresh() {
    stopAutoRefresh();
    refreshTimer = setInterval(load, 30000);
  }

  function stopAutoRefresh() {
    if (refreshTimer) {
      clearInterval(refreshTimer);
      refreshTimer = null;
    }
  }

  return { load, startAutoRefresh, stopAutoRefresh };
})();
