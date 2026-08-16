    function switchTab(tabId, btn) {
        // 모든 탭 컨텐츠 비활성화
        document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

        // 선택한 탭 활성화
        const targetTab = document.getElementById('tab-' + tabId);
        if (targetTab) {
            targetTab.classList.add('active');
        }

        if (btn && btn.classList && btn.classList.contains('nav-btn')) {
            btn.classList.add('active');
        }

        // 햄버거 메뉴 닫기
        document.getElementById('navMenu').classList.remove('show');

        // 방문 기록 및 대시보드 갱신 처리
        if (tabId !== 'landing' && tabId !== 'home') {
            recordVisitedPage(tabId);
        } else if (tabId === 'home') {
            updateDashboardUpcomingSummary();
            renderRecentVisitedPages();
        }
        setTimeout(refreshAllWidths, 50);
    }

    /* [기존 포털 시스템 전체 로직] */
    const CONFIG = {
        categoryOptions: ['입고검사', '핏업검사', '용접검사', '공장검사', '자재승인', '시공검측', '완공검사'],
        personOptions: ['김학선', '이장훈', '김다훈'],
        statusOptions: ['대기', '진행중', '검토중', '승인중', '완료', '보류']
    };
    const initialScheduleData = [
        { completed: false, date: '2026-08-12', category: '입고검사', person: '김학선', status: '진행중', content: 'DW-300A 입고 검사 진행', note: '긴급' },
        { completed: true, date: '2026-08-10', category: '공장검사', person: '이장훈', status: '완료', content: '창고 시설 정기 점검', note: '' },
        { completed: false, date: '2026-08-15', category: '완공검사', person: '김다훈', status: '승인중', content: '융착파이프 샘플 최종 검수', note: '승인 대기중' }
    ];
    const initialContactsData = [
        { name: '강범석', role: '팀장', phone: '010-5435-4950', memo: '' },
        { name: '김다훈', role: '부장', phone: '010-9512-9501', memo: '' },
        { name: '김소영', role: '대리', phone: '010-3132-7986', memo: '' },
        { name: '김영진', role: '과장', phone: '010-5106-3277', memo: '' },
        { name: '김재원', role: '차장', phone: '010-4617-7442', memo: '' },
        { name: '김학선', role: '상무', phone: '010-2391-2812', memo: '' },
        { name: '김형기', role: '차장', phone: '010-9907-8286', memo: '' },
        { name: '박기범', role: '차장', phone: '010-3709-1761', memo: '' },
        { name: '박상근', role: '소장', phone: '010-4843-0369', memo: '' },
        { name: '박찬웅', role: '과장', phone: '010-4281-8287', memo: '' },
        { name: '이강현', role: '차장', phone: '010-8139-6849', memo: '' },
        { name: '이장훈', role: '상무', phone: '010-6353-1482', memo: '' },
        { name: '정영권', role: '팀장', phone: '010-8688-0201', memo: '' },
        { name: '진영훈', role: '과장', phone: '010-5781-0064', memo: '' },
        { name: '최준혁', role: '대리', phone: '010-9916-1052', memo: '' }
    ];
    const initialBoardData = [
        { title: '중요: DW-300A 품질 승인 서류 보완 요청', content: '삼성 측 전달 용품 품질 검사 증명서 작성 시 트루컬러 표기 항목 다시 점검할 것.' }
    ];
    const initialNonConformData = [
        { title: '철골 용접 부위 미달 검토', alpha1: 'A', num1: '47', alpha2: 'A', num2: '48', content: '현장 3층 B구역 용접 비드 두께 기준 미달로 인한 보완 조치 필요.', completed: false }
    ];
    const initialTipBoardData = [
        { title: '오토캐드 고화질 PDF 다운로드 방법 (Ctrl+P)', content: '플롯터 세팅 시 AutoCAD PDF (High Quality Print).pc3 선택 후 백터 품질 2400 DPI 상향 설정.' },
        { title: '객체 결합(J) 및 분해(X) 사용 방법', content: 'J(Join)는 끝점이 맞아떨어져야 폴리선으로 합쳐짐.\nX(Explode)는 블록이나 폴리선을 낱개 선으로 분해함.' },
        { title: '그리기 순서 변경 (DR / TEXTTOFRONT)', content: 'DR 입력 후 Front/Back 선택.\n텍스트 가려짐 해제는 TEXTTOFRONT, 해치 내리기는 HATCHTOBACK 활용.' }
    ];
    const initialDocsData = [
        { name: '품질관리_시방서_최신판.pdf', size: '2.4', date: '2026-08-10' }
    ];

    const TAB_NAMES = {
        'schedule': '📅 스케줄',
        'board': '📌 게시판',
        'nonconformity': '⚠️ 부적합',
        'contacts': '📞 연락처',
        'specifications': '📁 파일관리',
        'tipboard': '💡 TIP',
        'memo': '📝 메모장',
        'calculator': '🧮 계산기'
    };
    const DAYS = ['일', '월', '화', '수', '목', '금', '토'];
    let targetElementToDelete = null;
    let scheduleSortAsc = true;
    let contactSortAsc = true;
    let isGlobalLocked = false;
    let idleTimer = null;
    const IDLE_TIMEOUT = 1800000;
    const PASSWORD_CORRECT = "000000";

    function toggleMenu() {
        const menu = document.getElementById('navMenu');
        menu.classList.toggle('show');
    }

    function updateColumnWidths(tableId, isContact = false) {
        const table = document.getElementById(tableId);
        if (!table) return;
        const inputs = table.querySelectorAll('input[type="text"]');
        inputs.forEach(input => {
            if (isContact && input.classList.contains('contact-memo')) {
                input.style.width = '100%';
                input.style.minWidth = '300px';
            } else if (!isContact) {
                input.style.width = '100%';
            }
        });
    }

    function refreshAllWidths() {
        updateColumnWidths('scheduleTable', false);
        updateColumnWidths('contactsTable', true);
    }

    window.addEventListener('resize', refreshAllWidths);

    function formatPhoneNumber(value) {
        if (!value) return value;
        const cleaned = ('' + value).replace(/\D/g, '');
        if (cleaned.length === 11) {
            return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
        } else if (cleaned.length === 10) {
            if (cleaned.startsWith('02')) {
                return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '$1-$2-$3');
            }
            return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
        } else if (cleaned.length === 9 && cleaned.startsWith('02')) {
            return cleaned.replace(/(\d{2})(\d{3})(\d{4})/, '$1-$2-$3');
        }
        return value;
    }

    function switchTab(tabId, btn) {
        document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

        document.getElementById('tab-' + tabId).classList.add('active');
        btn.classList.add('active');

        document.getElementById('navMenu').classList.remove('show');

        if (tabId !== 'home') {
            recordVisitedPage(tabId);
        } else {
            updateDashboardUpcomingSummary();
            renderRecentVisitedPages();
        }
        setTimeout(refreshAllWidths, 50);
    }

    function navigateToTab(tabId) {
        const btnMap = {
            'schedule': 'btn-schedule',
            'board': 'btn-board',
            'nonconformity': 'btn-nonconformity',
            'contacts': 'btn-contacts',
            'specifications': 'btn-specifications',
            'tipboard': 'btn-tipboard',
            'memo': 'btn-memo',
            'calculator': 'btn-calculator'
        };
        const targetBtn = document.querySelector('.' + btnMap[tabId]);
        if (targetBtn) {
            switchTab(tabId, targetBtn);
        }
    }

    function recordVisitedPage(tabId) {
        let history = JSON.parse(localStorage.getItem('quality_visited_pages') || '[]');
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        history = history.filter(item => item.tabId !== tabId);
        history.unshift({ tabId, name: TAB_NAMES[tabId], time: timeStr });

        if (history.length > 5) history = history.slice(0, 5);

        localStorage.setItem('quality_visited_pages', JSON.stringify(history));
    }

    function renderRecentVisitedPages() {
        const container = document.getElementById('homeRecentPagesSummary');
        const history = JSON.parse(localStorage.getItem('quality_visited_pages') || '[]');
        
        container.innerHTML = '';

        if (history.length === 0) {
            container.innerHTML = '<li class="stat-item" style="color:#94a3b8;">최근 열람한 페이지가 없다.</li>';
            return;
        }

        history.forEach(item => {
            const li = document.createElement('li');
            li.className = 'stat-item';
            li.innerHTML = `
                <span class="stat-item-link" onclick="navigateToTab('${item.tabId}')">${item.name}</span>
                <span style="font-size:12px; color:#64748b;">${item.time} 열람</span>
            `;
            container.appendChild(li);
        });
    }

    function updateDashboardUpcomingSummary() {
        const rows = document.querySelectorAll('#tableBody tr');
        const scheduleList = [];
        const todayStr = new Date().toISOString().substring(0, 10);
        const todayDate = new Date(todayStr);
        rows.forEach(row => {
            const completed = row.querySelector('input[type="checkbox"]').checked;
            if (!completed) {
                const dateVal = row.querySelector('input[type="date"]').value;
                const statusVal = row.querySelectorAll('select')[2].value;
                const inputs = row.querySelectorAll('input[type="text"]');
                const contentVal = inputs[0].value || '내용 없음';

                if (dateVal) {
                    const itemDate = new Date(dateVal);
                    const diffTime = itemDate - todayDate;
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    scheduleList.push({ date: dateVal, content: contentVal, status: statusVal, diffDays });
                }
            }
        });
        scheduleList.sort((a, b) => {
            if (a.diffDays >= 0 && b.diffDays < 0) return -1;
            if (a.diffDays < 0 && b.diffDays >= 0) return 1;
            return a.diffDays - b.diffDays;
        });
        const summaryContainer = document.getElementById('homeScheduleSummary');
        summaryContainer.innerHTML = '';

        if (scheduleList.length === 0) {
            summaryContainer.innerHTML = '<li class="stat-item" style="color:#94a3b8;">마감이 임박한 일정이 없습니다.</li>';
            return;
        }

        scheduleList.slice(0, 4).forEach(item => {
            let dDayClass = 'd-day-upcoming';
            let dDayText = `D-${item.diffDays}`;
            if (item.diffDays === 0) {
                dDayText = 'D-DAY';
                dDayClass = 'd-day-today';
            } else if (item.diffDays < 0) {
                dDayText = `D+${Math.abs(item.diffDays)}`;
                dDayClass = 'd-day-past';
            }

            const li = document.createElement('li');
            li.className = 'stat-item';
            li.innerHTML = `
                <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap; flex: 1 1 auto; min-width: 200px;">
                    <span class="d-day-badge ${dDayClass}" style="flex-shrink: 0;">${dDayText}</span>
                    <span style="font-weight:600; color:#1e293b; word-break: break-all;">${item.content}</span>
                    <span style="font-size:12px; color:#64748b; white-space: nowrap;">(${item.date})</span>
                </div>
                <div style="flex-shrink: 0;">
                    <span style="font-weight: bold; font-size:13px;" class="status-select ${getStatusClass(item.status)}">${item.status}</span>
                </div>
            `;
            summaryContainer.appendChild(li);
        });
    }

    function getStatusClass(val) {
        if (val === '대기') return 'pending';
        if (val === '진행중') return 'progress';
        if (val === '검토중') return 'review';
        if (val === '승인중') return 'approving';
        if (val === '완료') return 'done';
        if (val === '보류') return 'hold';
        return '';
    }

    window.onload = function() {
        const savedSchedule = localStorage.getItem('quality_schedule_data');
        (savedSchedule ? JSON.parse(savedSchedule) : initialScheduleData).forEach(item => addRow(item));

        const savedContacts = localStorage.getItem('quality_contacts_data_v6');
        (savedContacts ? JSON.parse(savedContacts) : initialContactsData).forEach(item => addContactRow(item));

        const savedLock = localStorage.getItem('quality_contacts_lock');
        if (savedLock === 'true') {
            isGlobalLocked = true;
            const lockBtn = document.getElementById('globalLockBtn');
            if (lockBtn) {
                lockBtn.textContent = '편집';
                lockBtn.classList.add('active');
            }
            const rows = document.querySelectorAll('#contactsTableBody tr');
            rows.forEach(row => {
                row.querySelectorAll('input[type="text"]').forEach(input => {
                    input.disabled = true;
                });
            });
        }

        const savedBoard = localStorage.getItem('quality_board_data');
        (savedBoard ? JSON.parse(savedBoard) : initialBoardData).forEach(item => addBoardPost(item));

        const savedNonConform = localStorage.getItem('quality_nonconformity_data');
        (savedNonConform ? JSON.parse(savedNonConform) : initialNonConformData).forEach(item => addNonConformPost(item));

        const saveTipBoard = localStorage.getItem('quality_tipboard_data');
        (saveTipBoard ? JSON.parse(saveTipBoard) : initialTipBoardData).forEach(item => addTipBoardPost(item));

        const savedMemo = localStorage.getItem('quality_memo_data');
        if (savedMemo) document.getElementById('memoArea').value = savedMemo;

        updateDashboardUpcomingSummary();
        renderRecentVisitedPages();
        refreshAllWidths();
    };

    function getDayOfWeek(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return isNaN(date.getDay()) ? '-' : DAYS[date.getDay()];
    }

    function createSelectHTML(options, selectedValue, className = '') {
        let html = `<select class="${className} clean-select" onchange="updateStyle(this)">`;
        options.forEach(opt => {
            const isSelected = opt === selectedValue ? 'selected' : '';
            html += `<option value="${opt}" ${isSelected}>${opt}</option>`;
        });
        html += `</select>`;
        return html;
    }

    function addRow(data = {}) {
        const tbody = document.getElementById('tableBody');
        const tr = document.createElement('tr');
        
        const completed = data.completed || false;
        const date = data.date || new Date().toISOString().substring(0, 10);
        const day = getDayOfWeek(date);
        const category = data.category || CONFIG.categoryOptions[0];
        const person = data.person || CONFIG.personOptions[0];
        const status = data.status || CONFIG.statusOptions[0];
        const content = data.content || '';
        const note = data.note || '';
        if (completed) tr.classList.add('completed');

        tr.innerHTML = `
            <td style="text-align: center;"><input type="checkbox" ${completed ? 'checked' : ''} onchange="toggleComplete(this)"></td>
            <td><input type="date" value="${date}" onchange="updateDay(this)" style="width: 130px; min-width: 130px;"></td>
            <td class="day-cell">${day}</td>
            <td style="text-align: center;"><div style="display:inline-block; width:120px; min-width:120px;">${createSelectHTML(CONFIG.categoryOptions, category)}</div></td>
            <td style="text-align: center;"><div style="display:inline-block; width:110px; min-width:110px;">${createSelectHTML(CONFIG.personOptions, person)}</div></td>
            <td style="text-align: center;"><div style="display:inline-block; width:100px; min-width:100px;">${createSelectHTML(CONFIG.statusOptions, status, 'status-select')}</div></td>
            <td><input type="text" value="${content}" placeholder="업무 내용을 입력하세요" style="width: 300px; min-width: 300px;" oninput="refreshAllWidths()"></td>
            <td><input type="text" value="${note}" placeholder="비고" style="width: 150px; min-width: 150px;" oninput="refreshAllWidths()"></td>
            <td style="text-align: center;"><button class="btn-delete" onclick="openDeleteModal(this, 'standard')">삭제</button></td>
        `;
        tbody.appendChild(tr);
        updateStyle(tr.querySelector('.status-select'));
        refreshAllWidths();
    }

    function sortScheduleByDate() {
        const tbody = document.getElementById('tableBody');
        const rowsArray = Array.from(tbody.querySelectorAll('tr'));

        rowsArray.sort((a, b) => {
            const dateA = a.querySelector('input[type="date"]').value;
            const dateB = b.querySelector('input[type="date"]').value;

            if (scheduleSortAsc) {
                return dateA.localeCompare(dateB);
            } else {
                return dateB.localeCompare(dateA);
            }
        });

        scheduleSortAsc = !scheduleSortAsc;
        rowsArray.forEach(row => tbody.appendChild(row));
    }

    function toggleComplete(checkbox) {
        const tr = checkbox.closest('tr');
        if (checkbox.checked) tr.classList.add('completed');
        else tr.classList.remove('completed');
        updateDashboardUpcomingSummary();
    }

    function updateDay(dateInput) {
        const tr = dateInput.closest('tr');
        tr.querySelector('.day-cell').textContent = getDayOfWeek(dateInput.value);
        updateDashboardUpcomingSummary();
    }

    function updateStyle(selectElem) {
        if (!selectElem.classList.contains('status-select')) return;
        selectElem.className = 'status-select clean-select';
        const val = selectElem.value;
        if (val === '대기') selectElem.classList.add('pending');
        else if (val === '진행중') selectElem.classList.add('progress');
        else if (val === '검토중') selectElem.classList.add('review');
        else if (val === '승인중') selectElem.classList.add('approving');
        else if (val === '완료') selectElem.classList.add('done');
        else if (val === '보류') selectElem.classList.add('hold');
    }

    function saveData() {
        const rows = document.querySelectorAll('#tableBody tr');
        const dataList = [];
        rows.forEach(row => {
            const completed = row.querySelector('input[type="checkbox"]').checked;
            const date = row.querySelector('input[type="date"]').value;
            const category = row.querySelectorAll('select')[0].value;
            const person = row.querySelectorAll('select')[1].value;
            const status = row.querySelectorAll('select')[2].value;
            const inputs = row.querySelectorAll('input[type="text"]');
            dataList.push({ completed, date, category, person, status, content: inputs[0].value, note: inputs[1].value });
        });
        localStorage.setItem('quality_schedule_data', JSON.stringify(dataList));
        updateDashboardUpcomingSummary();
        alert('일정 데이터가 성공적으로 저장되었습니다.');
    }

    function toggleBoardBody(btn) {
        const card = btn.closest('.board-card');
        const body = card.querySelector('.board-body');
        const arrow = btn.querySelector('.toggle-arrow');
        if (body.style.display === 'none') {
            body.style.display = 'block';
            arrow.textContent = '▼';
        } else {
            body.style.display = 'none';
            arrow.textContent = '▶';
        }
    }

    function updateBoardTitle(input) {
        const card = input.closest('.board-card');
        const titleText = card.querySelector('.board-card-title-text');
        titleText.textContent = input.value.trim() || '새 게시글';
    }

    function toggleEditBoardCard(btn) {
        const card = btn.closest('.board-card');
        const isEditing = card.classList.toggle('is-editing');
        
        if (!isEditing) {
            const contentTextarea = card.querySelector('.board-content');
            const contentView = card.querySelector('.board-content-view');
            
            contentView.textContent = contentTextarea.value || '내용이 없습니다.';
            
            btn.textContent = '편집';
            btn.style.background = '#3b82f6';
            saveTipBoardPosts();
        } else {
            btn.textContent = '잠금';
            btn.style.background = '#059669';
            const textarea = card.querySelector('.board-content');
            if (textarea) autoResizeTextarea(textarea);
        }
    }

    function copyTipContent(btn) {
        const card = btn.closest('.board-card');
        const titleInput = card.querySelector('.board-title');
        const title = titleInput ? titleInput.value.trim() : card.querySelector('.board-card-title-text').textContent.trim();
        const contentTextarea = card.querySelector('.board-content');
        const content = contentTextarea ? contentTextarea.value.trim() : card.querySelector('.board-content-view').textContent.trim();

        const textToCopy = `[제목] ${title}\n[내용]\n${content}`;
        navigator.clipboard.writeText(textToCopy).then(() => {
            alert('TIP 제목과 내용이 클립보드에 복사되었다.');
        }).catch(err => {
            alert('복사에 실패했다.');
        });
    }

    function addTipBoardPost(data = {}) {
        const container = document.getElementById('tipBoardContainer');
        const card = document.createElement('div');
        card.className = 'board-card';
        card.innerHTML = `
            <div class="board-header">
                <button class="toggle-title-btn" onclick="toggleBoardBody(this)" style="flex: 1;">
                    <span class="toggle-arrow">▼</span> 
                    <span class="board-card-title-text">${data.title || '새 TIP'}</span>
                </button>
            </div>
            <div class="board-body">
                <div class="edit-mode-only" style="margin-top: 6px; margin-bottom: 6px;">
                    <input type="text" class="board-title-input board-title" value="${data.title || ''}" placeholder="제목을 입력하세요" oninput="updateBoardTitle(this);" style="width: 100%;">
                </div>

                <div class="board-content-view" style="font-size: 14px; color: #475569; padding: 6px 0; white-space: pre-wrap; line-height: 1.5;">${data.content || '내용이 없습니다.'}</div>

                <textarea class="board-content-textarea board-content edit-mode-only" placeholder="상세 내용을 작성하세요..." oninput="autoResizeTextarea(this)">${data.content || ''}</textarea>

                <div style="display: flex; align-items: center; justify-content: flex-end; gap: 8px; margin-top: 10px; padding-top: 8px; border-top: 1px dashed #e2e8f0;">
                    <button class="btn-copy" onclick="copyTipContent(this)">복사</button>
                    <button class="action-btn btn-board-edit" onclick="toggleEditBoardCard(this)" style="background: #3b82f6; color: white; padding: 6px 12px; font-size: 12px;">편집</button>
                    <button class="btn-delete" onclick="openDeleteModal(this, 'tipboard')">삭제</button>
                </div>
            </div>
        `;
        container.prepend(card);
        setTimeout(() => {
            const textarea = card.querySelector('.board-content-textarea');
            if (textarea) autoResizeTextarea(textarea);
        }, 10);
    }

    function saveTipBoardPosts() {
        const cards = document.querySelectorAll('#TipBoardContainer .board-card');
        const list = [];
        cards.forEach(card => {
            const titleInput = card.querySelector('.board-title');
            const contentTextarea = card.querySelector('.board-content');
            list.push({
                title: titleInput ? titleInput.value : card.querySelector('.board-card-title-text').textContent,
                content: contentTextarea ? contentTextarea.value : card.querySelector('.board-content-view').textContent
            });
        });
        localStorage.setItem('quality_tipboard_data', JSON.stringify(list));
        alert('저장이 완료되었습니다.');
    }

    function addBoardPost(data = {}) {
        const container = document.getElementById('boardContainer');
        const card = document.createElement('div');
        card.className = 'board-card';
        card.innerHTML = `
            <div class="board-header">
                <button class="toggle-title-btn" onclick="toggleBoardBody(this)" style="flex: 1;">
                    <span class="toggle-arrow">▼</span> 
                    <span class="board-card-title-text">${data.title || '새 게시글'}</span>
                </button>
            </div>
            <div class="board-body">
                <div class="edit-mode-only" style="margin-top: 6px; margin-bottom: 6px;">
                    <input type="text" class="board-title-input board-title" value="${data.title || ''}" placeholder="제목을 입력하세요" oninput="updateBoardTitle(this); filterBoard();" style="width: 100%;">
                </div>

                <div class="board-content-view" style="font-size: 14px; color: #475569; padding: 6px 0; white-space: pre-wrap; line-height: 1.5;">${data.content || '내용이 없습니다.'}</div>

                <textarea class="board-content-textarea board-content edit-mode-only" placeholder="내용을 작성하세요..." oninput="autoResizeTextarea(this); filterBoard()">${data.content || ''}</textarea>

                <div style="display: flex; align-items: center; justify-content: flex-end; gap: 8px; margin-top: 10px; padding-top: 8px; border-top: 1px dashed #e2e8f0;">
                    <button class="action-btn btn-board-edit" onclick="toggleEditBoardCard(this)" style="background: #3b82f6; color: white; padding: 6px 12px; font-size: 12px;">편집</button>

                    <button class="btn-delete" onclick="openDeleteModal(this, 'standard')">삭제</button>
                </div>
            </div>
        `;
        container.prepend(card);
        setTimeout(() => {
            const textarea = card.querySelector('.board-content-textarea');
            if (textarea) autoResizeTextarea(textarea);
        }, 10);
    }

    function saveBoardPosts() {
        const cards = document.querySelectorAll('#boardContainer .board-card');
        const boardList = [];
        cards.forEach(card => {
            const titleInput = card.querySelector('.board-title');
            const contentTextarea = card.querySelector('.board-content');
            boardList.push({
                title: titleInput ? titleInput.value : card.querySelector('.board-card-title-text').textContent,
                content: contentTextarea ? contentTextarea.value : card.querySelector('.board-content-view').textContent
            });
        });
        localStorage.setItem('quality_board_data', JSON.stringify(boardList));
        alert('게시판 데이터가 저장되었다.');
    }

    function addNonConformPost(data = {}) {
        const container = document.getElementById('nonConformContainer');
        const card = document.createElement('div');
        card.className = 'non-conform-card';

        let alphaOpts1 = '';
        let alphaOpts2 = '';
        for (let i = 65; i <= 90; i++) {
            const char = String.fromCharCode(i);
            const sel1 = (data.alpha1 === char) ? 'selected' : '';
            const sel2 = (data.alpha2 === char) ? 'selected' : '';
            alphaOpts1 += `<option value="${char}" ${sel1}>${char}</option>`;
            alphaOpts2 += `<option value="${char}" ${sel2}>${char}</option>`;
        }

        let numOpts1 = '';
        let numOpts2 = '';
        for (let i = 1; i <= 99; i++) {
            const numStr = i < 10 ? '0' + i : '' + i;
            const sel1 = (data.num1 === numStr || data.num1 == i) ? 'selected' : '';
            const sel2 = (data.num2 === numStr || data.num2 == i) ? 'selected' : '';
            numOpts1 += `<option value="${numStr}" ${sel1}>${numStr}</option>`;
            numOpts2 += `<option value="${numStr}" ${sel2}>${numStr}</option>`;
        }

        const isCompleted = data.completed ? 'checked' : '';
        const titleClass = data.completed ? 'card-title-text completed-text' : 'card-title-text';

        const imageSrc = data.image || '';
        const previewStyle = imageSrc ? 'display: block;' : 'display: none;';

        card.innerHTML = `
            <div class="non-conform-header">
                <div style="display: flex; align-items: center; gap: 8px; flex: 1;">
                    <button class="toggle-title-btn" onclick="toggleNonConformBody(this)" style="flex: 1;">
                        <span class="toggle-arrow">▼</span> 
                        <span class="${titleClass}">${data.title || '새 부적합 사항'}</span>
                    </button>
                    <input type="checkbox" class="non-complete-chk" ${isCompleted} onchange="toggleNonConformComplete(this)" style="margin-left: auto;">
                </div>
            </div>
            <div class="non-conform-body">
                <div class="edit-mode-only" style="margin-top: 6px; margin-bottom: 6px;">
                    <input type="text" class="board-title-input non-title" value="${data.title || ''}" placeholder="제목을 입력하세요" oninput="updateCardTitle(this); filterNonConformity();" style="width: 100%;">
                </div>
                
                <div class="non-conform-sub">
                    <div style="display: flex; gap: 4px; align-items: center;">
                        <select class="non-alpha1 center-select green-select" style="width: 50px; font-weight: bold;" disabled>${alphaOpts1}</select>
                        <select class="non-num1 center-select green-select" style="width: 50px; font-weight: bold;" disabled>${numOpts1}</select>
                        <span style="font-weight: bold; color: #475569; padding: 0 2px;">~</span>
                        <select class="non-alpha2 center-select green-select" style="width: 50px; font-weight: bold;" disabled>${alphaOpts2}</select>
                        <select class="non-num2 center-select green-select" style="width: 50px; font-weight: bold;" disabled>${numOpts2}</select>
                    </div>
                </div>

                <div class="non-content-view" style="font-size: 14px; color: #475569; padding: 6px 0; white-space: pre-wrap; line-height: 1.5;">${data.content || '내용이 없습니다.'}</div>

                <textarea class="board-content-textarea non-content edit-mode-only" placeholder="부적합 상세 내용을 입력하세요..." oninput="autoResizeTextarea(this); filterNonConformity()">${data.content || ''}</textarea>
                
                <div class="image-preview-container" style="${previewStyle}">
                    <img src="${imageSrc}" class="non-img-preview">
                    <button class="img-delete-btn edit-mode-only" onclick="removeCardImage(this)">X</button>
                </div>

                <div style="display: flex; align-items: center; justify-content: flex-end; gap: 8px; margin-top: 10px; padding-top: 8px; border-top: 1px dashed #e2e8f0;">
                    <div class="image-upload-section edit-mode-only" style="margin-right: auto;">
                        <label class="vertical-upload-btn">
                            <span>📷 이미지 첨부</span>
                            <input type="file" accept="image/*" style="display:none;" onchange="handleImageUpload(event, this)">
                        </label>
                    </div>
                    <button class="action-btn non-edit-btn" onclick="toggleEditCard(this)" style="background: #1e3a8a; color: white; padding: 6px 12px; font-size: 12px;">편집</button>
                    <button class="action-btn btn-save" onclick="saveSingleCard(this)" style="padding: 6px 12px; font-size: 12px;">저장</button>
                    <button class="btn-delete" onclick="openDeleteModal(this, 'standard')">삭제</button>
                </div>
            </div>
        `;
        container.prepend(card);
    }

    function toggleEditCard(btn) {
        const card = btn.closest('.non-conform-card');
        const isEditing = card.classList.toggle('is-editing');
        
        const selects = card.querySelectorAll('.non-conform-sub select');
        selects.forEach(sel => {
            sel.disabled = !isEditing;
        });
        
        if (!isEditing) {
            const contentTextarea = card.querySelector('.non-content');
            const contentView = card.querySelector('.non-content-view');
            
            contentView.textContent = contentTextarea.value || '내용이 없습니다.';
            
            btn.textContent = '편집';
            btn.style.background = '#1e3a8a';
            btn.style.color = '#ffffff';
            btn.style.border = 'none';
            saveNonConformPosts();
        } else {
            btn.textContent = '잠금';
            btn.style.background = '#ffffff';
            btn.style.color = '#000000';
            btn.style.border = '1px solid #cbd5e1';
            const textarea = card.querySelector('.non-content');
            if (textarea) autoResizeTextarea(textarea);
        }
    }

    function toggleNonConformBody(btn) {
        const card = btn.closest('.non-conform-card');
        const body = card.querySelector('.non-conform-body');
        const arrow = btn.querySelector('.toggle-arrow');
        if (body.classList.contains('collapsed')) {
            body.classList.remove('collapsed');
            arrow.textContent = '▼';
        } else {
            body.classList.add('collapsed');
            arrow.textContent = '▶';
        }
    }

    function updateCardTitle(input) {
        const card = input.closest('.non-conform-card');
        const titleText = card.querySelector('.card-title-text');
        titleText.textContent = input.value.trim() || '새 부적합 사항';
    }

    function handleImageUpload(event, input) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(e) {
            const card = input.closest('.non-conform-card');
            const previewContainer = card.querySelector('.image-preview-container');
            const img = card.querySelector('.non-img-preview');
            img.src = e.target.result;
            previewContainer.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }

    function removeCardImage(btn) {
        const card = btn.closest('.non-conform-card');
        const previewContainer = card.querySelector('.image-preview-container');
        const img = card.querySelector('.non-img-preview');
        img.src = '';
        previewContainer.style.display = 'none';
    }

    function saveSingleCard(btn) {
        saveNonConformPosts();
        alert('해당 부적합 항목이 저장되었다.');
    }

    function filterNonConformity() {
        const filterVal = document.getElementById('nonConformFilterInput').value.toLowerCase();
        const cards = document.querySelectorAll('#nonConformContainer .non-conform-card');

        cards.forEach(card => {
            const title = card.querySelector('.non-title').value.toLowerCase();
            const content = card.querySelector('.non-content').value.toLowerCase();

            if (title.includes(filterVal) || content.includes(filterVal)) {
                card.style.display = '';
            } else {
                card.style.display = 'none';
            }
        });
    }

    function toggleNonConformComplete(chk) {
        const card = chk.closest('.non-conform-card');
        const titleText = card.querySelector('.card-title-text');
        if (chk.checked) {
            titleText.classList.add('completed-text');
        } else {
            titleText.classList.remove('completed-text');
        }
        saveNonConformPosts();
    }

    function saveNonConformPosts() {
        const cards = document.querySelectorAll('#nonConformContainer .non-conform-card');
        const list = [];
        cards.forEach(card => {
            const img = card.querySelector('.non-img-preview');
            list.push({
                title: card.querySelector('.non-title').value,
                alpha1: card.querySelector('.non-alpha1').value,
                num1: card.querySelector('.non-num1').value,
                alpha2: card.querySelector('.non-alpha2').value,
                num2: card.querySelector('.non-num2').value,
                content: card.querySelector('.non-content').value,
                image: (img && img.src.startsWith('data:')) ? img.src : '',
                completed: card.querySelector('.non-complete-chk').checked
            });
        });
        localStorage.setItem('quality_nonconformity_data', JSON.stringify(list));
    }

    function addContactRow(data = {}) {
        const tbody = document.getElementById('contactsTableBody');
        const tr = document.createElement('tr');
        const formattedPhone = formatPhoneNumber(data.phone || '');
        const disabledAttr = isGlobalLocked ? 'disabled' : '';

        tr.innerHTML = `
            <td><input type="text" class="contact-name" value="${data.name || ''}" placeholder="이름" style="width: 110px; min-width: 110px;" ${disabledAttr}></td>
            <td><input type="text" class="contact-role" value="${data.role || ''}" placeholder="직책/구분" style="width: 70px; min-width: 70px;" ${disabledAttr}></td>
            <td><input type="text" class="contact-phone" value="${formattedPhone}" placeholder="010-0000-0000" style="width: 120px; min-width: 120px;" onchange="this.value = formatPhoneNumber(this.value)" ${disabledAttr}></td>
            <td style="text-align: center;"><button class="btn-call" onclick="callContact(this)" style="background-color: #8489a7; color: white; padding: 7px 10px; font-size: 14px; border: none; border-radius: 4px; cursor: pointer;">📞</button></td>
            <td><input type="text" class="contact-memo" value="${data.memo || ''}" placeholder="메모 입력" style="width: 100%; ㄴmin-width: 300px;" ${disabledAttr}></td>
            <td style="text-align: center;"><button class="btn-copy" onclick="copyContactInfo(this)">복사</button></td>
            <td style="text-align: center;"><button class="btn-delete" onclick="openDeleteModal(this, 'standard')">삭제</button></td>
        `;
        tbody.appendChild(tr);
    }

    function callContact(btn) {
        const tr = btn.closest('tr');
        const phone = tr.querySelector('.contact-phone').value.trim();
        if (!phone) {
            alert('전화번호가 입력되지 않았다.');
            return;
        }
        window.location.href = 'tel:' + phone;
    }

    function toggleGlobalLock(btn) {
        isGlobalLocked = !isGlobalLocked;
        localStorage.setItem('quality_contacts_lock', isGlobalLocked);
        const rows = document.querySelectorAll('#contactsTableBody tr');
        rows.forEach(row => {
            const inputs = row.querySelectorAll('input[type="text"]');
            inputs.forEach(input => {
                input.disabled = isGlobalLocked;
            });
        });

        if (isGlobalLocked) {
            btn.textContent = '편집';
            btn.classList.add('active');
        } else {
            btn.textContent = '잠금';
            btn.classList.remove('active');
        }
    }

    function filterContacts() {
        const filterVal = document.getElementById('contactFilterInput').value.toLowerCase();
        const rows = document.querySelectorAll('#contactsTableBody tr');

        rows.forEach(row => {
            const name = row.querySelector('.contact-name').value.toLowerCase();

            if (name.includes(filterVal)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }

    function sortContacts() {
        const tbody = document.getElementById('contactsTableBody');
        const rowsArray = Array.from(tbody.querySelectorAll('tr'));

        rowsArray.sort((a, b) => {
            const valA = a.querySelector('.contact-name').value.trim();
            const valB = b.querySelector('.contact-name').value.trim();

            if (contactSortAsc) {
                return valA.localeCompare(valB, 'ko');
            } else {
                return valB.localeCompare(valA, 'ko');
            }
        });
        contactSortAsc = !contactSortAsc;
        rowsArray.forEach(row => tbody.appendChild(row));
    }

    function copyContactInfo(btn) {
        const tr = btn.closest('tr');
        const name = tr.querySelector('.contact-name').value.trim();
        const phone = tr.querySelector('.contact-phone').value.trim();

        if (!name && !phone) {
            alert('복사할 이름이나 전화번호가 입력되지 않았다.');
            return;
        }

        const textToCopy = `${name} ${phone}`.trim();
        navigator.clipboard.writeText(textToCopy).then(() => {
            alert(`클립보드에 복사되었다: "${textToCopy}"`);
        }).catch(err => {
            alert('복사에 실패했다.');
        });
    }

    function saveContacts() {
        const rows = document.querySelectorAll('#contactsTableBody tr');
        const contactsList = [];
        rows.forEach(row => {
            const name = row.querySelector('.contact-name').value;
            const role = row.querySelector('.contact-role').value;
            const phoneInput = row.querySelector('.contact-phone');
            const memo = row.querySelector('.contact-memo').value;

            const formattedPhone = formatPhoneNumber(phoneInput.value);
            phoneInput.value = formattedPhone;

            contactsList.push({ name, role, phone: formattedPhone, memo });
        });
        localStorage.setItem('quality_contacts_data_v6', JSON.stringify(contactsList));
        alert('연락처 목록이 저장되었다.');
    }

    function openDeleteModal(btn, type = 'standard') {
        targetElementToDelete = btn.closest('tr') || btn.closest('.board-card') || btn.closest('.non-conform-card');
        const modalText = document.getElementById('modalText');
        
        if (type === 'tipboard') {
            modalText.textContent = "정말로 삭제하시겠습니까?";
        } else {
            modalText.textContent = "정말로 삭제하시겠습니까?";
        }
        
        document.getElementById('deleteModal').classList.add('show');
    }

    function closeDeleteModal() {
        targetElementToDelete = null;
        document.getElementById('deleteModal').classList.remove('show');
    }

    function confirmDelete() {
        if (targetElementToDelete) {
            targetElementToDelete.remove();
            updateDashboardUpcomingSummary();
        }
        closeDeleteModal();
    }

    function uploadFile(input) {
        if (input.files && input.files[0]) {
            const file = input.files[0];
            const fileList = JSON.parse(localStorage.getItem('quality_docs_data') || JSON.stringify(initialDocsData));
            fileList.unshift({
                name: file.name,
                size: (file.size / (1024 * 1024)).toFixed(2),
                date: new Date().toISOString().substring(0, 10)
            });
            localStorage.setItem('quality_docs_data', JSON.stringify(fileList));
            renderDocs(fileList);
            alert(`'${file.name}' 파일이 추가되었다. 저장하기를 눌러 확정하라.`);
        }
    }

    function saveMemo() {
        localStorage.setItem('quality_memo_data', document.getElementById('memoArea').value);
        alert('메모가 성공적으로 저장되었다.');
    }

    function calcAppend(val) {
        const screen = document.getElementById('calcScreen');
        screen.value += val;
    }

    function calcClear() {
        document.getElementById('calcScreen').value = '';
    }

    function calcBack() {
        const screen = document.getElementById('calcScreen');
        screen.value = screen.value.slice(0, -1);
    }

    function calcResult() {
        const screen = document.getElementById('calcScreen');
        try {
            screen.value = eval(screen.value);
        } catch (e) {
            screen.value = '오류';
        }
    }

    function autoResizeTextarea(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    }

    function filterBoard() {
        const keyword = document.getElementById('boardFilterInput').value.toLowerCase();
        const cards = document.querySelectorAll('#boardContainer .board-card');
        cards.forEach(card => {
            const title = card.querySelector('.board-title').value.toLowerCase();
            const content = card.querySelector('.board-content').value.toLowerCase();
            if (title.includes(keyword) || content.includes(keyword)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }
    // 랜딩페이지에서 화성ENG(주) 로고를 눌렀을 때 랜딩페이지로 이동하는 함수
function goToLanding() {
    switchTab('landing', document.body);
}

// 탭을 전환하는 핵심 함수 (랜딩페이지와 홈 화면이 겹치지 않게 완벽 분리)
function switchTab(tabId, btn) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
        if (tab.id === 'tab-landing') {
            tab.style.display = 'none'; // 랜딩페이지 숨김
        }
    });
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

    const targetTab = document.getElementById('tab-' + tabId);
    if (targetTab) {
        targetTab.classList.add('active');
        if (tabId === 'landing') {
            targetTab.style.display = 'flex'; // 랜딩페이지일 때만 화면에 띄움
        }
    }

    if (btn && btn.classList && btn.classList.contains('nav-btn')) {
        btn.classList.add('active');
    }

    // 햄버거 메뉴 닫기
    const navMenu = document.getElementById('navMenu');
    if (navMenu) {
        navMenu.classList.remove('show');
    }

    if (tabId !== 'landing' && tabId !== 'home') {
        recordVisitedPage(tabId);
    } else if (tabId === 'home') {
        updateDashboardUpcomingSummary();
        renderRecentVisitedPages();
    }
    setTimeout(refreshAllWidths, 50);
}

// 특정 탭으로 이동할 때 사용하는 함수 (랜딩페이지의 HOME 버튼이 이 함수를 호출합니다)
function navigateToTab(tabId) {
    const btnMap = {
        'home': 'btn-home',
        'schedule': 'btn-schedule',
        'board': 'btn-board',
        'nonconformity': 'btn-nonconformity',
        'contacts': 'btn-contacts',
        'tipboard': 'btn-tipboard',
        'memo': 'btn-memo',
        'calculator': 'btn-calculator'
    };
    const targetBtn = document.querySelector('.' + btnMap[tabId]);
    switchTab(tabId, targetBtn);
}
// 화면의 빈 공간을 클릭했을 때 햄버거 메뉴가 닫히도록 설정
window.addEventListener('click', function(event) {
    const navMenu = document.getElementById('navMenu');
    const hamburgerBtn = document.querySelector('.hamburger-btn');

    // 만약 메뉴가 열려있고, 클릭한 대상이 햄버거 버튼도 아니고 메뉴 창 내부도 아니라면 메뉴 닫기
    if (navMenu && navMenu.classList.contains('show')) {
        if (!navMenu.contains(event.target) && !hamburgerBtn.contains(event.target)) {
            navMenu.classList.remove('show');
        }
    }
});
// EXPORT: 현재 저장된 모든 로컬 데이터를 JSON 파일로 다운로드
function exportDataJson() {
    const backupData = {};
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        backupData[key] = localStorage.getItem(key);
    }

    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `Xshatriya_Backup_${new Date().toISOString().substring(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// IMPORT: JSON 파일을 업로드하여 데이터를 로컬 스토리지에 덮어쓰고 새로고침
function importDataJson(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            if (confirm("가져온 데이터로 업데이트하시겠습니까? 기존 데이터 중 겹치는 항목은 덮어씌워집니다.")) {
                for (const key in importedData) {
                    localStorage.setItem(key, importedData[key]);
                }
                alert("데이터가 성공적으로 업데이트되었습니다. 화면을 새로고침합니다.");
                location.reload();
            }
        } catch (err) {
            alert("유효한 JSON 백업 파일이 아닙니다.");
        }
        // 동일 파일 재선택을 위해 값 초기화
        event.target.value = '';
    };
    reader.readAsText(file);
}
