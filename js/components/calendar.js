import { getEvents, getMonthThemes, getActiveMonths, getCategories, getHolidayName, saveEvents } from "../data/events.js";
import { GoogleAuthService } from "../auth/googleAuth.js";
import { openEventFormModal } from "./eventFormModal.js";
import { openMonthManagerModal, openMonthThemeEditModal } from "./monthManagerModal.js";
import { openAdminExcelModal } from "./adminExcelModal.js";
import { openCategoryManagerModal } from "./categoryManagerModal.js";

let currentMonth = "all"; // 'all' (3개월 포스터 모드) | 1 ~ 12

export function renderCalendar(container, onSelectEventModal) {
  const user = GoogleAuthService.getCurrentUser();
  const isAdmin = !!(user && user.isAdmin);
  const activeMonths = getActiveMonths();
  const monthThemes = getMonthThemes();
  const categories = getCategories();

  // 현재 선택된 월이 활성 월 목록에 없는 경우 첫 번째 활성 월 또는 'all'로 리셋
  if (currentMonth !== "all" && !activeMonths.includes(currentMonth)) {
    currentMonth = activeMonths[0] || "all";
  }

  const isSingleMonth = currentMonth !== "all";

  container.innerHTML = `
    <div class="calendar-view-wrapper ${isSingleMonth ? 'is-single-month-view' : 'is-poster-view'}">
      <!-- 상단 월 및 뷰 모드 전환 바 (중앙 정렬 및 컴팩트 1줄 구성) -->
      <div class="calendar-view-mode-bar">
        <div class="filter-chips-row" id="month-chips-row">
          ${activeMonths.map(m => {
            const theme = monthThemes[m] || { name: `${m}월`, subtitle: '', icon: '📅' };
            return `
              <button class="m3-chip chip-month-${m} ${currentMonth === m ? 'active' : ''}" data-month="${m}">
                <span>${theme.icon || '📅'} ${m}월</span>${theme.subtitle ? `<span class="chip-text-extra"> · ${theme.subtitle}</span>` : ''}
              </button>
            `;
          }).join("")}
          <button class="m3-chip ${currentMonth === 'all' ? 'active' : ''}" data-month="all">
            <span>✨ 3개월</span><span class="chip-text-extra"> 모아보기</span>
          </button>
        </div>

        ${isAdmin ? `
          <div class="calendar-utility-row">
            <button id="btn-add-calendar-month" class="btn-m3-pill-action" title="캘린더에 표시할 월(Month) 추가 및 관리">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line><line x1="12" y1="14" x2="12" y2="18"></line><line x1="10" y1="16" x2="14" y2="16"></line></svg>
              <span>달력 추가</span>
            </button>
            <button id="btn-excel-import" class="btn-m3-pill-action" title="행사 엑셀 파일(.xlsx) 업로드 등록">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
              <span>엑셀 파일 등록</span>
            </button>
          </div>
        ` : ''}
      </div>

      <!-- 캘린더 컨텐츠 마운트 영역 (화면 100% 꽉 참) -->
      <div id="calendar-content-mount" class="calendar-content-container"></div>

      <!-- 하단 인쇄물 공식 범례 칩 목록 -->
      <div class="brochure-legend-container">
        <div class="legend-chips-list">
          ${categories.map(cat => `
            <span class="legend-badge ${cat.cls}">${cat.label}</span>
          `).join("")}
          ${isAdmin ? `
            <button id="btn-edit-legend-cats" class="btn-m3-pill-action" style="padding: 4px 12px; font-size: 12.5px; border-color: #cbd5e1; background: #f8fafc; color: #0e3753;" title="프로그램 유형 범례 명칭 수정">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
              <span>유형 수정</span>
            </button>
          ` : ''}
        </div>
      </div>
    </div>
  `;

  const contentMount = container.querySelector("#calendar-content-mount");
  renderCalendarCards(contentMount, onSelectEventModal, isAdmin, container);

  // 칩 클릭 이벤트
  container.querySelectorAll("#month-chips-row .m3-chip[data-month]").forEach(chip => {
    chip.addEventListener("click", () => {
      const val = chip.dataset.month;
      currentMonth = val === "all" ? "all" : parseInt(val, 10);
      renderCalendar(container, onSelectEventModal);
    });
  });

  // 달력 추가 (월 추가/관리) 버튼 이벤트
  const btnAddMonth = container.querySelector("#btn-add-calendar-month");
  if (btnAddMonth) {
    btnAddMonth.addEventListener("click", () => {
      openMonthManagerModal(() => {
        renderCalendar(container, onSelectEventModal);
      });
    });
  }

  // 엑셀 등록 버튼 이벤트
  const btnExcel = container.querySelector("#btn-excel-import");
  if (btnExcel) {
    btnExcel.addEventListener("click", () => {
      openAdminExcelModal();
    });
  }

  // 범례(유형) 수정 버튼 이벤트
  const btnEditCats = container.querySelector("#btn-edit-legend-cats");
  if (btnEditCats) {
    btnEditCats.addEventListener("click", () => {
      openCategoryManagerModal(() => {
        renderCalendar(container, onSelectEventModal);
      });
    });
  }

  // 각 월별 문구 수정 버튼 이벤트
  container.querySelectorAll(".btn-edit-month-theme").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const monthVal = parseInt(btn.dataset.month, 10);
      openMonthThemeEditModal(monthVal, () => {
        renderCalendar(container, onSelectEventModal);
      });
    });
  });
}

function renderCalendarCards(mount, onSelectEventModal, isAdmin, mainContainer) {
  const activeMonths = getActiveMonths();

  if (currentMonth === "all") {
    // 3개월 모아보기: 현재 달부터 시작하여 등록된 3개 월 순차 표시
    const currentActualMonth = new Date().getMonth() + 1; // 1~12

    let startIndex = activeMonths.findIndex(m => m >= currentActualMonth);
    if (startIndex === -1) {
      startIndex = 0;
    }

    let threeMonths = activeMonths.slice(startIndex, startIndex + 3);
    if (threeMonths.length < 3 && activeMonths.length >= 3) {
      threeMonths = activeMonths.slice(-3);
    } else if (threeMonths.length === 0) {
      threeMonths = activeMonths;
    }

    mount.innerHTML = `
      <div class="poster-three-months-grid">
        ${threeMonths.map(m => generateMonthCardHTML(m, false, isAdmin)).join("")}
      </div>
    `;
  } else {
    // 단일 월 집중 모드 (화면 100% 꽉 차는 와이드 뷰)
    mount.innerHTML = `
      <div style="width:100%; margin-bottom: 24px;">
        ${generateMonthCardHTML(currentMonth, true, isAdmin)}
      </div>
    `;
  }

  // 관리자 모드: 날짜 빈 공간 클릭 시 새 행사 추가
  if (isAdmin) {
    mount.querySelectorAll(".cal-cell.admin-clickable-cell").forEach(cell => {
      cell.addEventListener("click", (e) => {
        if (e.target.closest(".cal-event-pill")) return;
        const monthVal = parseInt(cell.dataset.month, 10);
        const dayVal = cell.dataset.day;
        openEventFormModal(null, { month: monthVal, day: dayVal }, () => {
          renderCalendar(mainContainer, onSelectEventModal);
        });
      });
    });
  }

  // 행사 칩 드래그 앤 드롭 & 클릭 이벤트 바인딩
  let draggedEventId = null;
  let isDragging = false;

  mount.querySelectorAll(".cal-event-pill").forEach(pill => {
    pill.setAttribute("draggable", "true");

    pill.addEventListener("dragstart", (e) => {
      isDragging = true;
      draggedEventId = pill.dataset.eventId;
      pill.classList.add("is-dragging");
      e.dataTransfer.setData("text/plain", draggedEventId);
      e.dataTransfer.effectAllowed = "move";
    });

    pill.addEventListener("dragend", () => {
      pill.classList.remove("is-dragging");
      mount.querySelectorAll(".cal-cell.drag-over-cell").forEach(c => c.classList.remove("drag-over-cell"));
      setTimeout(() => {
        isDragging = false;
        draggedEventId = null;
      }, 60);
    });

    pill.addEventListener("click", (e) => {
      e.stopPropagation();
      if (isDragging) return;
      const eventId = pill.dataset.eventId;
      const allEvents = getEvents();
      const eventObj = allEvents.find(ev => ev.id === eventId);
      if (eventObj) {
        if (isAdmin) {
          // 관리자는 즉시 행사 수정 모달 열기
          openEventFormModal(eventObj, null, () => {
            renderCalendar(mainContainer, onSelectEventModal);
          });
        } else if (onSelectEventModal) {
          onSelectEventModal(eventObj);
        }
      }
    });
  });

  // 날짜 셀 드롭존 이벤트 바인딩
  mount.querySelectorAll(".cal-cell:not(.empty)").forEach(cell => {
    cell.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      if (!cell.classList.contains("drag-over-cell")) {
        cell.classList.add("drag-over-cell");
      }
    });

    cell.addEventListener("dragleave", (e) => {
      if (!cell.contains(e.relatedTarget)) {
        cell.classList.remove("drag-over-cell");
      }
    });

    cell.addEventListener("drop", (e) => {
      e.preventDefault();
      cell.classList.remove("drag-over-cell");
      const eventId = e.dataTransfer.getData("text/plain") || draggedEventId;
      if (!eventId) return;

      const targetMonth = parseInt(cell.dataset.month, 10);
      const targetDayRaw = cell.dataset.day;
      if (!targetMonth || !targetDayRaw) return;

      const targetDay = isNaN(Number(targetDayRaw)) ? targetDayRaw : parseInt(targetDayRaw, 10);

      const allEvents = getEvents();
      const targetEvent = allEvents.find(ev => ev.id === eventId);

      if (targetEvent) {
        const isSameDate = targetEvent.month === targetMonth && String(targetEvent.day) === String(targetDay);
        if (!isSameDate) {
          targetEvent.month = targetMonth;
          targetEvent.day = targetDay;
          if (typeof targetDay === "number") {
            targetEvent.dateStr = `${targetEvent.year || 2026}-${String(targetMonth).padStart(2, "0")}-${String(targetDay).padStart(2, "0")}`;
          } else {
            targetEvent.dateStr = `${targetEvent.year || 2026}-12-02`;
          }

          saveEvents(allEvents);
          renderCalendar(mainContainer, onSelectEventModal);
        }
      }
    });
  });
}

function generateMonthCardHTML(month, isFocusView = false, isAdmin = false) {
  const monthThemes = getMonthThemes();
  const theme = monthThemes[month] || {
    monthNum: month,
    name: `${month}월`,
    subtitle: "",
    themeColor: "#0e3753",
    themeBg: "#f0fdf4"
  };

  const allEvents = getEvents();
  const monthEvents = allEvents.filter(ev => ev.month === month);

  // 2026년 기준 캘린더 날짜 계산 (윤년 및 월별 일수 자동 반영)
  const year = 2026;
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay(); // 0(일) ~ 6(토)
  const totalDays = new Date(year, month, 0).getDate();

  let daysCellsHTML = "";

  // 1일 이전 빈 칸
  for (let i = 0; i < firstDayOfWeek; i++) {
    daysCellsHTML += `<div class="cal-cell empty"></div>`;
  }

  // 해당 월 일자 칸 생성 (공휴일 자동 매핑)
  for (let day = 1; day <= totalDays; day++) {
    const dayOfWeek = (firstDayOfWeek + day - 1) % 7;
    const isSun = dayOfWeek === 0;
    const isSat = dayOfWeek === 6;
    const holidayName = getHolidayName(year, month, day);
    const isHoliday = !!holidayName || isSun;
    const dayClass = isHoliday ? "sun holiday" : (isSat ? "sat" : "");

    // 해당 일자 행사들
    const dayEvents = monthEvents.filter(ev => ev.day === day || ev.day === String(day));

    const eventPillsHTML = dayEvents.map(ev => `
      <div class="cal-event-pill ${ev.categoryClass}" data-event-id="${ev.id}" title="${isAdmin ? '[관리자] 클릭하여 행사 수정: ' : ''}${ev.title} ${ev.subtitle || ''}">
        <div>${ev.title}</div>
        ${ev.subtitle ? `<div class="pill-sub">${ev.subtitle}</div>` : ''}
      </div>
    `).join("");

    daysCellsHTML += `
      <div class="cal-cell ${dayClass} ${isAdmin ? 'admin-clickable-cell' : ''}" data-month="${month}" data-day="${day}" ${isAdmin ? `title="클릭하여 ${month}월 ${day}일 새 행사 추가"` : ''}>
        <div class="cal-cell-daynum">
          <span>${day}</span>
          ${holidayName ? `<span class="cal-holiday-name">${holidayName}</span>` : ''}
          ${isAdmin ? `<span class="admin-cell-quick-add" title="${month}월 ${day}일 새 행사 추가">+</span>` : ''}
        </div>
        ${eventPillsHTML}
      </div>
    `;
  }

  // 11월의 경우 인쇄물에 12/1 ~ 12/5 추가 표기
  if (month === 11) {
    const decDays = ["12/1", "12/2", "12/3", "12/4", "12/5"];
    decDays.forEach(dStr => {
      const decEvents = monthEvents.filter(ev => ev.day === dStr);
      const eventPillsHTML = decEvents.map(ev => `
        <div class="cal-event-pill ${ev.categoryClass}" data-event-id="${ev.id}" title="${isAdmin ? '[관리자] 클릭하여 행사 수정: ' : ''}${ev.title}">
          <div>${ev.title}</div>
          ${ev.subtitle ? `<div class="pill-sub">${ev.subtitle}</div>` : ''}
        </div>
      `).join("");

      daysCellsHTML += `
        <div class="cal-cell ${isAdmin ? 'admin-clickable-cell' : ''}" data-month="11" data-day="${dStr}" style="background-color:#fcfcfd;" ${isAdmin ? `title="클릭하여 11월 ${dStr} 새 행사 추가"` : ''}>
          <div class="cal-cell-daynum" style="color:#64748b; font-size:11px;">
            <span>${dStr}</span>
            ${isAdmin ? `<span class="admin-cell-quick-add" title="새 행사 추가">+</span>` : ''}
          </div>
          ${eventPillsHTML}
        </div>
      `;
    });
  }

  // 마지막 줄 빈 칸 채우기 (7의 배수)
  const totalRendered = firstDayOfWeek + totalDays + (month === 11 ? 5 : 0);
  const remainingCells = (7 - (totalRendered % 7)) % 7;
  for (let i = 0; i < remainingCells; i++) {
    daysCellsHTML += `<div class="cal-cell empty"></div>`;
  }

  const focusClass = isFocusView ? "focus-month-view" : "";

  return `
    <div class="single-month-card ${focusClass}">
      <div class="month-card-header month-${month}-header" style="background: ${theme.themeBg || '#f8fafc'};">
        <div class="month-title-badge-group">
          <span class="month-big-num">${theme.name || `${month}월`}</span>
          ${theme.subtitle ? `<span class="month-subtitle-pill">${theme.subtitle}</span>` : ''}
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size:13px; font-weight:800; color:#475569;">${monthEvents.length}개 프로그램</span>
          ${isAdmin ? `
            <button class="btn-edit-month-theme btn-m3-outlined" data-month="${month}" title="이 월의 소제목 및 강조 안내 문구 수정" style="padding: 2px 8px; font-size: 11px; border-radius: 6px; font-weight: 800; border-color: #0e3753; color: #0e3753; background: #ffffff;">
              ✏️ 문구 수정
            </button>
          ` : ''}
        </div>
      </div>

      ${theme.highlightWeek ? `
        <div class="week-highlight-ribbon">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
          <span>${theme.highlightWeek}${theme.highlightRange ? ` (${theme.highlightRange})` : ''}</span>
        </div>
      ` : ''}

      <div class="cal-grid-head">
        <div>일</div>
        <div>월</div>
        <div>화</div>
        <div>수</div>
        <div>목</div>
        <div>금</div>
        <div>토</div>
      </div>

      <div class="cal-grid-days">
        ${daysCellsHTML}
      </div>
    </div>
  `;
}


