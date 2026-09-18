import { renderHeader } from "./components/header.js";
import { renderCalendar } from "./components/calendar.js";
import { renderPrograms } from "./components/programs.js";
import { renderReviews } from "./components/reviews.js";
import { renderPadletRooms } from "./components/padletRooms.js";

let activeTab = "calendar"; // 'calendar' | 'programs' | 'reviews' | 'padlet'

document.addEventListener("DOMContentLoaded", () => {
  const headerMount = document.getElementById("header-mount");
  const tabContentMount = document.getElementById("tab-content-mount");
  const modalMount = document.getElementById("modal-mount");
  const navTabs = document.querySelectorAll(".nav-tab-item");

  // 헤더 렌더링
  renderHeader(headerMount);

  // 모달 팝업 열기 함수
  function showEventModal(eventObj) {
    modalMount.innerHTML = `
      <div class="m3-modal-backdrop open" id="modal-backdrop">
        <div class="m3-modal-dialog">
          <div class="modal-header">
            <div style="display:flex; align-items:center; gap:8px;">
              <span class="prog-category-badge ${eventObj.categoryClass}">
                ${eventObj.categoryLabel}
              </span>
              <span style="font-size:13px; font-weight:700; color:#64748b;">
                2026년 ${eventObj.month}월 ${eventObj.day}일
              </span>
            </div>
            <button class="modal-close-btn" id="btn-modal-close" aria-label="닫기">✕</button>
          </div>

          <h2 style="font-size:22px; font-weight:900; color:#1e293b; margin-bottom:4px; line-height:1.3;">
            ${eventObj.title}
          </h2>
          ${eventObj.subtitle ? `<div style="font-size:15px; font-weight:600; color:#475569; margin-bottom:16px;">${eventObj.subtitle}</div>` : '<div style="margin-bottom:16px;"></div>'}

          <div style="background-color:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:16px; margin-bottom:16px;">
            <div class="prog-info-list">
              <div class="prog-info-item">
                <span class="prog-info-label">일시</span>
                <span>2026년 ${eventObj.month}월 ${eventObj.day}일 ${eventObj.time}</span>
              </div>
              <div class="prog-info-item">
                <span class="prog-info-label">장소</span>
                <span>${eventObj.location}</span>
              </div>
              <div class="prog-info-item">
                <span class="prog-info-label">대상</span>
                <span>${eventObj.target}</span>
              </div>
              <div class="prog-info-item">
                <span class="prog-info-label">강사/진행</span>
                <span>${eventObj.instructor}</span>
              </div>
              ${eventObj.manager ? `
                <div class="prog-info-item">
                  <span class="prog-info-label">담당</span>
                  <span style="color:#008080; font-weight:700;">${eventObj.manager} (서부교육지원청)</span>
                </div>
              ` : ''}
              ${eventObj.applyMethod ? `
                <div class="prog-info-item">
                  <span class="prog-info-label">신청방법</span>
                  <span style="font-weight:700;">${eventObj.applyMethod}</span>
                </div>
              ` : ''}
            </div>
          </div>

          <div style="font-size:14px; color:#334155; line-height:1.6; margin-bottom:24px;">
            ${eventObj.description}
          </div>

          <div style="display:flex; gap:10px; justify-content:flex-end;">
            <button id="btn-modal-review" class="btn-m3-outlined">후기 남기기</button>
            <a href="${eventObj.applyUrl}" target="_blank" class="btn-m3-filled">참가 신청 바로가기</a>
          </div>
        </div>
      </div>
    `;

    // 닫기 이벤트
    const backdrop = modalMount.querySelector("#modal-backdrop");
    const closeBtn = modalMount.querySelector("#btn-modal-close");
    const reviewBtn = modalMount.querySelector("#btn-modal-review");

    const closeModal = () => {
      backdrop.classList.remove("open");
      setTimeout(() => { modalMount.innerHTML = ""; }, 200);
    };

    closeBtn.addEventListener("click", closeModal);
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) closeModal();
    });

    reviewBtn.addEventListener("click", () => {
      closeModal();
      switchTab("reviews", eventObj.id);
    });
  }

  // 탭 변경 함수
  function switchTab(tabName, extraData = null) {
    activeTab = tabName;

    // 네비게이션 탭 액티브 상태 업데이트
    navTabs.forEach(tab => {
      if (tab.dataset.tab === tabName) {
        tab.classList.add("active");
      } else {
        tab.classList.remove("active");
      }
    });

    // 해당 탭 뷰 렌더링
    if (tabName === "calendar") {
      renderCalendar(tabContentMount, showEventModal);
    } else if (tabName === "programs") {
      renderPrograms(tabContentMount);
    } else if (tabName === "reviews") {
      renderReviews(tabContentMount, extraData);
    } else if (tabName === "padlet") {
      renderPadletRooms(tabContentMount);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // 탭 버튼 클릭 이벤트 바인딩
  navTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      switchTab(tab.dataset.tab);
    });
  });

  // 전역 탭 이동 커스텀 이벤트 리스너
  window.addEventListener("navigate-tab", (e) => {
    switchTab(e.detail.tab, e.detail.selectedEventId);
  });

  // 인증 상태 변경 리스너
  window.addEventListener("auth-state-changed", () => {
    renderHeader(headerMount);
    if (activeTab === "reviews") {
      renderReviews(tabContentMount);
    }
  });

  // 행사 데이터 갱신 리스너 (엑셀 업로드/초기화 시)
  window.addEventListener("events-updated", () => {
    switchTab(activeTab);
  });

  // 초기 화면 렌더링 (첫 화면: 캘린더)
  switchTab("calendar");
});
