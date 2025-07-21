// WebTime Capsule - Popup Script

class TimeCapsule {
    constructor() {
        this.currentPeriod = 'week';
        this.historyData = null;
        this.init();
    }

    init() {
        this.setupDateLabels();
        this.setupEventListeners();
        this.loadTimeCapsule('week');
    }

    // 날짜 라벨 설정
    setupDateLabels() {
        const now = new Date();

        const periods = {
            week: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
            month: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
            quarter: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
            half: new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000),
            year: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        };

        Object.entries(periods).forEach(([period, date]) => {
            const element = document.getElementById(`${period}-date`);
            if (element) {
                element.textContent = this.formatDate(date);
            }
        });
    }

    // 날짜 포맷팅
    formatDate(date) {
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `${month}/${day}`;
    }

    // 이벤트 리스너 설정
    setupEventListeners() {
        const timeButtons = document.querySelectorAll('.time-btn');
        timeButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                this.selectPeriod(e.currentTarget);
            });
        });
    }

    // 기간 선택
    selectPeriod(button) {
        // 활성 상태 변경
        document.querySelectorAll('.time-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        button.classList.add('active');

        const period = button.dataset.period;
        this.currentPeriod = period;
        this.loadTimeCapsule(period);
    }

    // 타임캡슐 로드
    async loadTimeCapsule(period) {
        this.showLoading(true);
        this.hideResults();

        try {
            const historyData = await this.getHistoryData(period);
            this.historyData = historyData;

            if (historyData && historyData.length > 0) {
                this.displayTimeline(historyData);
                this.displayAnalytics(historyData);
                this.showResults();
            } else {
                this.showEmptyState();
            }
        } catch (error) {
            console.error('Error loading time capsule:', error);
            this.showEmptyState();
        } finally {
            this.showLoading(false);
        }
    }

    // 히스토리 데이터 가져오기
    async getHistoryData(period) {
        return new Promise((resolve, reject) => {
            const now = new Date();
            const daysAgo = this.getPeriodDays(period);
            const targetDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

            // 해당 날짜의 시작과 끝 시간 설정
            const startTime = new Date(targetDate);
            startTime.setHours(0, 0, 0, 0);

            const endTime = new Date(targetDate);
            endTime.setHours(23, 59, 59, 999);

            chrome.history.search({
                text: '',
                startTime: startTime.getTime(),
                endTime: endTime.getTime(),
                maxResults: 1000
            }, (results) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    // 방문 횟수순으로 정렬
                    const sortedResults = results.sort((a, b) => b.visitCount - a.visitCount);
                    resolve(sortedResults);
                }
            });
        });
    }

    // 기간별 일수 반환
    getPeriodDays(period) {
        const days = {
            week: 7,
            month: 30,
            quarter: 90,
            half: 180,
            year: 365
        };
        return days[period] || 7;
    }

    // 타임라인 표시
    displayTimeline(historyData) {
        const timeline = document.getElementById('timeline');
        const totalSites = document.getElementById('total-sites');
        const totalVisits = document.getElementById('total-visits');
        const periodTitle = document.getElementById('selected-period-title');

        // 통계 업데이트
        const uniqueSites = new Set(historyData.map(item => new URL(item.url).hostname)).size;
        const totalVisitCount = historyData.reduce((sum, item) => sum + item.visitCount, 0);

        totalSites.textContent = uniqueSites;
        totalVisits.textContent = totalVisitCount;

        // 제목 업데이트
        const periodNames = {
            week: '1주일 전',
            month: '1달 전',
            quarter: '3개월 전',
            half: '6개월 전',
            year: '1년 전'
        };
        periodTitle.textContent = `${periodNames[this.currentPeriod]} 오늘의 발자취`;

        // 타임라인 아이템 생성
        timeline.innerHTML = '';

        historyData.slice(0, 20).forEach((item, index) => {
            const timelineItem = this.createTimelineItem(item, index);
            timeline.appendChild(timelineItem);
        });
    }

    // 타임라인 아이템 생성
    createTimelineItem(historyItem) {
        const item = document.createElement('div');
        item.className = 'timeline-item';

        const time = new Date(historyItem.lastVisitTime);
        const timeStr = time.toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });

                const hostname = new URL(historyItem.url).hostname;

        // Multiple favicon service URLs for fallback
        const fallbackUrls = [
            `https://www.google.com/s2/favicons?domain=${hostname}&sz=16`,
            `https://favicon.yandex.net/favicon/${hostname}`,
            `https://icons.duckduckgo.com/ip3/${hostname}.ico`
        ];

        item.innerHTML = `
            <div class="timeline-time">${timeStr}</div>
            <img class="timeline-favicon" src="${fallbackUrls[0]}" alt="${hostname}">
            <div class="timeline-content">
                <div class="timeline-title">${historyItem.title || hostname}</div>
                <a href="${historyItem.url}" class="timeline-url" target="_blank" rel="noopener">
                    ${hostname}
                </a>
            </div>
        `;

        // Setup favicon fallback mechanism
        const faviconImg = item.querySelector('.timeline-favicon');
        let currentFaviconIndex = 0;

        faviconImg.onerror = function() {
            currentFaviconIndex++;
            if (currentFaviconIndex < fallbackUrls.length) {
                this.src = fallbackUrls[currentFaviconIndex];
            } else {
                this.style.display = 'none';
            }
        };
        return item;
    }

    // 관심사 분석 표시
    displayAnalytics(historyData) {
        const categoryChart = document.getElementById('category-chart');
        const trendInfo = document.getElementById('trend-info');

        // 도메인별 분류
        const categories = this.categorizeHistory(historyData);

        // 카테고리 차트 생성
        categoryChart.innerHTML = '';
        const maxCount = Math.max(...Object.values(categories));

        Object.entries(categories)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .forEach(([category, count]) => {
                const item = this.createCategoryItem(category, count, maxCount);
                categoryChart.appendChild(item);
            });

        // 트렌드 정보
        const topCategory = Object.entries(categories)
            .sort(([,a], [,b]) => b - a)[0];

        if (topCategory) {
            trendInfo.innerHTML = `
                이 시기에는 <strong>${topCategory[0]}</strong> 관련 사이트를
                가장 많이 방문했습니다. (${topCategory[1]}회)
            `;
        }
    }

    // 히스토리 카테고리화
    categorizeHistory(historyData) {
        const categories = {};
        const categoryKeywords = {
            '🔍 검색/정보': ['google', 'naver', 'daum', 'bing', 'yahoo', 'wikipedia', 'stackoverflow'],
            '📱 소셜미디어': ['facebook', 'twitter', 'instagram', 'linkedin', 'reddit', 'discord'],
            '🎵 엔터테인먼트': ['youtube', 'netflix', 'twitch', 'spotify', 'music'],
            '📰 뉴스/미디어': ['news', 'medium', 'blog', 'tistory', 'velog'],
            '🛒 쇼핑': ['amazon', 'coupang', '11st', 'gmarket', 'shop'],
            '💼 업무/개발': ['github', 'gitlab', 'jira', 'slack', 'notion', 'figma'],
            '📚 학습/교육': ['coursera', 'udemy', 'edx', 'khan', 'learning'],
            '🌐 기타': []
        };

        historyData.forEach(item => {
            const hostname = new URL(item.url).hostname.toLowerCase();
            let categorized = false;

            for (const [category, keywords] of Object.entries(categoryKeywords)) {
                if (category === '🌐 기타') continue;

                if (keywords.some(keyword => hostname.includes(keyword))) {
                    categories[category] = (categories[category] || 0) + item.visitCount;
                    categorized = true;
                    break;
                }
            }

            if (!categorized) {
                categories['🌐 기타'] = (categories['🌐 기타'] || 0) + item.visitCount;
            }
        });

        return categories;
    }

    // 카테고리 아이템 생성
    createCategoryItem(category, count, maxCount) {
        const item = document.createElement('div');
        item.className = 'category-item';

        const [emoji, name] = category.split(' ', 2);
        const percentage = (count / maxCount) * 100;

        item.innerHTML = `
            <div class="category-name">
                <span class="category-emoji">${emoji}</span>
                <span>${name}</span>
            </div>
            <div class="category-bar">
                <div class="category-fill" style="width: ${percentage}%"></div>
            </div>
            <div class="category-count">${count}</div>
        `;

        return item;
    }

    // UI 상태 관리
    showLoading(show) {
        const loading = document.getElementById('loading');
        if (show) {
            loading.classList.add('show');
        } else {
            loading.classList.remove('show');
        }
    }

    showResults() {
        document.getElementById('history-section').classList.add('show');
        document.getElementById('analytics-section').classList.add('show');
    }

    hideResults() {
        document.getElementById('history-section').classList.remove('show');
        document.getElementById('analytics-section').classList.remove('show');
        document.getElementById('empty-state').classList.remove('show');
    }

    showEmptyState() {
        document.getElementById('empty-state').classList.add('show');
    }
}

// 팝업이 로드되면 TimeCapsule 초기화
document.addEventListener('DOMContentLoaded', () => {
    new TimeCapsule();
});
