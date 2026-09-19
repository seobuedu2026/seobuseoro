import { renderHeader } from "./components/header.js";
import { renderFooter } from "./components/footer.js";
import { renderCalendar } from "./components/calendar.js";
import { renderPrograms } from "./components/programs.js";
import { renderReviews } from "./components/reviews.js";
import { renderPadletRooms } from "./components/padletRooms.js";
import { openEventFormModal } from "./components/eventFormModal.js";
import { GoogleAuthService } from "./auth/googleAuth.js";
import { isEventPastOrToday } from "./data/events.js";

let activeTab = "calendar"; // 'calendar' | 'programs' | 'reviews' | 'padlet'

document.addEventListener("DOMContentLoaded", () => {
  const headerMount = document.getElementById("header-mount");
  const footerMount = document.getElementById("footer-mount");
  const tabContentMount = document.getElementById("tab-content-mount");
  const modalMount = document.getElementById("modal-mount");
  const navTabs = document.querySelectorAll(".nav-tab-item");

  // 헤더 및 푸터 렌더링
  renderHeader(headerMount);
  renderFooter(footerMount);

  // 모달 팝업 열기 함수
  function showEventModal(eventObj) {
    const user = GoogleAuthService.getCurrentUser();
    const isAdmin = !!(user && user.isAdmin);

    modalMount.innerHTML = `
      <div class="m3-modal-backdrop open" id="modal-backdrop">
        <div class="m3-modal-dialog">
          <div class="modal-header">
            <div style="display:flex; align-items:center; gap:8px;">
              <span class="prog-category-badge ${eventObj.categoryClass}">
                ${eventObj.categoryLabel}
              </span>
              <span style="font-size:13px; font-weight:700; color:#64748b;">
                ${eventObj.year || 2026}년 ${eventObj.month}월 ${eventObj.day}일
              </span>
            </div>
            <button class="modal-close-btn" id="btn-modal-close" aria-label="닫기">✕</button>
          </div>

          <!-- 제목 및 부제목 & 신청 바로가기 버튼 영역 -->
          <div style="display:flex; justify-content:space-between; align-items:center; gap:16px; margin-bottom:18px; flex-wrap:wrap;">
            <div style="flex:1; min-width:240px;">
              <h2 style="font-size:22px; font-weight:900; color:#0e3753; margin-bottom:4px; line-height:1.3;">
                ${eventObj.title}
              </h2>
              ${eventObj.subtitle ? `<div style="font-size:15px; font-weight:600; color:#475569;">${eventObj.subtitle}</div>` : ''}
            </div>

            <!-- 제목/설명 우측 신청 바로가기 버튼 -->
            <div style="flex-shrink:0; display:flex; align-items:center;">
              ${(eventObj.applyUrl && (eventObj.applyUrl.startsWith('http://') || eventObj.applyUrl.startsWith('https://'))) ? `
                <a href="${eventObj.applyUrl}" target="_blank" class="btn-m3-filled" style="white-space:nowrap; padding:9px 18px; font-size:13.5px; font-weight:800; background:#0e3753; color:#ffffff; border-radius:9999px; text-decoration:none; display:inline-flex; align-items:center; box-shadow:0 2px 8px rgba(14, 55, 83, 0.2);">
                  참가 신청 바로가기
                </a>
              ` : `
                <button class="btn-m3-outlined" disabled style="opacity:0.75; cursor:default; background:#f8fafc; font-weight:700; white-space:nowrap; padding:8px 16px; font-size:13px; border-radius:9999px; border-color:#cbd5e1; color:#64748b;">
                  신청: 추후안내
                </button>
              `}
            </div>
          </div>

          <div style="background-color:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:16px; margin-bottom:16px;">
            <div class="prog-info-list">
              <div class="prog-info-item">
                <span class="prog-info-label">일시</span>
                <span>${eventObj.year || 2026}년 ${eventObj.month}월 ${eventObj.day}일 ${eventObj.time}</span>
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
                <span class="prog-info-label">신청방법</span>
                <span style="font-weight:700;">${(eventObj.applyUrl && (eventObj.applyUrl.startsWith('http://') || eventObj.applyUrl.startsWith('https://'))) ? (eventObj.applyMethod || '온라인 링크') : '추후안내'}</span>
              </div>
            </div>
          </div>

          <div style="font-size:14px; color:#334155; line-height:1.6; margin-bottom:24px;">
            ${eventObj.description}
          </div>

          <!-- 하단 액션 버튼 바 -->
          <div style="display:flex; gap:10px; justify-content:flex-end; align-items:center; flex-wrap:wrap; border-top:1px solid #f1f5f9; padding-top:14px;">
            ${isAdmin ? `
              <button id="btn-modal-edit" class="btn-admin-action">
                행사 수정
              </button>
            ` : ''}
            <button id="btn-modal-review" class="btn-m3-outlined">후기 남기기</button>
          </div>
        </div>
      </div>
    `;

    // 닫기 이벤트
    const backdrop = modalMount.querySelector("#modal-backdrop");
    const closeBtn = modalMount.querySelector("#btn-modal-close");
    const reviewBtn = modalMount.querySelector("#btn-modal-review");
    const editBtn = modalMount.querySelector("#btn-modal-edit");

    const closeModal = () => {
      backdrop.classList.remove("open");
      setTimeout(() => { modalMount.innerHTML = ""; }, 200);
    };

    const dialog = modalMount.querySelector(".m3-modal-dialog");
    if (dialog) {
      dialog.addEventListener("click", (e) => e.stopPropagation());
    }

    const safeCloseModal = () => {
      backdrop.classList.remove("open");
      setTimeout(() => {
        if (modalMount.querySelector("#modal-backdrop") === backdrop) {
          modalMount.innerHTML = "";
        }
      }, 200);
    };

    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      safeCloseModal();
    });

    let isMouseDownOnBackdrop = false;
    backdrop.addEventListener("mousedown", (e) => {
      isMouseDownOnBackdrop = (e.target === backdrop);
    });
    backdrop.addEventListener("mouseup", (e) => {
      if (isMouseDownOnBackdrop && e.target === backdrop) {
        safeCloseModal();
      }
      isMouseDownOnBackdrop = false;
    });

    if (editBtn) {
      editBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        modalMount.innerHTML = "";
        openEventFormModal(eventObj, null, () => switchTab(activeTab));
      });
    }

    reviewBtn.addEventListener("click", () => {
      if (!isEventPastOrToday(eventObj)) {
        alert(`⚠️ [${eventObj.month}월 ${eventObj.day}일] 행사는 아직 진행 전입니다.\n후기 작성은 행사 진행 당일부터 가능합니다.`);
        return;
      }
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
      renderPrograms(tabContentMount, showEventModal);
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
    renderFooter(footerMount);
    switchTab(activeTab);
  });

  // 행사 데이터 갱신 리스너 (엑셀 업로드/초기화 시)
  window.addEventListener("events-updated", () => {
    switchTab(activeTab);
  });

  // 수업나눔방 데이터 갱신 리스너
  window.addEventListener("rooms-updated", () => {
    if (activeTab === "padlet") {
      renderPadletRooms(tabContentMount);
    }
  });

  // 초기 화면 렌더링 (첫 화면: 캘린더)
  switchTab("calendar");
});
