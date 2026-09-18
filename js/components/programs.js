import { getEvents, isEventPastOrToday, getActiveMonths } from "../data/events.js";
import { GoogleAuthService } from "../auth/googleAuth.js";
import { openEventFormModal } from "./eventFormModal.js";

let selectedCategory = "all";
let selectedMonth = "all";

export function renderPrograms(container, onSelectEventModal) {
  const user = GoogleAuthService.getCurrentUser();
  const isAdmin = !!(user && user.isAdmin);
  const allEvents = getEvents();

  const categories = [
    { key: "all", label: "전체" },
    { key: "workshop", label: "연수·워크숍", cls: "cat-workshop" },
    { key: "lecture", label: "특강", cls: "cat-lecture" },
    { key: "festival", label: "성과공유·보고·한마당", cls: "cat-festival" },
    { key: "mentoring", label: "멘토링", cls: "cat-mentoring" },
    { key: "sharing", label: "수업나눔 교육콘서트", cls: "cat-sharing" },
    { key: "sudabox", label: "수다박스", cls: "cat-sudabox" }
  ];

  const activeMonths = getActiveMonths();
  const months = [
    { key: "all", label: "전체" },
    ...activeMonths.map(m => ({ key: String(m), label: `${m}월` }))
  ];

  const filteredEvents = allEvents.filter(ev => {
    const matchCat = selectedCategory === "all" || ev.category === selectedCategory;
    const matchMonth = selectedMonth === "all" || String(ev.month) === selectedMonth;
    return matchCat && matchMonth;
  }).sort((a, b) => {
    const monthA = parseInt(a.month, 10) || 0;
    const monthB = parseInt(b.month, 10) || 0;
    if (monthA !== monthB) return monthA - monthB;
    const dayA = typeof a.day === "number" ? a.day : parseInt(String(a.day).replace(/\D/g, '') || '99', 10);
    const dayB = typeof b.day === "number" ? b.day : parseInt(String(b.day).replace(/\D/g, '') || '99', 10);
    return dayA - dayB;
  });

  container.innerHTML = `
    <div class="programs-view-wrapper">
      <div style="margin-bottom: 24px; text-align: center;">
        <h2 style="font-size: 32px; font-weight: 900; color: #0e3753; letter-spacing: -0.5px;">
          프로그램 한눈에 보기
        </h2>
        <p style="font-size: 15px; color: #64748b; margin-top: 6px;">
          월과 유형으로 찾아보고, 카드를 누르면 상세 내용을 펼쳐보거나 접을 수 있습니다.
        </p>
      </div>

      <!-- 새 프로그램 추가 버튼 (관리자 전용) -->
      ${isAdmin ? `
        <div style="display: flex; justify-content: center; margin-bottom: 20px;">
          <button id="btn-add-program" class="btn-m3-pill-action">
            <span>➕ 새 프로그램 추가</span>
          </button>
        </div>
      ` : ''}

      <!-- 월 & 카테고리 필터 칩 바 (두 줄 시작 정렬 맞춤) -->
      <div style="display: flex; justify-content: center; margin-bottom: 24px; width: 100%;">
        <div style="display: inline-flex; flex-direction: column; gap: 10px; align-items: flex-start; max-width: 100%;">
          <div class="filter-chips-row" id="prog-month-filter" style="margin-bottom: 0; display: flex; align-items: center; justify-content: flex-start; gap: 8px; flex-wrap: wrap;">
            ${months.map(m => `
              <button class="m3-chip ${selectedMonth === m.key ? 'active' : ''}" data-month="${m.key}">
                ${m.label}
              </button>
            `).join("")}
          </div>

          <div class="filter-chips-row" id="prog-cat-filter" style="margin-bottom: 0; display: flex; align-items: center; justify-content: flex-start; gap: 8px; flex-wrap: wrap;">
            ${categories.map(cat => `
              <button class="m3-chip ${selectedCategory === cat.key ? 'active' : ''}" data-cat="${cat.key}">
                ${cat.label}
              </button>
            `).join("")}
          </div>
        </div>
      </div>

      <!-- 프로그램 카드 그리드 -->
      <div class="program-cards-grid">
        ${filteredEvents.length === 0 ? `
          <div style="grid-column: 1 / -1; text-align: center; padding: 60px; color: #94a3b8; background: #fff; border-radius: 18px; border: 1px dashed #cbd5e1;">
            해당 조건의 프로그램이 없습니다.
          </div>
        ` : filteredEvents.map(ev => {
          const catClass = ev.categoryClass || 'cat-workshop';
          const catLabel = ev.categoryLabel || '연수·워크숍';
          const evTime = ev.time || '14:00 ~ 17:00';
          const evLoc = ev.location || '서부교육지원청';
          const evTarget = ev.target || '관내 교원';
          const evApplyMethod = (ev.applyUrl && (ev.applyUrl.startsWith('http://') || ev.applyUrl.startsWith('https://'))) 
            ? (ev.applyMethod || '온라인 링크') 
            : '추후안내';

          return `
          <div class="program-card clickable-program-card" data-card-id="${ev.id}" style="cursor: pointer;">
            <div class="prog-card-top">
              <span class="prog-category-badge ${catClass}">${catLabel}</span>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span class="prog-date-badge">2026년 ${ev.month}월 ${ev.day}일</span>
                ${isAdmin ? `
                  <button class="btn-edit-prog btn-m3-outlined" data-event-id="${ev.id}" title="프로그램 수정" style="padding: 2px 8px; font-size: 11px; border-radius: 6px; font-weight: 800; border-color: #0e3753; color: #0e3753; background: #ffffff;" onclick="event.stopPropagation();">
                    ✏️ 수정
                  </button>
                ` : ''}
                <span class="prog-chevron" style="margin-left: 4px;">▼</span>
              </div>
            </div>
            
            <h3 class="prog-title">${ev.title || '프로그램'}</h3>
            ${ev.subtitle ? `<div class="prog-subtitle">${ev.subtitle}</div>` : ''}

            <!-- 아코디언 펼침 상세 내용 영역 -->
            <div class="prog-accordion-content">
              <!-- 캘린더 스타일과 동일한 정보 박스 -->
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; margin-bottom: 12px;">
                <div class="prog-info-list" style="margin-bottom: 0;">
                  <div class="prog-info-item">
                    <span class="prog-info-label">일시</span>
                    <span>2026년 ${ev.month}월 ${ev.day}일 ${evTime}</span>
                  </div>
                  <div class="prog-info-item">
                    <span class="prog-info-label">장소</span>
                    <span>${evLoc}</span>
                  </div>
                  <div class="prog-info-item">
                    <span class="prog-info-label">대상</span>
                    <span>${evTarget}</span>
                  </div>
                  <div class="prog-info-item">
                    <span class="prog-info-label">신청방법</span>
                    <span style="font-weight: 700;">${evApplyMethod}</span>
                  </div>
                </div>
              </div>

              ${ev.description ? `
                <div style="font-size: 13.5px; color: #475569; line-height: 1.5; margin-bottom: 14px;">
                  ${ev.description}
                </div>
              ` : ''}

              <!-- 하단 액션 버튼 바 (우측 정렬) -->
              <div style="display: flex; gap: 8px; justify-content: flex-end; align-items: center; padding-top: 4px;">
                <button class="btn-m3-outlined btn-review-shortcut" data-event-id="${ev.id}" onclick="event.stopPropagation();">
                  후기 남기기
                </button>
                ${ev.applyUrl && (ev.applyUrl.startsWith('http://') || ev.applyUrl.startsWith('https://')) ? `
                  <a href="${ev.applyUrl}" target="_blank" class="btn-m3-filled" onclick="event.stopPropagation();">
                    참가 신청 바로가기
                  </a>
                ` : `
                  <button class="btn-m3-outlined" disabled style="opacity: 0.75; cursor: default; background: #f8fafc; font-weight: 700;" onclick="event.stopPropagation();">
                    신청: 추후안내
                  </button>
                `}
              </div>
            </div>
          </div>
        `;
        }).join("")}
      </div>
    </div>
  `;

  // 새 프로그램 추가 버튼 이벤트 바인딩
  const btnAddProg = container.querySelector("#btn-add-program");
  if (btnAddProg) {
    btnAddProg.addEventListener("click", () => {
      openEventFormModal(null, null, () => renderPrograms(container, onSelectEventModal));
    });
  }

  // 프로그램 수정 버튼들
  container.querySelectorAll(".btn-edit-prog").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const eventId = btn.dataset.eventId;
      const currentList = getEvents();
      const targetEv = currentList.find(ev => ev.id === eventId);
      if (targetEv) {
        openEventFormModal(targetEv, null, () => renderPrograms(container, onSelectEventModal));
      }
    });
  });

  // 월 필터 이벤트
  container.querySelectorAll("#prog-month-filter .m3-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      selectedMonth = chip.dataset.month;
      renderPrograms(container, onSelectEventModal);
    });
  });

  // 카테고리 필터 이벤트
  container.querySelectorAll("#prog-cat-filter .m3-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      selectedCategory = chip.dataset.cat;
      renderPrograms(container, onSelectEventModal);
    });
  });

  // 카드 클릭 시 아코디언 펼치기/접기 토글
  container.querySelectorAll(".clickable-program-card").forEach(card => {
    card.addEventListener("click", (e) => {
      // 버튼 또는 링크 클릭 시 카드 접기/펼치기 방지
      if (e.target.closest("button") || e.target.closest("a") || e.target.closest("input")) {
        return;
      }
      card.classList.toggle("expanded");
    });
  });

  // 후기 바로가기 버튼
  container.querySelectorAll(".btn-review-shortcut").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const eventId = btn.dataset.eventId;
      const allEvents = getEvents();
      const targetEv = allEvents.find(e => e.id === eventId);
      if (targetEv && !isEventPastOrToday(targetEv)) {
        alert(`⚠️ [${targetEv.month}월 ${targetEv.day}일] 행사는 아직 진행 전입니다.\n후기 작성은 행사 진행 당일부터 가능합니다.`);
        return;
      }
      window.dispatchEvent(new CustomEvent("navigate-tab", { 
        detail: { tab: "reviews", selectedEventId: eventId } 
      }));
    });
  });
}

