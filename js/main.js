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
        const apiKey = '18f5413949f4437f860fdbfa07bda694'; // ⬅️ GitHub Actions가 이 부분을 교체할 것입니다.
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

    function renderGauge(latestData) {
        const ctx = document.getElementById('fearGreedGauge').getContext('2d');
        // TODO: Chart.js를 사용하여 반원 모양의 계기판(Doughnut 차트)을 그리는 코드 작성
        // 예: new Chart(ctx, { type: 'doughnut', ... });
        console.log('Render Gauge with data:', latestData);
    }

    function renderTimeline(historicalData) {
        const ctx = document.getElementById('fearGreedTimeline').getContext('2d');
        // TODO: Chart.js를 사용하여 선 차트(Line 차트)를 그리는 코드 작성
        // 예: new Chart(ctx, { type: 'line', ... });
        console.log('Render Timeline with data:', historicalData);
    }

    function renderNews(articles) {
        const container = document.getElementById('news-container');
        container.innerHTML = ''; // 기존 콘텐츠 초기화
        // TODO: 각 기사(article)에 대해 썸네일, 제목, 링크를 포함한 HTML 요소를 만들어 container에 추가
        console.log('Render News with articles:', articles);
    }

    // 앱 초기화
    function init() {
        fetchFearAndGreedData();
        fetchNewsData();
        switchTab('overview'); // 기본으로 Overview 탭을 활성화
    }

    init();
});