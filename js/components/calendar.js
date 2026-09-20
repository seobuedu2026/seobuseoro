import { getEvents, getMonthThemes, getActiveMonths, getOverviewMonths, getCategories, getHolidayName, saveEvents, getSelectedYear, setSelectedYear, AVAILABLE_YEARS } from "../data/events.js?v=20260920_v64";
import { GoogleAuthService } from "../auth/googleAuth.js?v=20260920_v64";
import { openEventFormModal } from "./eventFormModal.js?v=20260920_v64";
import { openMonthManagerModal, openMonthThemeEditModal } from "./monthManagerModal.js?v=20260920_v64";
import { openAdminExcelModal } from "./adminExcelModal.js?v=20260920_v64";
import { openCategoryManagerModal } from "./categoryManagerModal.js?v=20260920_v64";

let currentMonth = "all"; // 'all' (모아보기 모드) | 1 ~ 12

export function renderCalendar(container, onSelectEventModal) {
  const user = GoogleAuthService.getCurrentUser();
  const isAdmin = !!(user && user.isAdmin);
  const currentYear = getSelectedYear();
  const activeMonths = getActiveMonths();
  const overviewMonths = getOverviewMonths();
  const monthThemes = getMonthThemes();
  const categories = getCategories();

  // 현재 선택된 월이 활성 월 목록에 없는 경우 첫 번째 활성 월 또는 'all'로 리셋
  if (currentMonth !== "all" && !activeMonths.includes(currentMonth)) {
    currentMonth = activeMonths[0] || "all";
  }

  const isSingleMonth = currentMonth !== "all";

  container.innerHTML = `
    <div class="calendar-view-wrapper ${isSingleMonth ? 'is-single-month-view' : 'is-poster-view'}">
      <!-- 상단 연도/월 및 뷰 모드 전환 바 (중앙: 연도+월 칩 / 우측: 달력추가+엑셀등록) -->
      <div class="calendar-view-mode-bar">
        <!-- 화면 정가운데: 월 칩 목록 -->
        <div class="calendar-center-controls">
          <!-- 월 칩 목록 -->
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
              <span>✨ ${overviewMonths.length > 0 ? overviewMonths.length : 3}개월</span><span class="chip-text-extra"> 모아보기</span>
            </button>
          </div>
        </div>

        ${isAdmin ? `
          <div class="calendar-utility-row">
            <button id="btn-add-calendar-month" class="btn-admin-action" title="캘린더에 표시할 월(Month) 추가 및 관리">
              달력 추가
            </button>
            <button id="btn-excel-import" class="btn-admin-action" title="행사 엑셀 파일(.xlsx) 업로드 등록">
              엑셀 파일 등록
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
            <button id="btn-edit-legend-cats" class="btn-admin-action" title="프로그램 유형 추가 및 관리">
              유형 추가·관리
            </button>
          ` : ''}
        </div>
      </div>

      <!-- 안내 문구 (범례 아래 푸른 배경 위) -->
      <div style="text-align: center; margin-top: 14px; margin-bottom: 6px; font-size: 13.5px; font-weight: 700; color: #475569;">
        ※ 세부 일정 및 장소는 학교 공문 및 신청 링크를 통해 확인하시기 바랍니다.
      </div>
    </div>
  `;

  const contentMount = container.querySelector("#calendar-content-mount");
  renderCalendarCards(contentMount, onSelectEventModal, isAdmin, container, currentYear);



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

function renderCalendarCards(mount, onSelectEventModal, isAdmin, mainContainer, currentYear) {
  const activeMonths = getActiveMonths();

  if (currentMonth === "all") {
    // 모아보기: 관리자가 선택한 모아보기 포함 월 표시
    const overviewMonths = getOverviewMonths();
    const monthsToShow = (overviewMonths && overviewMonths.length > 0) ? overviewMonths : activeMonths.slice(0, 3);
    const cols = monthsToShow.length === 1 ? 1 : monthsToShow.length === 2 ? 2 : monthsToShow.length >= 4 ? Math.min(monthsToShow.length, 4) : 3;

    mount.innerHTML = `
      <div class="poster-three-months-grid" style="${monthsToShow.length === 1 ? 'max-width: 980px; margin: 0 auto;' : ''} ${monthsToShow.length !== 3 ? `grid-template-columns: repeat(${cols}, minmax(0, 1fr));` : ''}">
        ${monthsToShow.map(m => generateMonthCardHTML(m, false, isAdmin, currentYear)).join("")}
      </div>
    `;
  } else {
    // 단일 월 집중 모드 (화면 100% 꽉 차는 와이드 뷰)
    mount.innerHTML = `
      <div style="width:100%; margin-bottom: 24px;">
        ${generateMonthCardHTML(currentMonth, true, isAdmin, currentYear)}
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
        openEventFormModal(null, { year: currentYear, month: monthVal, day: dayVal }, () => {
          renderCalendar(mainContainer, onSelectEventModal);
        });
      });
    });
  }

  // 행사 칩 드래그 앤 드롭 (관리자 전용) & 클릭 이벤트 바인딩
  let draggedEventId = null;
  let isDragging = false;

  mount.querySelectorAll(".cal-event-pill").forEach(pill => {
    if (isAdmin) {
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
    }

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
          targetEvent.year = currentYear;
          targetEvent.month = targetMonth;
          targetEvent.day = targetDay;
          if (typeof targetDay === "number") {
            targetEvent.dateStr = `${currentYear}-${String(targetMonth).padStart(2, "0")}-${String(targetDay).padStart(2, "0")}`;
          } else {
            targetEvent.dateStr = `${currentYear}-12-02`;
          }

          saveEvents(allEvents);
          renderCalendar(mainContainer, onSelectEventModal);
        }
      }
    });
  });
}

function generateMonthCardHTML(month, isFocusView = false, isAdmin = false, currentYear = 2026) {
  const monthThemes = getMonthThemes();
  const theme = monthThemes[month] || {
    monthNum: month,
    name: `${month}월`,
    subtitle: "",
    themeColor: "#0e3753",
    themeBg: "#f0fdf4"
  };

  const allEvents = getEvents();
  // 연도별 및 월별 필터링
  const monthEvents = allEvents.filter(ev => {
    const evYear = ev.year ? parseInt(ev.year, 10) : 2026;
    return ev.month === month && evYear === currentYear;
  });

  // 선택된 연도 기준 캘린더 날짜 계산 (윤년 및 월별 일수 자동 반영)
  const year = currentYear;
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
          <span class="month-program-count" style="font-size:13px; font-weight:800; color:#475569;">${monthEvents.length}개 프로그램</span>
          ${isAdmin ? `
            <button class="btn-edit-month-theme btn-admin-action" data-month="${month}" title="이 월의 소제목 및 강조 안내 문구 수정">
              문구 수정
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


