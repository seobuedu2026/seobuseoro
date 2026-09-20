import { renderHeader } from "./components/header.js?v=20260920_v69";
import { renderFooter } from "./components/footer.js?v=20260920_v69";
import { renderCalendar } from "./components/calendar.js?v=20260920_v69";
import { renderPrograms } from "./components/programs.js?v=20260920_v69";
import { renderReviews } from "./components/reviews.js?v=20260920_v69";
import { renderPadletRooms } from "./components/padletRooms.js?v=20260920_v69";
import { openEventFormModal } from "./components/eventFormModal.js?v=20260920_v69";
import { GoogleAuthService } from "./auth/googleAuth.js?v=20260920_v69";
import { isEventPastOrToday, resolveApplyLink } from "./data/events.js?v=20260920_v69";
import { initSiteSync } from "./data/siteSync.js";
import { openPrivacyConsentModal } from "./components/privacyConsentModal.js";
import { hasConsented } from "./data/consent.js";

let activeTab = "calendar"; // 'calendar' | 'programs' | 'reviews' | 'padlet'

function initApp() {
  const headerMount = document.getElementById("header-mount");
  const footerMount = document.getElementById("footer-mount");
  const tabContentMount = document.getElementById("tab-content-mount");
  const modalMount = document.getElementById("modal-mount");
  const navTabs = document.querySelectorAll(".nav-tab-item");

  if (!tabContentMount) {
    console.warn("DOM elements not ready yet, retrying...");
    return;
  }

  // 관리자 수정 콘텐츠 클라우드 동기화 시작
  initSiteSync();

  // 센스쿨 계정으로 로그인한 경우 개인정보 수집·이용 동의 여부를 확인한다.
  // (관리자 비밀번호 모드는 실제 개인정보를 수집하지 않으므로 제외)
  let consentPromptOpen = false;
  function ensurePrivacyConsent() {
    if (consentPromptOpen) return;
    if (GoogleAuthService.isAdminModeActive()) return;

    const currentUser = GoogleAuthService.getCurrentUser();
    if (!currentUser || !currentUser.email) return;
    if (hasConsented(currentUser.email)) return;

    consentPromptOpen = true;
    openPrivacyConsentModal({
      email: currentUser.email,
      onAgree: () => {
        consentPromptOpen = false;
        switchTab(activeTab);
      },
      onDecline: () => {
        consentPromptOpen = false;
        GoogleAuthService.logout();
        alert("개인정보 수집·이용에 동의하지 않아 로그아웃되었습니다.\n후기 작성 등 기능은 동의 후 이용하실 수 있습니다.");
      }
    });
  }

  // 헤더 및 푸터 렌더링
  renderHeader(headerMount);
  renderFooter(footerMount);

  // 모달 팝업 열기 함수
  function showEventModal(eventObj) {
    const user = GoogleAuthService.getCurrentUser();
    const isAdmin = !!(user && user.isAdmin);
    const isPast = isEventPastOrToday(eventObj);

    modalMount.innerHTML = `
      <div class="m3-modal-backdrop open" id="modal-backdrop">
        <div class="m3-modal-dialog">
          <div class="modal-header">
            <div style="display:flex; align-items:center; gap:8px;">
              <span class="prog-category-badge ${eventObj.categoryClass}">
                ${eventObj.categoryLabel}
              </span>
            </div>
            <button class="modal-close-btn" id="btn-modal-close" aria-label="닫기">✕</button>
          </div>

          <!-- 제목 및 부제목 영역 -->
          <div class="modal-title-text-wrap" style="margin-bottom: 14px;">
            <h2 style="font-size:22px; font-weight:900; color:#0e3753; margin-bottom:4px; line-height:1.3; margin-top:0;">
              ${eventObj.title}
            </h2>
            ${eventObj.subtitle ? `<div style="font-size:15px; font-weight:600; color:#475569;">${eventObj.subtitle}</div>` : ''}
          </div>

          <div style="background-color:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:16px; margin-bottom:16px;">
            <div class="prog-info-list">
              <div class="prog-info-item">
                <span class="prog-info-label">일시</span>
                <span class="prog-datetime-val">
                  <span class="prog-date-text">${eventObj.year || 2026}년 ${eventObj.month}월 ${eventObj.day}일</span>
                  <span class="prog-time-text">${eventObj.time}</span>
                </span>
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
                <span style="font-weight:700;">
                  ${(() => {
                    const apply = resolveApplyLink(eventObj);
                    return apply.href
                      ? `<a href="${apply.href}" target="_blank" rel="noopener noreferrer" style="color:#0284c7; text-decoration:underline; font-weight:800; display:inline-flex; align-items:center; gap:4px;" title="신청 페이지로 이동">${apply.label} ↗</a>`
                      : apply.label;
                  })()}
                </span>
              </div>
            </div>
          </div>

          <div style="font-size:16px; color:#334155; line-height:1.65; margin-bottom:16px;">
            ${eventObj.description}
          </div>

          ${isAdmin ? `
            <!-- 하단 액션 버튼 바 -->
            <div style="display:flex; gap:10px; justify-content:flex-end; align-items:center; flex-wrap:wrap; border-top:1px solid #f1f5f9; padding-top:14px;">
              <button id="btn-modal-edit" class="btn-admin-action">
                행사 수정
              </button>
            </div>
          ` : ''}
        </div>
      </div>
    `;

    // 닫기 이벤트
    const backdrop = modalMount.querySelector("#modal-backdrop");
    const closeBtn = modalMount.querySelector("#btn-modal-close");
    const editBtn = modalMount.querySelector("#btn-modal-edit");
    const reviewActionBtn = modalMount.querySelector("#btn-modal-review-action");

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

    if (reviewActionBtn) {
      reviewActionBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        closeModal();
        switchTab("reviews", eventObj.id);
      });
    }
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
    ensurePrivacyConsent();
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

  // 참여 이야기 갱신 리스너
  window.addEventListener("stories-updated", () => {
    if (activeTab === "reviews") {
      switchTab("reviews");
    }
  });

  // 초기 화면 렌더링 (첫 화면: 캘린더)
  switchTab("calendar");

  // 이미 로그인된 상태에서 동의 기록이 없으면 다시 안내한다
  ensurePrivacyConsent();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}
