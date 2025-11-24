// 应用主要功能 - 静态版本
class RuchengDialectApp {
    constructor() {
        this.data = null;
        this.totalChars = 0;
        this.dataLoaded = false;
        this.init();
    }

    async init() {
        await this.loadData();
        this.setupEventListeners();
        this.updateStats();
        this.dataLoaded = true;

        // 触发数据加载完成事件
        console.log('触发数据加载完成事件');
        window.dispatchEvent(new CustomEvent('dataLoaded', {
            detail: {
                totalChars: this.totalChars,
                dataCount: Object.keys(this.data).length
            }
        }));
    }

    async loadData() {
        try {
            console.log('开始加载数据文件...');
            const response = await fetch('data/rucheng_data.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.data = await response.json();
            this.totalChars = Object.keys(this.data).length;
            console.log(`成功加载 ${this.totalChars} 个汉字的汝城话发音数据`);

            // 设置全局引用，方便其他脚本访问
            window.app = this;
        } catch (error) {
            console.error('加载数据失败:', error);
            this.data = {};
            this.totalChars = 0;
            this.dataLoaded = false;

            // 触发加载失败事件
            window.dispatchEvent(new CustomEvent('dataLoadError', {
                detail: { error: error.message }
            }));

            this.showDataLoadError();
        }
    }

    showDataLoadError() {
        // 在页面上显示数据加载错误信息
        const errorElement = document.getElementById('dataLoadError');
        if (errorElement) {
            errorElement.style.display = 'block';
        } else {
            // 如果没有预定义的元素，创建一个
            const alertDiv = document.createElement('div');
            alertDiv.id = 'dataLoadError';
            alertDiv.className = 'alert alert-danger alert-dismissible fade show';
            alertDiv.innerHTML = `
                <strong>数据加载失败!</strong> 无法加载方言数据，请刷新页面重试。
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            `;
            document.body.insertBefore(alertDiv, document.body.firstChild);
        }
    }

    setupEventListeners() {
        // 搜索表单事件监听
        const searchForm = document.getElementById('searchForm');
        if (searchForm) {
            searchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSearch();
            });
        }

        // 热门搜索链接事件（如果有的话）
        document.querySelectorAll('.hot-search').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const character = e.target.textContent || e.target.innerText;
                this.performSearch(character);
            });
        });
    }

    handleSearch() {
        const input = document.getElementById('characterInput');
        const character = input.value.trim();

        if (!character) {
            this.showError('请输入要搜索的汉字');
            return;
        }

        // 跳转到搜索结果页面或执行搜索
        if (window.location.pathname.includes('results.html')) {
            // 如果在结果页面，直接执行搜索
            this.performSearch(character);
        } else {
            // 跳转到搜索结果页面
            window.location.href = `results.html?character=${encodeURIComponent(character)}`;
        }
    }

    performSearch(character) {
        if (!this.data || !this.dataLoaded) {
            console.error('数据尚未加载完成');
            // 移除了错误弹窗，静默处理
            return {};
        }

        const results = this.searchCharacters(character);

        // 如果当前在结果页面，显示结果
        if (typeof displayResults === 'function') {
            displayResults(character, results);
        }

        return results;
    }

    searchCharacters(characters) {
        if (!this.data || Object.keys(this.data).length === 0) {
            console.warn('搜索时数据为空');
            return {};
        }

        const results = {};
        const searchChars = Array.from(characters);
        console.log('搜索字符:', searchChars);

        for (const searchChar of searchChars) {
            // 精确匹配
            if (this.data && searchChar in this.data) {
                results[searchChar] = this.data[searchChar];
            }

            // 包含匹配（词语）
            if (this.data) {
                for (const [word, pronunciations] of Object.entries(this.data)) {
                    if (word.includes(searchChar) && word !== searchChar) {
                        if (!(word in results)) {
                            results[word] = pronunciations;
                        }
                    }
                }
            }
        }

        console.log('搜索结果数量:', Object.keys(results).length);
        return results;
    }

    async checkAudioExists(phonetic) {
        if (!phonetic) {
            return { exists: false };
        }

        const audioExtensions = ['.m4a'];

        for (const ext of audioExtensions) {
            const audioPath = `static/audio/${phonetic}${ext}`;
            try {
                const response = await fetch(audioPath, { method: 'HEAD' });
                if (response.ok) {
                    return { exists: true, filename: `${phonetic}${ext}` };
                }
            } catch (error) {
                // 继续检查下一个扩展名
                continue;
            }
        }

        return { exists: false };
    }

    showError(message) {
        // 在首页显示错误
        const errorAlert = document.getElementById('errorAlert');
        if (errorAlert) {
            errorAlert.textContent = message;
            errorAlert.classList.remove('d-none');

            // 3秒后自动隐藏错误信息
            setTimeout(() => {
                errorAlert.classList.add('d-none');
            }, 3000);
        }
        // 移除了在其他页面使用alert的代码
    }

    updateStats() {
        const statsElement = document.getElementById('totalChars');
        if (statsElement) {
            statsElement.textContent = this.totalChars;
        }
    }

    // API 搜索方法（保持与Flask版本兼容）
    async apiSearch(character) {
        const results = this.searchCharacters(character);
        return {
            'character': character,
            'results': results,
            'total_matches': Object.keys(results).length
        };
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', function() {
    console.log('初始化RuchengDialectApp');
    window.app = new RuchengDialectApp();
});

