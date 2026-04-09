const Watchlist = (() => {
  let refreshTimer = null;
  let activeCategory = null;
  let allQuotes = [];

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

  function renderRow(q) {
    const cls = getColorClass(q.change);
    const arrow = q.change > 0 ? '▲' : q.change < 0 ? '▼' : '';
    return `
      <tr class="stock-row" data-symbol="${q.symbol}">
        <td>${q.symbol.replace('.TW', '')}</td>
        <td>${q.name}</td>
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
      body.innerHTML = '<tr><td colspan="8" class="loading">沒有符合的股票</td></tr>';
      renderFilterBar();
      return;
    }

    body.innerHTML = filtered.map(renderRow).join('');
    renderFilterBar();
    bindRowClicks();
  }

  async function load() {
    const body = document.getElementById('watchlist-body');
    try {
      allQuotes = await API.get('/api/quotes');
      if (allQuotes.length === 0) {
        body.innerHTML = '<tr><td colspan="8" class="loading">自選股清單是空的，請至設定新增股票</td></tr>';
        return;
      }
      renderTable();
    } catch (err) {
      body.innerHTML = `<tr><td colspan="8" class="loading">載入失敗: ${err.message}</td></tr>`;
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
