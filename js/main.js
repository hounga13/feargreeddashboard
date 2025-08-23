document.addEventListener('DOMContentLoaded', () => {
    // Chart.js DataLabels 플러그인 등록
    Chart.register(ChartDataLabels);

    // 탭 버튼 및 콘텐츠 섹션 요소 가져오기
    const overviewBtn = document.getElementById('overview-btn');
    const timelineBtn = document.getElementById('timeline-btn');
    const overviewSection = document.getElementById('overview-section');
    const timelineSection = document.getElementById('timeline-section');
    const historicalDataSection = document.getElementById('historical-data-section'); // New element

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
        [overviewSection, timelineSection, historicalDataSection].forEach(section => section.classList.remove('active')); // Updated

        // 선택된 탭과 콘텐츠에 active 클래스 추가
        if (tabName === 'overview') {
            overviewBtn.classList.add('active');
            overviewSection.classList.add('active');
            historicalDataSection.classList.add('active'); // Show historical data with overview
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

            // 3. Historical Data 렌더링
            renderHistoricalData(data); // New call

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
        // Destroy existing chart if it exists to prevent multiple charts on same canvas
        if (window.fearGreedGaugeChart) {
            window.fearGreedGaugeChart.destroy();
        }

        const value = parseInt(latestData.value);
        const sentiment = latestData.value_classification;

        // Define colors for different sentiment ranges
        const colors = {
            'Extreme Fear': '#FF4500', // OrangeRed
            'Fear': '#FF8C00',       // DarkOrange
            'Neutral': '#FFD700',    // Gold
            'Greed': '#ADFF2F',      // GreenYellow
            'Extreme Greed': '#32CD32' // LimeGreen
        };

        const backgroundColor = [
            colors['Extreme Fear'],
            colors['Fear'],
            colors['Neutral'],
            colors['Greed'],
            colors['Extreme Greed']
        ];

        // Calculate the segment for the current value
        // Each sentiment covers 20 points (100 / 5 sentiments)
        const data = [20, 20, 20, 20, 20]; // Each segment represents 20 points

        // Highlight the current sentiment segment
        const currentSentimentIndex = Object.keys(colors).indexOf(sentiment);
        const segmentColors = backgroundColor.map((color, index) => 
            index === currentSentimentIndex ? color : '#E0E0E0' // Grey out other segments
        );

        window.fearGreedGaugeChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Extreme Fear', 'Fear', 'Neutral', 'Greed', 'Extreme Greed'],
                datasets: [{
                    data: data,
                    backgroundColor: segmentColors,
                    borderWidth: 0
                }]
            },
            options: {
                rotation: 270, // Start from the bottom-left
                circumference: 180, // Half circle
                cutout: '80%', // Thickness of the doughnut
                responsive: true,
                maintainAspectRatio: true, // Maintain aspect ratio
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        enabled: false // Disable tooltips
                    },
                    datalabels: {
                        color: '#fff',
                        font: {
                            weight: 'bold'
                        },
                        formatter: (value, context) => {
                            // Only show labels for the segments themselves, not the center text
                            return context.chart.data.labels[context.dataIndex];
                        },
                        anchor: 'end',
                        align: 'end',
                        offset: 8,
                        textAlign: 'center',
                        display: 'auto'
                    }
                },
                elements: {
                    arc: {
                        roundedCornersFor: 0 // No rounded corners
                    }
                }
            },
            plugins: [ChartDataLabels, {
                id: 'gaugeNeedle',
                afterDraw: function(chart) {
                    const { ctx, chartArea: { left, top, right, bottom, width, height } } = chart;
                    ctx.save();

                    const centerX = (left + right) / 2;
                    const centerY = (top + bottom) / 2 + (height / 2); // Adjust for semi-circle
                    const radius = Math.min(width, height) / 2 * 0.8; // Adjust radius for needle

                    // Draw the needle
                    const angle = Math.PI + (value / 100) * Math.PI; // 0-100 maps to 180 degrees (PI to 2PI)
                    const x = centerX + radius * Math.cos(angle);
                    const y = centerY + radius * Math.sin(angle);

                    ctx.beginPath();
                    ctx.moveTo(centerX, centerY);
                    ctx.lineTo(x, y);
                    ctx.strokeStyle = '#333';
                    ctx.lineWidth = 3;
                    ctx.stroke();

                    // Draw the needle base (circle)
                    ctx.beginPath();
                    ctx.arc(centerX, centerY, 8, 0, 2 * Math.PI);
                    ctx.fillStyle = '#333';
                    ctx.fill();
                    ctx.restore();
                }
            }, {
                id: 'gaugeTicks',
                afterDraw: function(chart) {
                    const { ctx, chartArea: { left, top, right, bottom, width, height } } = chart;
                    ctx.save();

                    const centerX = (left + right) / 2;
                    const centerY = (top + bottom) / 2 + (height / 2); // Adjust for semi-circle
                    const outerRadius = Math.min(width, height) / 2;
                    const innerRadius = outerRadius * 0.9; // For ticks

                    // Draw ticks (0, 20, 40, 60, 80, 100)
                    for (let i = 0; i <= 100; i += 20) {
                        const angle = Math.PI + (i / 100) * Math.PI; // Map 0-100 to 180 degrees
                        const xOuter = centerX + outerRadius * Math.cos(angle);
                        const yOuter = centerY + outerRadius * Math.sin(angle);
                        const xInner = centerX + innerRadius * Math.cos(angle);
                        const yInner = centerY + innerRadius * Math.sin(angle);

                        ctx.beginPath();
                        ctx.moveTo(xInner, yInner);
                        ctx.lineTo(xOuter, yOuter);
                        ctx.strokeStyle = '#666';
                        ctx.lineWidth = 2;
                        ctx.stroke();

                        // Draw tick labels
                        ctx.font = '12px sans-serif';
                        ctx.fillStyle = '#333';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';

                        const labelRadius = outerRadius * 0.8; // Position labels slightly inside ticks
                        const xLabel = centerX + labelRadius * Math.cos(angle);
                        const yLabel = centerY + labelRadius * Math.sin(angle);

                        ctx.fillText(i.toString(), xLabel, yLabel);
                    }
                    ctx.restore();
                }
            }, {
                id: 'textCenter',
                beforeDraw: function(chart) {
                    const width = chart.width,
                        height = chart.height,
                        ctx = chart.ctx;

                    ctx.restore();
                    // Use a fixed font size or one relative to a known dimension
                    const fontSize = 40; // Fixed font size in pixels
                    ctx.font = "bold " + fontSize + "px sans-serif";
                    ctx.textBaseline = "middle";

                    const text = value;
                    const textX = Math.round((width - ctx.measureText(text).width) / 2);
                    const textY = height / 1.4; // Adjust position for semi-circle

                    ctx.fillText(text, textX, textY);
                    ctx.save();

                    const sentimentFontSize = 20; // Fixed font size in pixels
                    ctx.font = sentimentFontSize + "px sans-serif";
                    const sentimentText = sentiment;
                    const sentimentTextX = Math.round((width - ctx.measureText(sentimentText).width) / 2);
                    const sentimentTextY = height / 1.2; // Adjust position for semi-circle

                    ctx.fillText(sentimentText, sentimentTextX, sentimentTextY);
                    ctx.save();
                }
            }]
        });
    }

    // renderTimeline 함수를 DOMContentLoaded 스코프 안으로 이동
    function renderTimeline(historicalData) {
        const ctx = document.getElementById('fearGreedTimeline').getContext('2d');
        // Destroy existing chart if it exists to prevent multiple charts on same canvas
        if (window.fearGreedTimelineChart) {
            window.fearGreedTimelineChart.destroy();
        }

        // Sort data by timestamp in ascending order for chronological display
        historicalData.sort((a, b) => a.timestamp - b.timestamp);

        const labels = historicalData.map(item => {
            const date = new Date(item.timestamp * 1000); // Convert Unix timestamp to Date object
            return date.toLocaleDateString('ko-KR'); // Format date for display
        });
        const values = historicalData.map(item => parseInt(item.value));

        window.fearGreedTimelineChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Fear & Greed Index',
                    data: values,
                    borderColor: '#1a237e',
                    backgroundColor: 'rgba(26, 35, 126, 0.2)',
                    fill: true,
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Index Value'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Date'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                }
            }
        });
    }

    // renderHistoricalData 함수를 DOMContentLoaded 스코프 안으로 이동
    function renderHistoricalData(data) {
        const container = document.getElementById('historical-data-container');
        container.innerHTML = ''; // Clear existing content

        if (!data || data.length === 0) {
            container.innerHTML = '<p>Historical data not available.</p>';
            return;
        }

        // Helper to find data for a specific number of days ago
        const findDataByDaysAgo = (days) => {
            const targetDate = new Date();
            targetDate.setDate(targetDate.getDate() - days);
            targetDate.setHours(0, 0, 0, 0); // Normalize to start of day

            let closestData = null;
            let minDiff = Infinity;

            data.forEach(item => {
                const itemDate = new Date(item.timestamp * 1000);
                itemDate.setHours(0, 0, 0, 0); // Normalize to start of day

                const diff = Math.abs(itemDate.getTime() - targetDate.getTime());

                if (diff < minDiff) {
                    minDiff = diff;
                    closestData = item;
                }
            });
            return closestData;
        };

        const historicalPoints = [
            { label: 'Previous Close', data: data[0] }, // Assuming data[0] is always the latest
            { label: '1 Day Ago', data: findDataByDaysAgo(1) },
            { label: '1 Week Ago', data: findDataByDaysAgo(7) },
            { label: '1 Month Ago', data: findDataByDaysAgo(30) }
        ];

        historicalPoints.forEach(point => {
            if (point.data) {
                const div = document.createElement('div');
                div.classList.add('historical-item');
                div.innerHTML = `
                    <strong>${point.label}</strong>
                    <div class="historical-value">${point.data.value}</div>
                    <div class="historical-sentiment">(${point.data.value_classification})</div>
                `;
                container.appendChild(div);
            }
        });
    }

    // renderNews 함수를 DOMContentLoaded 스코프 안으로 이동
    function renderNews(articles) {
        const container = document.getElementById('news-container');
        container.innerHTML = ''; // Clear existing content

        if (!articles || articles.length === 0) {
            container.innerHTML = '<p>뉴스를 불러올 수 없습니다.</p>';
            return;
        }

        articles.forEach(article => {
            const newsItem = document.createElement('a');
            newsItem.href = article.url;
            newsItem.target = '_blank'; // Open in new tab
            newsItem.classList.add('news-item');

            const thumbnail = document.createElement('img');
            thumbnail.src = article.urlToImage || 'https://via.placeholder.com/150?text=No+Image'; // Placeholder if no image
            thumbnail.alt = article.title;
            thumbnail.classList.add('news-thumbnail');

            const title = document.createElement('h3');
            title.classList.add('news-title');
            title.textContent = article.title;

            newsItem.appendChild(thumbnail);
            newsItem.appendChild(title);
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
