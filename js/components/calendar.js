import { getEvents, getMonthThemes, getActiveMonths, getHolidayName, saveEvents } from "../data/events.js";
import { GoogleAuthService } from "../auth/googleAuth.js";
import { openEventFormModal } from "./eventFormModal.js";
import { openMonthManagerModal, openMonthThemeEditModal } from "./monthManagerModal.js";
import { openAdminExcelModal } from "./adminExcelModal.js";

let currentMonth = "all"; // 'all' (3개월 포스터 모드) | 1 ~ 12

export function renderCalendar(container, onSelectEventModal) {
  const user = GoogleAuthService.getCurrentUser();
  const isAdmin = !!(user && user.isAdmin);
  const activeMonths = getActiveMonths();
  const monthThemes = getMonthThemes();

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

        <div class="calendar-utility-row">
          <button id="btn-excel-import" class="btn-m3-outlined btn-pdf-download" title="행사 엑셀 파일(.xlsx) 업로드 등록">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
            <span>엑셀 파일 등록</span>
          </button>
          <a href="assets/docs/seobu_growth_calendar_print.pdf" download="2026학년도_서부서로_수업성장캘린더.pdf" target="_blank" class="btn-m3-outlined btn-pdf-download">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            <span>PDF 파일 저장</span>
          </a>
        </div>
      </div>

      <!-- 캘린더 컨텐츠 마운트 영역 (화면 100% 꽉 참) -->
      <div id="calendar-content-mount" class="calendar-content-container"></div>

      <!-- 하단 인쇄물 공식 범례 칩 목록 -->
      <div class="brochure-legend-container">
        <div class="legend-chips-list">
          <span class="legend-badge cat-workshop">연수·워크숍</span>
          <span class="legend-badge cat-lecture">특강</span>
          <span class="legend-badge cat-festival">성과공유·보고·한마당</span>
          <span class="legend-badge cat-mentoring">멘토링</span>
          <span class="legend-badge cat-sharing">수업나눔 교육콘서트</span>
          <span class="legend-badge cat-sudabox">수다박스</span>
        </div>
      </div>
    </div>
  `;

  const contentMount = container.querySelector("#calendar-content-mount");
  renderCalendarCards(contentMount, onSelectEventModal, true, container);

  // 칩 클릭 이벤트
  container.querySelectorAll("#month-chips-row .m3-chip[data-month]").forEach(chip => {
    chip.addEventListener("click", () => {
      const val = chip.dataset.month;
      currentMonth = val === "all" ? "all" : parseInt(val, 10);
      renderCalendar(container, onSelectEventModal);
    });
  });

  // 엑셀 등록 버튼 이벤트
  const btnExcel = container.querySelector("#btn-excel-import");
  if (btnExcel) {
    btnExcel.addEventListener("click", () => {
      openAdminExcelModal();
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
          <button class="btn-edit-month-theme btn-m3-outlined" data-month="${month}" title="이 월의 소제목 및 강조 안내 문구 수정" style="padding: 2px 8px; font-size: 11px; border-radius: 6px; font-weight: 800; border-color: #0e3753; color: #0e3753; background: #ffffff;">
            ✏️ 문구 수정
          </button>
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


