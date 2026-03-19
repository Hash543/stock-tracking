const Watchlist = (() => {
  let refreshTimer = null;

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
        <td><button class="btn-remove" data-symbol="${q.symbol}" title="移除">✕</button></td>
      </tr>
    `;
  }

  async function load() {
    const body = document.getElementById('watchlist-body');
    try {
      const quotes = await API.get('/api/quotes');
      if (quotes.length === 0) {
        body.innerHTML = '<tr><td colspan="9" class="loading">自選股清單是空的，請搜尋新增股票</td></tr>';
        return;
      }
      body.innerHTML = quotes.map(renderRow).join('');
      bindRowClicks();
      bindRemoveButtons();
    } catch (err) {
      body.innerHTML = `<tr><td colspan="9" class="loading">載入失敗: ${err.message}</td></tr>`;
    }
  }

  function bindRowClicks() {
    document.querySelectorAll('.stock-row').forEach((row) => {
      row.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-remove')) return;
        const symbol = row.dataset.symbol;
        ChartView.show(symbol);
      });
    });
  }

  function bindRemoveButtons() {
    document.querySelectorAll('.btn-remove').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const symbol = btn.dataset.symbol;
        if (!confirm(`確定要移除 ${symbol}?`)) return;
        await API.del(`/api/watchlist/${encodeURIComponent(symbol)}`);
        load();
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

  // Search
  function initSearch() {
    const input = document.getElementById('search-input');
    const dropdown = document.getElementById('search-results');
    let debounce = null;

    input.addEventListener('input', () => {
      clearTimeout(debounce);
      const q = input.value.trim();
      if (!q) {
        dropdown.classList.remove('show');
        return;
      }
      debounce = setTimeout(async () => {
        try {
          const results = await API.get(`/api/search?q=${encodeURIComponent(q)}`);
          if (results.length === 0) {
            dropdown.innerHTML = '<div class="search-item">找不到結果</div>';
          } else {
            dropdown.innerHTML = results
              .map(
                (r) =>
                  `<div class="search-item" data-symbol="${r.symbol}" data-name="${r.name}">
                    <strong>${r.symbol}</strong> ${r.name}
                  </div>`
              )
              .join('');
          }
          dropdown.classList.add('show');

          dropdown.querySelectorAll('.search-item[data-symbol]').forEach((item) => {
            item.addEventListener('click', async () => {
              const symbol = item.dataset.symbol;
              const name = item.dataset.name;
              await API.post('/api/watchlist', { symbol, name });
              input.value = '';
              dropdown.classList.remove('show');
              load();
            });
          });
        } catch {
          dropdown.innerHTML = '<div class="search-item">搜尋失敗</div>';
          dropdown.classList.add('show');
        }
      }, 300);
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-box')) {
        dropdown.classList.remove('show');
      }
    });
  }

  return { load, startAutoRefresh, stopAutoRefresh, initSearch };
})();
