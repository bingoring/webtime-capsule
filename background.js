// WebTime Capsule - Background Script

// 확장 프로그램 설치 시 실행
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        console.log('WebTime Capsule installed');

        // 기본 설정 저장
        chrome.storage.sync.set({
            'timeCapsuleSettings': {
                'defaultPeriod': 'week',
                'maxHistoryItems': 1000,
                'enableAnalytics': true,
                'installedDate': Date.now()
            }
        });
    }

    // 컨텍스트 메뉴 생성
    chrome.contextMenus.create({
        id: 'timeCapsule',
        title: 'WebTime Capsule로 이 시기 보기',
        contexts: ['page']
    });
});

// 확장 프로그램 아이콘 클릭 시 팝업 열기
chrome.action.onClicked.addListener((tab) => {
    // 팝업이 이미 정의되어 있으므로 별도 처리 불필요
});

// 히스토리 데이터 전처리 함수들
class HistoryAnalyzer {
    static analyzeHistoryPatterns(historyData) {
        const patterns = {
            timeDistribution: this.getTimeDistribution(historyData),
            domainFrequency: this.getDomainFrequency(historyData),
            categoryDistribution: this.getCategoryDistribution(historyData)
        };

        return patterns;
    }

    static getTimeDistribution(historyData) {
        const hourlyDistribution = new Array(24).fill(0);

        historyData.forEach(item => {
            const hour = new Date(item.lastVisitTime).getHours();
            hourlyDistribution[hour] += item.visitCount;
        });

        return hourlyDistribution;
    }

    static getDomainFrequency(historyData) {
        const domainCount = {};

        historyData.forEach(item => {
            try {
                const domain = new URL(item.url).hostname;
                domainCount[domain] = (domainCount[domain] || 0) + item.visitCount;
            } catch (e) {
                // Invalid URL, skip
            }
        });

        return Object.entries(domainCount)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10);
    }

    static getCategoryDistribution(historyData) {
        const categories = {
            'search': 0,
            'social': 0,
            'entertainment': 0,
            'news': 0,
            'shopping': 0,
            'work': 0,
            'education': 0,
            'other': 0
        };

        const categoryPatterns = {
            'search': /google|naver|daum|bing|yahoo|search/i,
            'social': /facebook|twitter|instagram|linkedin|reddit|discord/i,
            'entertainment': /youtube|netflix|twitch|spotify|music|game/i,
            'news': /news|medium|blog|journalist/i,
            'shopping': /amazon|shop|store|buy|market/i,
            'work': /github|gitlab|jira|slack|office|work/i,
            'education': /edu|learn|course|university|school/i
        };

        historyData.forEach(item => {
            const url = item.url.toLowerCase();
            let categorized = false;

            for (const [category, pattern] of Object.entries(categoryPatterns)) {
                if (pattern.test(url)) {
                    categories[category] += item.visitCount;
                    categorized = true;
                    break;
                }
            }

            if (!categorized) {
                categories.other += item.visitCount;
            }
        });

        return categories;
    }
}

// 메시지 처리
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'analyzeHistory') {
        const analysis = HistoryAnalyzer.analyzeHistoryPatterns(request.historyData);
        sendResponse({ analysis });
        return true;
    }
});

// 컨텍스트 메뉴 클릭 처리
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'timeCapsule') {
        // 팝업을 직접 열 수 없으므로 새 탭에서 확장 프로그램 페이지 열기
        chrome.tabs.create({
            url: chrome.runtime.getURL('popup.html')
        });
    }
});
