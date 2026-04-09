const Settings = (() => {
  let stocks = [];

  async function load() {
    stocks = await API.get('/api/watchlist');
    renderCategorySelect();
    renderGroups();
  }

  function getCategories() {
    return [...new Set(stocks.map((s) => s.category).filter(Boolean))].sort();
  }

  // --- Category dropdown for adding ---
  function renderCategorySelect() {
    const sel = document.getElementById('add-category-select');
    const cats = getCategories();
    sel.innerHTML = '<option value="">-- 選擇類別 --</option>' +
      cats.map((c) => `<option value="${c}">${c}</option>`).join('');
  }

  // --- Groups display ---
  function renderGroups() {
    const container = document.getElementById('settings-groups');
    const groups = {};
    stocks.forEach((s) => {
      const cat = s.category || '未分類';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(s);
    });

    const catNames = Object.keys(groups).sort();
    if (catNames.length === 0) {
      container.innerHTML = '<div class="settings-empty">尚無股票，請先新增</div>';
      return;
    }

    container.innerHTML = catNames.map((cat) => `
      <div class="settings-group" data-category="${cat}">
        <div class="settings-group-header">
          <span class="settings-group-name">${cat}</span>
          <span class="settings-group-count">${groups[cat].length} 檔</span>
          <button class="btn-sm btn-rename" data-category="${cat}" title="重新命名類別">重新命名</button>
        </div>
        <div class="settings-group-stocks">
          ${groups[cat].map((s) => `
            <div class="settings-stock-item">
              <span class="settings-stock-info">
                <strong>${s.symbol.replace('.TW', '')}</strong> ${s.name}
              </span>
              <div class="settings-stock-actions">
                <select class="move-select" data-symbol="${s.symbol}">
                  <option value="">移至...</option>
                  ${catNames.filter((c) => c !== cat).map((c) => `<option value="${c}">${c}</option>`).join('')}
                  <option value="__new__">+ 新類別</option>
                </select>
                <button class="btn-sm btn-danger" data-symbol="${s.symbol}" title="刪除">刪除</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');

    bindGroupEvents();
  }

  function bindGroupEvents() {
    // Rename category
    document.querySelectorAll('.btn-rename').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const oldCat = btn.dataset.category;
        const newCat = prompt(`將「${oldCat}」重新命名為：`, oldCat);
        if (!newCat || newCat.trim() === '' || newCat.trim() === oldCat) return;
        const toRename = stocks.filter((s) => s.category === oldCat);
        await Promise.all(
          toRename.map((s) => API.put(`/api/watchlist/${encodeURIComponent(s.symbol)}`, { category: newCat.trim() }))
        );
        load();
      });
    });

    // Move stock to another category
    document.querySelectorAll('.move-select').forEach((sel) => {
      sel.addEventListener('change', async () => {
        const symbol = sel.dataset.symbol;
        let target = sel.value;
        if (!target) return;
        if (target === '__new__') {
          target = prompt('輸入新類別名稱：');
          if (!target || target.trim() === '') { sel.value = ''; return; }
          target = target.trim();
        }
        await API.put(`/api/watchlist/${encodeURIComponent(symbol)}`, { category: target });
        load();
      });
    });

    // Delete stock
    document.querySelectorAll('.btn-danger').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const symbol = btn.dataset.symbol;
        const stock = stocks.find((s) => s.symbol === symbol);
        const label = stock ? `${stock.name} (${symbol})` : symbol;
        if (!confirm(`確定要移除 ${label}？`)) return;
        await API.del(`/api/watchlist/${encodeURIComponent(symbol)}`);
        load();
      });
    });
  }

  // --- Search + Add ---
  function initSearch() {
    const input = document.getElementById('search-input');
    const dropdown = document.getElementById('search-results');
    let debounce = null;

    input.addEventListener('input', () => {
      clearTimeout(debounce);
      const q = input.value.trim();
      if (!q) { dropdown.classList.remove('show'); return; }

      debounce = setTimeout(async () => {
        try {
          const results = await API.get(`/api/search?q=${encodeURIComponent(q)}`);
          if (results.length === 0) {
            dropdown.innerHTML = '<div class="search-item disabled">找不到結果</div>';
          } else {
            dropdown.innerHTML = results.map((r) =>
              `<div class="search-item" data-symbol="${r.symbol}" data-name="${r.name}">
                <strong>${r.symbol}</strong> ${r.name}
              </div>`
            ).join('');
          }
          dropdown.classList.add('show');

          dropdown.querySelectorAll('.search-item[data-symbol]').forEach((item) => {
            item.addEventListener('click', () => addStock(item.dataset.symbol, item.dataset.name, input, dropdown));
          });
        } catch {
          dropdown.innerHTML = '<div class="search-item disabled">搜尋失敗</div>';
          dropdown.classList.add('show');
        }
      }, 300);
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-box')) dropdown.classList.remove('show');
    });
  }

  async function addStock(symbol, name, input, dropdown) {
    const selVal = document.getElementById('add-category-select').value;
    const newVal = document.getElementById('add-category-new').value.trim();
    const category = newVal || selVal || '未分類';

    try {
      await API.post('/api/watchlist', { symbol, name, category });
      input.value = '';
      document.getElementById('add-category-new').value = '';
      dropdown.classList.remove('show');
      load();
    } catch (err) {
      alert(err.message.includes('409') ? '此股票已在清單中' : '新增失敗: ' + err.message);
    }
  }

  function init() {
    initSearch();
  }

  return { init, load };
})();
