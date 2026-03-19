const App = (() => {
  function switchView(name) {
    document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
    document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));

    document.getElementById(`view-${name}`).classList.add('active');
    const tab = document.querySelector(`.tab[data-view="${name}"]`);
    if (tab) tab.classList.add('active');

    if (name === 'watchlist') {
      Watchlist.load();
      Watchlist.startAutoRefresh();
    } else {
      Watchlist.stopAutoRefresh();
    }

    if (name === 'summary') {
      Summary.load();
    }
  }

  function init() {
    // Tab navigation
    document.querySelectorAll('.tab').forEach((tab) => {
      tab.addEventListener('click', () => switchView(tab.dataset.view));
    });

    // Initialize modules
    Watchlist.initSearch();
    ChartView.init();
    Summary.init();

    // Load default view
    switchView('watchlist');
  }

  document.addEventListener('DOMContentLoaded', init);

  return { switchView };
})();
