import { getEvents, MONTH_THEMES } from "../data/events.js";

let currentMonth = "all"; // 'all' (3개월 포스터 모드) | 9 | 10 | 11

export function renderCalendar(container, onSelectEventModal) {
  const isSingleMonth = currentMonth !== "all";

  container.innerHTML = `
    <div class="calendar-view-wrapper ${isSingleMonth ? 'is-single-month-view' : 'is-poster-view'}">
      <!-- 상단 월 및 뷰 모드 전환 바 -->
      <div class="calendar-view-mode-bar">
        <div class="filter-chips-row" id="month-chips-row" style="margin-bottom:0;">
          <button class="m3-chip chip-month-9 ${currentMonth === 9 ? 'active' : ''}" data-month="9">
            <span>🌿 9월</span><span class="chip-text-extra"> · 수다박스의 달</span>
          </button>
          <button class="m3-chip chip-month-10 ${currentMonth === 10 ? 'active' : ''}" data-month="10">
            <span>🌸 10월</span><span class="chip-text-extra"> · 수업나눔의 달</span>
          </button>
          <button class="m3-chip chip-month-11 ${currentMonth === 11 ? 'active' : ''}" data-month="11">
            <span>🍁 11월</span><span class="chip-text-extra"> · 성과공유의 달</span>
          </button>
          <button class="m3-chip ${currentMonth === 'all' ? 'active' : ''}" data-month="all">
            <span>✨ 3개월</span><span class="chip-text-extra"> 모아보기</span>
          </button>
        </div>

        <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
          <a href="assets/docs/seobu_growth_calendar_print.pdf" download="2026학년도_서부서로_수업성장캘린더.pdf" target="_blank" class="btn-m3-outlined" style="padding:6px 14px; font-size:12.5px; border-radius:9999px; display:inline-flex; align-items:center; gap:6px; font-weight:800; color:#0e3753;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            PDF 파일 저장
          </a>
          <div style="font-size:14px; font-weight:800; color:#475569;">
            총 <strong>${getEvents().length}개</strong>의 성장 프로그램
          </div>
        </div>
      </div>

      <!-- 캘린더 컨텐츠 마운트 영역 (화면 100% 꽉 참) -->
      <div id="calendar-content-mount" class="calendar-content-container"></div>

      <!-- 하단 인쇄물 공식 범례 칩 목록 -->
      <div class="brochure-legend-container">
        <div style="font-size:15px; font-weight:900; color:#0e3753;">
          구분
        </div>
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
  renderCalendarCards(contentMount, onSelectEventModal);

  // 칩 클릭 이벤트
  container.querySelectorAll("#month-chips-row .m3-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      const val = chip.dataset.month;
      currentMonth = val === "all" ? "all" : parseInt(val, 10);
      renderCalendar(container, onSelectEventModal);
    });
  });
}

function renderCalendarCards(container, onSelectEventModal) {
  if (currentMonth === "all") {
    // 3개월 나란히 포스터 모드 (화면 너비 꽉 참)
    container.innerHTML = `
      <div class="poster-three-months-grid">
        ${[9, 10, 11].map(m => generateMonthCardHTML(m, false)).join("")}
      </div>
    `;
  } else {
    // 단일 월 집중 모드 (화면 100% 꽉 차는 와이드 뷰)
    container.innerHTML = `
      <div style="width:100%; margin-bottom: 24px;">
        ${generateMonthCardHTML(currentMonth, true)}
      </div>
    `;
  }

  // 행사 칩 클릭 이벤트 바인딩
  container.querySelectorAll(".cal-event-pill").forEach(pill => {
    pill.addEventListener("click", (e) => {
      e.stopPropagation();
      const eventId = pill.dataset.eventId;
      const allEvents = getEvents();
      const eventObj = allEvents.find(ev => ev.id === eventId);
      if (eventObj && onSelectEventModal) {
        onSelectEventModal(eventObj);
      }
    });
  });
}

const HOLIDAYS_2026 = {
  9: {
    24: "추석연휴",
    25: "추석",
    26: "추석연휴"
  },
  10: {
    3: "개천절",
    5: "대체공휴일",
    9: "한글날"
  }
};

function generateMonthCardHTML(month, isFocusView = false) {
  const theme = MONTH_THEMES[month];
  const allEvents = getEvents();
  const monthEvents = allEvents.filter(ev => ev.month === month);

  // 2026년 기준 캘린더 날짜 계산
  const year = 2026;
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay(); // 0(일) ~ 6(토)
  const totalDays = new Date(year, month, 0).getDate();

  let daysCellsHTML = "";

  // 1일 이전 빈 칸
  for (let i = 0; i < firstDayOfWeek; i++) {
    daysCellsHTML += `<div class="cal-cell empty"></div>`;
  }

  // 해당 월 일자 칸 생성
  for (let day = 1; day <= totalDays; day++) {
    const dayOfWeek = (firstDayOfWeek + day - 1) % 7;
    const isSun = dayOfWeek === 0;
    const isSat = dayOfWeek === 6;
    const holidayName = (HOLIDAYS_2026[month] && HOLIDAYS_2026[month][day]) || null;
    const isHoliday = !!holidayName || isSun;
    const dayClass = isHoliday ? "sun holiday" : (isSat ? "sat" : "");

    // 해당 일자 행사들
    const dayEvents = monthEvents.filter(ev => ev.day === day);

    const eventPillsHTML = dayEvents.map(ev => `
      <div class="cal-event-pill ${ev.categoryClass}" data-event-id="${ev.id}" title="${ev.title} ${ev.subtitle || ''}">
        <div>${ev.title}</div>
        ${ev.subtitle ? `<div class="pill-sub">${ev.subtitle}</div>` : ''}
      </div>
    `).join("");

    daysCellsHTML += `
      <div class="cal-cell ${dayClass}">
        <div class="cal-cell-daynum">
          <span>${day}</span>
          ${holidayName ? `<span class="cal-holiday-name">${holidayName}</span>` : ''}
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
        <div class="cal-event-pill ${ev.categoryClass}" data-event-id="${ev.id}">
          <div>${ev.title}</div>
          ${ev.subtitle ? `<div class="pill-sub">${ev.subtitle}</div>` : ''}
        </div>
      `).join("");

      daysCellsHTML += `
        <div class="cal-cell" style="background-color:#fcfcfd;">
          <div class="cal-cell-daynum" style="color:#64748b; font-size:11px;">
            <span>${dStr}</span>
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
      <div class="month-card-header month-${month}-header">
        <div class="month-title-badge-group">
          <span class="month-big-num">${theme.name}</span>
          <span class="month-subtitle-pill">${theme.subtitle}</span>
        </div>
        <span style="font-size:13px; font-weight:800; color:#475569;">${monthEvents.length}개 프로그램</span>
      </div>

      ${theme.highlightWeek ? `
        <div class="week-highlight-ribbon">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
          <span>${theme.highlightWeek} (${theme.highlightRange})</span>
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
