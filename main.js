document.addEventListener('DOMContentLoaded', () => {
    // 탭 버튼 및 콘텐츠 섹션 요소 가져오기
    const overviewBtn = document.getElementById('overview-btn');
    const timelineBtn = document.getElementById('timeline-btn');
    const overviewSection = document.getElementById('overview-section');
    const timelineSection = document.getElementById('timeline-section');

    // 탭 전환 이벤트 리스너 설정
    overviewBtn.addEventListener('click', () => {
        switchTab('overview');
    });

    timelineBtn.addEventListener('click', () => {
        switchTab('timeline');
    });

    function switchTab(tabName) {
        // 모든 탭과 콘텐츠에서 active 클래스 제거
        [overviewBtn, timelineBtn].forEach(btn => btn.classList.remove('active'));
        [overviewSection, timelineSection].forEach(section => section.classList.remove('active'));

        // 선택된 탭과 콘텐츠에 active 클래스 추가
        if (tabName === 'overview') {
            overviewBtn.classList.add('active');
            overviewSection.classList.add('active');
        } else {
            timelineBtn.classList.add('active');
            timelineSection.classList.add('active');
        }
    }

    // 공포탐욕지수 데이터 가져오기 및 차트 그리기
    async function fetchFearAndGreedData() {
        try {
            const response = await fetch('https://api.alternative.me/fng/?limit=90&format=json');
            if (!response.ok) throw new Error('Network response was not ok');
            const result = await response.json();
            const data = result.data;

            // 1. Overview 계기판 그리기 (가장 최신 데이터 사용)
            renderGauge(data[0]);

            // 2. Timeline 차트 그리기 (과거 데이터 사용)
            renderTimeline(data);

        } catch (error) {
            console.error('Failed to fetch Fear & Greed data:', error);
        }
    }

    // 뉴스 데이터 가져오기 및 렌더링
    async function fetchNewsData() {
        // 중요: '<YOUR_API_KEY>'를 실제 NewsAPI에서 발급받은 키로 교체해야 합니다.
        const apiKey = '18f5413949f4437f860fdbfa07bda694'; // ⬅️ 본인의 NewsAPI 키를 여기에 입력하세요!
        const url = `https://newsapi.org/v2/top-headlines?country=us&category=business&pageSize=3&apiKey=${apiKey}`;

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Network response was not ok');
            const result = await response.json();
            
            // 3. 뉴스 렌더링
            renderNews(result.articles);

        } catch (error) {
            console.error('Failed to fetch news data:', error);
            document.getElementById('news-container').innerHTML = '<p>뉴스를 불러오는 데 실패했습니다. API 키를 확인해주세요.</p>';
        }
    }

    // Chart.js 중앙 텍스트 플러그인
    const gaugeTextPlugin = {
        id: 'gaugeText',
        afterDraw(chart) {
            const { ctx, data, chartArea: { top } } = chart;
            const score = data.datasets[0].data[0];
            const classification = data.datasets[0].label;

            ctx.save();
            ctx.font = 'bold 36px sans-serif';
            ctx.fillStyle = data.datasets[0].backgroundColor[0];
            ctx.textAlign = 'center';
            ctx.fillText(score, chart.getDatasetMeta(0).data[0].x, top + 80);

            ctx.font = 'normal 18px sans-serif';
            ctx.fillStyle = '#555';
            ctx.fillText(classification, chart.getDatasetMeta(0).data[0].x, top + 110);
            ctx.restore();
        }
    };

    function renderGauge(latestData) {
        const ctx = document.getElementById('fearGreedGauge').getContext('2d');
        const value = parseInt(latestData.value);
        const classification = latestData.value_classification;

        const gaugeColor = (val) => {
            if (val <= 25) return '#d32f2f'; // Extreme Fear
            if (val <= 45) return '#ff9800'; // Fear
            if (val <= 55) return '#ffeb3b'; // Neutral
            if (val <= 75) return '#8bc34a'; // Greed
            return '#4caf50'; // Extreme Greed
        };

        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Fear & Greed', ''],
                datasets: [{
                    label: classification,
                    data: [value, 100 - value],
                    backgroundColor: [gaugeColor(value), '#f0f2f5'],
                    borderColor: ['#fff', 'transparent'],
                    borderWidth: 2,
                    circumference: 180,
                    rotation: -90,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 2,
                cutout: '60%',
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false },
                }
            },
            plugins: [gaugeTextPlugin]
        });
    }

    function renderTimeline(historicalData) {
        const ctx = document.getElementById('fearGreedTimeline').getContext('2d');
        const reversedData = historicalData.slice().reverse(); // 시간 순으로 정렬

        const labels = reversedData.map(d => {
            const date = new Date(d.timestamp * 1000);
            return `${date.getMonth() + 1}/${date.getDate()}`;
        });
        const values = reversedData.map(d => d.value);

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Fear & Greed Index',
                    data: values,
                    borderColor: '#1a237e',
                    backgroundColor: 'rgba(26, 35, 126, 0.1)',
                    fill: true,
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
            }
        });
    }

    function renderNews(articles) {
        const container = document.getElementById('news-container');
        container.innerHTML = ''; // 기존 콘텐츠 초기화
        articles.forEach(article => {
            const newsItem = document.createElement('a');
            newsItem.href = article.url;
            newsItem.target = '_blank'; // 새 탭에서 열기
            newsItem.className = 'news-item';
            newsItem.innerHTML = `
                <img src="${article.urlToImage || 'https://via.placeholder.com/400x200.png?text=No+Image'}" alt="News thumbnail" class="news-thumbnail">
                <h3 class="news-title">${article.title}</h3>
            `;
            container.appendChild(newsItem);
        });
    }

    // 앱 초기화
    function init() {
        fetchFearAndGreedData();
        fetchNewsData();
        switchTab('overview'); // 기본으로 Overview 탭을 활성화
    }

    init();
});