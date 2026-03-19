const ChartView = (() => {
  let mainChart = null;
  let rsiChart = null;
  let macdChart = null;
  let currentSymbol = null;
  let currentRange = '3m';

  function destroyCharts() {
    if (mainChart) { mainChart.remove(); mainChart = null; }
    if (rsiChart) { rsiChart.remove(); rsiChart = null; }
    if (macdChart) { macdChart.remove(); macdChart = null; }
  }

  function chartOptions(container) {
    return {
      width: container.clientWidth,
      height: container.clientHeight,
      layout: {
        background: { color: '#16213e' },
        textColor: '#e0e0e0'
      },
      grid: {
        vertLines: { color: '#2a2a4a' },
        horzLines: { color: '#2a2a4a' }
      },
      timeScale: {
        borderColor: '#2a2a4a',
        timeVisible: false
      },
      rightPriceScale: {
        borderColor: '#2a2a4a'
      },
      crosshair: {
        mode: LightweightCharts.CrosshairMode.Normal
      }
    };
  }

  async function render(symbol, range) {
    currentSymbol = symbol;
    currentRange = range;
    destroyCharts();

    const data = await API.get(`/api/historical/${encodeURIComponent(symbol)}?range=${range}`);

    if (!data.candles || data.candles.length === 0) {
      document.getElementById('chart-main').innerHTML = '<div class="loading">無歷史數據</div>';
      return;
    }

    // Main chart: Candlestick + MA
    const mainEl = document.getElementById('chart-main');
    mainEl.innerHTML = '';
    mainChart = LightweightCharts.createChart(mainEl, chartOptions(mainEl));

    const candleSeries = mainChart.addCandlestickSeries({
      upColor: '#ff4d4d',
      downColor: '#00c853',
      borderUpColor: '#ff4d4d',
      borderDownColor: '#00c853',
      wickUpColor: '#ff4d4d',
      wickDownColor: '#00c853'
    });
    candleSeries.setData(data.candles);

    // MA overlays
    const maColors = { ma5: '#42a5f5', ma10: '#ffa726', ma20: '#66bb6a', ma60: '#ab47bc' };
    const ind = data.indicators;

    for (const [key, color] of Object.entries(maColors)) {
      if (!ind[key]) continue;
      const series = mainChart.addLineSeries({
        color,
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false
      });
      const maData = data.candles
        .map((c, i) => ({ time: c.time, value: ind[key][i] }))
        .filter((d) => d.value != null);
      series.setData(maData);
    }

    mainChart.timeScale().fitContent();

    // RSI chart
    if (ind.rsi) {
      const rsiEl = document.getElementById('chart-rsi');
      rsiEl.innerHTML = '';
      rsiChart = LightweightCharts.createChart(rsiEl, {
        ...chartOptions(rsiEl),
        rightPriceScale: { borderColor: '#2a2a4a', scaleMargins: { top: 0.1, bottom: 0.1 } }
      });

      const rsiSeries = rsiChart.addLineSeries({
        color: '#ffca28',
        lineWidth: 1.5,
        priceLineVisible: false
      });
      const rsiData = data.candles
        .map((c, i) => ({ time: c.time, value: ind.rsi[i] }))
        .filter((d) => d.value != null);
      rsiSeries.setData(rsiData);

      // 70/30 reference lines
      const rsiRefUp = rsiChart.addLineSeries({
        color: '#ff4d4d44',
        lineWidth: 1,
        lineStyle: 2,
        priceLineVisible: false,
        lastValueVisible: false
      });
      const rsiRefDown = rsiChart.addLineSeries({
        color: '#00c85344',
        lineWidth: 1,
        lineStyle: 2,
        priceLineVisible: false,
        lastValueVisible: false
      });
      const rsiRefData = (val) => rsiData.map((d) => ({ time: d.time, value: val }));
      rsiRefUp.setData(rsiRefData(70));
      rsiRefDown.setData(rsiRefData(30));

      rsiChart.timeScale().fitContent();
      syncTimeScales(mainChart, rsiChart);
    }

    // MACD chart
    if (ind.macd) {
      const macdEl = document.getElementById('chart-macd');
      macdEl.innerHTML = '';
      macdChart = LightweightCharts.createChart(macdEl, chartOptions(macdEl));

      const histSeries = macdChart.addHistogramSeries({
        priceLineVisible: false,
        lastValueVisible: false
      });
      const histData = data.candles
        .map((c, i) => {
          const val = ind.macd.histogram[i];
          if (val == null) return null;
          return { time: c.time, value: val, color: val >= 0 ? '#ff4d4d88' : '#00c85388' };
        })
        .filter(Boolean);
      histSeries.setData(histData);

      const macdLine = macdChart.addLineSeries({
        color: '#42a5f5',
        lineWidth: 1.5,
        priceLineVisible: false,
        lastValueVisible: false
      });
      const signalLine = macdChart.addLineSeries({
        color: '#ffa726',
        lineWidth: 1.5,
        priceLineVisible: false,
        lastValueVisible: false
      });

      const macdData = data.candles
        .map((c, i) => ({ time: c.time, value: ind.macd.macd[i] }))
        .filter((d) => d.value != null);
      const signalData = data.candles
        .map((c, i) => ({ time: c.time, value: ind.macd.signal[i] }))
        .filter((d) => d.value != null);

      macdLine.setData(macdData);
      signalLine.setData(signalData);

      macdChart.timeScale().fitContent();
      syncTimeScales(mainChart, macdChart);
    }
  }

  function syncTimeScales(source, target) {
    source.timeScale().subscribeVisibleLogicalRangeChange((range) => {
      if (range) target.timeScale().setVisibleLogicalRange(range);
    });
    target.timeScale().subscribeVisibleLogicalRangeChange((range) => {
      if (range) source.timeScale().setVisibleLogicalRange(range);
    });
  }

  function show(symbol) {
    App.switchView('chart');
    document.getElementById('chart-title').textContent = `${symbol} K線圖`;
    render(symbol, currentRange);
  }

  function init() {
    document.querySelectorAll('.range-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.range-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        currentRange = btn.dataset.range;
        if (currentSymbol) render(currentSymbol, currentRange);
      });
    });

    document.getElementById('chart-back').addEventListener('click', () => {
      App.switchView('watchlist');
    });

    // Resize charts on window resize
    window.addEventListener('resize', () => {
      if (mainChart) {
        const mainEl = document.getElementById('chart-main');
        mainChart.applyOptions({ width: mainEl.clientWidth });
      }
      if (rsiChart) {
        const rsiEl = document.getElementById('chart-rsi');
        rsiChart.applyOptions({ width: rsiEl.clientWidth });
      }
      if (macdChart) {
        const macdEl = document.getElementById('chart-macd');
        macdChart.applyOptions({ width: macdEl.clientWidth });
      }
    });
  }

  return { init, show, render };
})();
