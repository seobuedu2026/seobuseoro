import { getEvents } from "../data/events.js";

let selectedCategory = "all";
let selectedMonth = "all";

export function renderPrograms(container) {
  const allEvents = getEvents();
  const categories = [
    { key: "all", label: "전체 구분" },
    { key: "workshop", label: "연수·워크숍", cls: "cat-workshop" },
    { key: "lecture", label: "특강", cls: "cat-lecture" },
    { key: "festival", label: "성과공유·보고·한마당", cls: "cat-festival" },
    { key: "mentoring", label: "멘토링", cls: "cat-mentoring" },
    { key: "sharing", label: "수업나눔 교육콘서트", cls: "cat-sharing" },
    { key: "sudabox", label: "수다박스", cls: "cat-sudabox" }
  ];

  const months = [
    { key: "all", label: "전체 월" },
    { key: "9", label: "9월" },
    { key: "10", label: "10월" },
    { key: "11", label: "11월" }
  ];

  const filteredEvents = allEvents.filter(ev => {
    const matchCat = selectedCategory === "all" || ev.category === selectedCategory;
    const matchMonth = selectedMonth === "all" || String(ev.month) === selectedMonth;
    return matchCat && matchMonth;
  });

  container.innerHTML = `
    <div class="programs-view-wrapper">
      <div style="margin-bottom: 24px; text-align: center;">
        <h2 style="font-size: 32px; font-weight: 900; color: #0e3753; letter-spacing: -0.5px;">
          프로그램 한눈에 보기
        </h2>
        <p style="font-size: 15px; color: #64748b; margin-top: 6px;">
          월과 유형으로 찾아보고, 카드를 누르면 아래로 확장되어 상세 안내를 확인할 수 있습니다.
        </p>
      </div>

      <!-- 월 & 카테고리 필터 칩 바 -->
      <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 24px;">
        <div class="filter-chips-row" id="prog-month-filter" style="margin-bottom: 0;">
          <span style="font-size: 13px; font-weight: 800; color: #0e3753; margin-right: 4px;">월별:</span>
          ${months.map(m => `
            <button class="m3-chip ${selectedMonth === m.key ? 'active' : ''}" data-month="${m.key}">
              ${m.label}
            </button>
          `).join("")}
        </div>

        <div class="filter-chips-row" id="prog-cat-filter" style="margin-bottom: 0;">
          <span style="font-size: 13px; font-weight: 800; color: #0e3753; margin-right: 4px;">구분:</span>
          ${categories.map(cat => `
            <button class="m3-chip ${selectedCategory === cat.key ? 'active' : ''}" data-cat="${cat.key}">
              ${cat.label}
            </button>
          `).join("")}
        </div>
      </div>

      <div style="font-size: 14px; font-weight: 700; color: #475569; margin-bottom: 16px;">
        총 <strong>${filteredEvents.length}개</strong>의 프로그램이 검색되었습니다.
      </div>

      <!-- 프로그램 카드 그리드 -->
      <div class="program-cards-grid">
        ${filteredEvents.length === 0 ? `
          <div style="grid-column: 1 / -1; text-align: center; padding: 60px; color: #94a3b8; background: #fff; border-radius: 18px; border: 1px dashed #cbd5e1;">
            해당 조건의 프로그램이 없습니다.
          </div>
        ` : filteredEvents.map(ev => `
          <div class="program-card" data-card-id="${ev.id}">
            <div class="prog-card-top">
              <span class="prog-category-badge ${ev.categoryClass}">${ev.categoryLabel}</span>
              <span class="prog-date-badge">${ev.month}월 ${ev.day}일</span>
            </div>
            
            <h3 class="prog-title">${ev.title}</h3>
            ${ev.subtitle ? `<div class="prog-subtitle">${ev.subtitle}</div>` : ''}

            <!-- 아코디언 확장 영역 -->
            <div class="prog-accordion-content">
              <div class="prog-info-list">
                <div class="prog-info-item">
                  <span class="prog-info-label">일시</span>
                  <span>2026년 ${ev.month}월 ${ev.day}일 ${ev.time}</span>
                </div>
                <div class="prog-info-item">
                  <span class="prog-info-label">장소</span>
                  <span>${ev.location}</span>
                </div>
                <div class="prog-info-item">
                  <span class="prog-info-label">대상</span>
                  <span>${ev.target}</span>
                </div>
                <div class="prog-info-item">
                  <span class="prog-info-label">강사/진행</span>
                  <span>${ev.instructor}</span>
                </div>
                <div class="prog-info-item" style="margin-top:6px; line-height:1.5;">
                  <span>${ev.description}</span>
                </div>
              </div>

              <div class="prog-action-buttons">
                <a href="${ev.applyUrl}" target="_blank" class="btn-m3-filled" onclick="event.stopPropagation();">
                  신청 바로가기
                </a>
                <button class="btn-m3-outlined btn-review-shortcut" data-event-id="${ev.id}" onclick="event.stopPropagation();">
                  후기 작성
                </button>
              </div>
            </div>
          </div>
        `).join("")}
      </div>

      <!-- 하단 교육청 공식 푸터 -->
      <footer class="site-footer">
        <div class="footer-org-name">
          서울특별시서부교육지원청 초등교육지원과
        </div>
      </footer>
    </div>
  `;

  // 월 필터 이벤트
  container.querySelectorAll("#prog-month-filter .m3-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      selectedMonth = chip.dataset.month;
      renderPrograms(container);
    });
  });

  // 카테고리 필터 이벤트
  container.querySelectorAll("#prog-cat-filter .m3-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      selectedCategory = chip.dataset.cat;
      renderPrograms(container);
    });
  });

  // 카드 클릭 시 아코디언 토글
  container.querySelectorAll(".program-card").forEach(card => {
    card.addEventListener("click", () => {
      const isAlreadyExpanded = card.classList.contains("expanded");
      container.querySelectorAll(".program-card").forEach(c => c.classList.remove("expanded"));
      if (!isAlreadyExpanded) {
        card.classList.add("expanded");
      }
    });
  });

  // 후기 바로가기 버튼
  container.querySelectorAll(".btn-review-shortcut").forEach(btn => {
    btn.addEventListener("click", () => {
      const eventId = btn.dataset.eventId;
      window.dispatchEvent(new CustomEvent("navigate-tab", { 
        detail: { tab: "reviews", selectedEventId: eventId } 
      }));
    });
  });
}
