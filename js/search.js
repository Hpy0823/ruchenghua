// 搜索结果页面功能
class SearchResultsManager {
    constructor() {
        this.resultsContainer = document.getElementById('resultsContainer');
        this.noResultsElement = document.getElementById('noResults');
        this.searchInfoElement = document.getElementById('searchInfo');
        this.resultsTable = document.getElementById('resultsTable');
        this.init();
    }

    init() {
        this.setupSearchForm();
        this.checkUrlParams();
    }

    setupSearchForm() {
        const searchForm = document.getElementById('searchForm');
        if (searchForm) {
            searchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSearchFormSubmit();
            });
        }
    }

    handleSearchFormSubmit() {
        const characterInput = document.getElementById('characterInput');
        const character = characterInput.value.trim();

        if (!character) {
            this.showError('请输入要搜索的汉字');
            return;
        }

        this.performSearch(character);
    }

    checkUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const character = urlParams.get('character');

        if (character) {
            document.getElementById('characterInput').value = character;
            this.performSearch(character);
        }
    }

    performSearch(character) {
        if (!window.app || !window.app.data) {
            console.error('数据尚未加载完成');
            return; // 移除了错误弹窗
        }

        const results = window.app.searchCharacters(character);
        this.displayResults(character, results);
    }

    displayResults(character, results) {
        this.updateSearchInfo(character, results);

        if (Object.keys(results).length === 0) {
            this.showNoResults(character);
        } else {
            this.showResultsTable(character, results);
        }
    }

    updateSearchInfo(character, results) {
        const searchCharacter = document.getElementById('searchCharacter');
        const resultCount = document.getElementById('resultCount');

        if (searchCharacter) {
            searchCharacter.textContent = character;
        }
        if (resultCount) {
            resultCount.textContent = `${Object.keys(results).length} 个`;
        }
        if (this.searchInfoElement) {
            this.searchInfoElement.style.display = 'flex';
        }
    }

    showNoResults(character) {
        if (this.resultsTable) {
            this.resultsTable.style.display = 'none';
        }
        if (this.noResultsElement) {
            this.noResultsElement.style.display = 'block';
            const noResultsText = document.getElementById('noResultsText');
            if (noResultsText) {
                noResultsText.textContent = `未找到"${character}"的字音数据`;
            }
        }
        if (this.searchInfoElement) {
            this.searchInfoElement.style.display = 'none';
        }
    }

    showResultsTable(character, results) {
        if (this.noResultsElement) {
            this.noResultsElement.style.display = 'none';
        }
        if (this.resultsTable) {
            this.resultsTable.style.display = 'block';
        }

        this.renderResultsTable(results);
    }

    renderResultsTable(results) {
        const resultsBody = document.getElementById('resultsBody');
        if (!resultsBody) return;

        resultsBody.innerHTML = '';

        for (const [word, pronunciations] of Object.entries(results)) {
            const pronunciationsArray = Array.isArray(pronunciations) ? pronunciations : [pronunciations];

            pronunciationsArray.forEach((pron, index) => {
                const row = this.createResultRow(word, pron, index, pronunciationsArray.length);
                resultsBody.appendChild(row);
            });
        }
    }

    createResultRow(word, pronunciation, index, totalRows) {
        const row = document.createElement('tr');

        // 第一行显示汉字（跨行）
        if (index === 0) {
            const charCell = this.createCharacterCell(word, totalRows);
            row.appendChild(charCell);
        }

        // 音标单元格
        const phoneticCell = this.createPhoneticCell(pronunciation);
        row.appendChild(phoneticCell);

        // 注释单元格
        const notesCell = this.createNotesCell(pronunciation);
        row.appendChild(notesCell);

        return row;
    }

    createCharacterCell(word, rowspan) {
        const cell = document.createElement('td');
        cell.className = 'align-middle';
        cell.rowSpan = rowspan;
        cell.innerHTML = `<div class="fs-3 fw-bold text-dark text-center">${this.escapeHtml(word)}</div>`;
        return cell;
    }

    createPhoneticCell(pronunciation) {
        const cell = document.createElement('td');
        cell.className = 'align-middle text-center';

        if (pronunciation.phonetic) {
            cell.innerHTML = this.createPhoneticLinks(pronunciation.phonetic);
        } else if (pronunciation.pronunciation) {
            cell.innerHTML = this.createSinglePhoneticLink(pronunciation.pronunciation);
        } else {
            cell.innerHTML = '<span class="text-muted">-</span>';
        }

        return cell;
    }

    createPhoneticLinks(phoneticString) {
        const phonetics = phoneticString.split(',');
        return phonetics.map((ph, index) => {
            const phoneticClean = ph.trim();
            return `
                <span class="phonetic-clickable"
                      data-phonetic="${this.escapeHtml(phoneticClean)}"
                      onclick="playAudio('${this.escapeHtml(phoneticClean)}')">
                    [${this.escapeHtml(phoneticClean)}]
                    <small class="audio-icon">🔊</small>
                </span>
                ${index < phonetics.length - 1 ? '<br>' : ''}
            `;
        }).join('');
    }

    createSinglePhoneticLink(pronunciation) {
        const phoneticClean = pronunciation.trim();
        return `
            <span class="phonetic-clickable"
                  data-phonetic="${this.escapeHtml(phoneticClean)}"
                  onclick="playAudio('${this.escapeHtml(phoneticClean)}')">
                [${this.escapeHtml(phoneticClean)}]
                <small class="audio-icon">🔊</small>
            </span>
        `;
    }

    createNotesCell(pronunciation) {
        const cell = document.createElement('td');
        cell.className = 'align-middle text-muted text-center';
        cell.textContent = pronunciation.notes ? this.escapeHtml(pronunciation.notes) : '-';
        return cell;
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    showError(message) {
        // 在结果页面显示错误
        const errorElement = document.getElementById('errorAlert');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.remove('d-none');

            setTimeout(() => {
                errorElement.classList.add('d-none');
            }, 3000);
        }
        // 移除了alert弹窗
    }
}

// 初始化搜索结果页面
document.addEventListener('DOMContentLoaded', function() {
    // 等待app初始化完成
    if (window.app) {
        window.searchManager = new SearchResultsManager();
    } else {
        // 如果app尚未初始化，等待一下
        setTimeout(() => {
            window.searchManager = new SearchResultsManager();
        }, 100);
    }
});

// 全局函数，供HTML调用
function performSearch(character) {
    if (window.searchManager) {
        window.searchManager.performSearch(character);
    } else if (window.app) {
        const results = window.app.searchCharacters(character);
        if (typeof displayResults === 'function') {
            displayResults(character, results);
        }
    }
}

// 兼容旧代码
function displayResults(character, results) {
    if (window.searchManager) {
        window.searchManager.displayResults(character, results);
    }
}

