/**
 * 2026학년도 2학기 서부서로 수업성장 캘린더 공지 팝업 모달
 * - 인쇄물 일정 변경 내용 및 현재 모집 중인 연수/워크숍 안내
 * - 오늘 하루 보지 않기(쿠키/localStorage) 지원
 * - 관리자 모드에서 즉시 팝업 설정 열기 지원
 */
import { getPopupNoticeConfig, isPopupHiddenToday, setPopupHideToday } from "../data/popupNotice.js";
import { GoogleAuthService } from "../auth/googleAuth.js";
import { openAdminPopupModal } from "./adminPopupModal.js";

export function checkAndOpenNoticePopup(forceOpen = false) {
  const config = getPopupNoticeConfig();
  
  // 팝업이 비활성화되어 있고 강제 오픈이 아니면 열지 않음
  if (!config.enabled && !forceOpen) return;

  // 오늘 하루 보지 않기가 설정되어 있고 강제 오픈이 아니면 열지 않음
  if (!forceOpen && isPopupHiddenToday()) return;

  openNoticePopupModal(config);
}

export function openNoticePopupModal(config = null) {
  if (!config) {
    config = getPopupNoticeConfig();
  }

  // 모달 마운트 엘리먼트
  let popupMount = document.getElementById("popup-notice-mount");
  if (!popupMount) {
    popupMount = document.createElement("div");
    popupMount.id = "popup-notice-mount";
    document.body.appendChild(popupMount);
  }

  const user = GoogleAuthService.getCurrentUser();
  const isAdmin = !!(user && user.isAdmin);

  const scheduleSec = config.scheduleChangeSection || { enabled: false, items: [] };
  const recruitSec = config.recruitingSection || { enabled: false, items: [] };

  popupMount.innerHTML = `
    <div class="m3-modal-backdrop open notice-popup-backdrop" id="notice-popup-backdrop" role="dialog" aria-modal="true" aria-labelledby="notice-popup-title">
      <div class="m3-modal-dialog notice-popup-dialog">
        
        <!-- 팝업 헤더 바 -->
        <div class="notice-popup-header">
          <div class="notice-header-badge-wrap">
            <span class="notice-main-badge">${config.badge || "중요 공지"}</span>
            <span class="notice-sub-tag">2026 서부서로 캘린더</span>
          </div>
          <div class="notice-header-actions">
            ${isAdmin ? `
              <button type="button" id="btn-notice-edit-admin" class="btn-notice-admin-edit" title="관리자 팝업 공지 내용 및 노출 설정">
                ⚙️ 팝업 설정
              </button>
            ` : ''}
            <button type="button" class="notice-close-btn" id="btn-notice-popup-close" aria-label="팝업 닫기">✕</button>
          </div>
        </div>

        <!-- 팝업 제목 및 소개 문구 -->
        <div class="notice-title-area">
          <h2 id="notice-popup-title" class="notice-title-heading">
            ${config.title || "2026학년도 2학기 서부서로 수업성장 안내"}
          </h2>
          ${config.subtitle ? `<p class="notice-subtitle-desc">${config.subtitle}</p>` : ''}
        </div>

        <!-- 팝업 스크롤 본문 영역 -->
        <div class="notice-body-scrollable">

          <!-- 1. 인쇄물 일정 변경 안내 섹션 -->
          ${scheduleSec.enabled && scheduleSec.items && scheduleSec.items.length > 0 ? `
            <section class="notice-section change-section">
              <div class="notice-section-header">
                <span class="section-badge badge-warning">${scheduleSec.badge || "일정 변경 안내"}</span>
                <h3 class="section-title">${scheduleSec.title || "인쇄물 대비 일정 변경 사항"}</h3>
              </div>
              ${scheduleSec.description ? `<p class="section-intro">${scheduleSec.description}</p>` : ''}
              
              <div class="change-items-list">
                ${scheduleSec.items.map((item, idx) => `
                  <div class="change-item-card">
                    <div class="change-item-top">
                      <strong class="change-item-name">${item.title}</strong>
                      ${item.note ? `<span class="change-item-pill">${item.note}</span>` : ''}
                    </div>
                    <div class="change-diff-box">
                      ${item.original ? `
                        <div class="diff-row diff-before">
                          <span class="diff-tag">기존</span>
                          <span class="diff-val">${item.original}</span>
                        </div>
                      ` : ''}
                      ${item.updated ? `
                        <div class="diff-row diff-after">
                          <span class="diff-tag">변경</span>
                          <span class="diff-val">${item.updated}</span>
                        </div>
                      ` : ''}
                    </div>
                  </div>
                `).join('')}
              </div>
            </section>
          ` : ''}

          <!-- 2. 현재 모집 중인 연수·워크숍 안내 섹션 -->
          ${recruitSec.enabled && recruitSec.items && recruitSec.items.length > 0 ? `
            <section class="notice-section recruit-section">
              <div class="notice-section-header">
                <span class="section-badge badge-primary">${recruitSec.badge || "모집 중"}</span>
                <h3 class="section-title">${recruitSec.title || "현재 신청 접수 중인 연수 & 워크숍"}</h3>
              </div>
              ${recruitSec.description ? `<p class="section-intro">${recruitSec.description}</p>` : ''}

              <div class="recruit-cards-list">
                ${recruitSec.items.map(item => `
                  <div class="recruit-card">
                    <div class="recruit-card-content">
                      <div class="recruit-card-header">
                        <span class="recruit-status-pill">${item.status || "신청접수"}</span>
                        <h4 class="recruit-card-name">${item.name}</h4>
                      </div>
                      <div class="recruit-card-meta">
                        ${item.date ? `
                          <div class="meta-row">
                            <span class="meta-icon">📅</span>
                            <span class="meta-text">${item.date}</span>
                          </div>
                        ` : ''}
                        ${item.location ? `
                          <div class="meta-row">
                            <span class="meta-icon">📍</span>
                            <span class="meta-text">${item.location}</span>
                          </div>
                        ` : ''}
                        ${item.target ? `
                          <div class="meta-row">
                            <span class="meta-icon">👥</span>
                            <span class="meta-text">${item.target}</span>
                          </div>
                        ` : ''}
                      </div>
                    </div>
                    ${item.link ? `
                      <div class="recruit-card-action">
                        <a href="${item.link}" target="_blank" rel="noopener noreferrer" class="btn-recruit-apply">
                          <span>신청하기</span>
                          <span aria-hidden="true">↗</span>
                        </a>
                      </div>
                    ` : ''}
                  </div>
                `).join('')}
              </div>
            </section>
          ` : ''}

          <!-- 하단 안내 문구 -->
          ${config.footerNotice ? `
            <div class="notice-footer-info-box">
              <span class="footer-info-icon">💡</span>
              <p class="footer-info-text">${config.footerNotice}</p>
            </div>
          ` : ''}

        </div>

        <!-- 팝업 하단 액션 & 오늘 하루 보지 않기 바 -->
        <div class="notice-popup-footer">
          <label class="notice-hide-today-label" for="chk-notice-hide-today">
            <input type="checkbox" id="chk-notice-hide-today" class="notice-checkbox" />
            <span>오늘 하루 동안 열지 않기</span>
          </label>

          <div class="notice-footer-btns">
            ${config.primaryButtonText ? `
              <button type="button" id="btn-notice-primary" class="btn-notice-main-action">
                ${config.primaryButtonText}
              </button>
            ` : ''}
            <button type="button" id="btn-notice-dismiss" class="btn-notice-close-action">
              닫기
            </button>
          </div>
        </div>

      </div>
    </div>
  `;

  const backdrop = popupMount.querySelector("#notice-popup-backdrop");
  const closeBtn = popupMount.querySelector("#btn-notice-popup-close");
  const dismissBtn = popupMount.querySelector("#btn-notice-dismiss");
  const primaryBtn = popupMount.querySelector("#btn-notice-primary");
  const chkHideToday = popupMount.querySelector("#chk-notice-hide-today");
  const btnAdminEdit = popupMount.querySelector("#btn-notice-edit-admin");

  const closePopup = () => {
    if (chkHideToday && chkHideToday.checked) {
      setPopupHideToday();
    }
    backdrop.classList.remove("open");
    setTimeout(() => {
      popupMount.innerHTML = "";
    }, 250);
  };

  if (closeBtn) closeBtn.addEventListener("click", closePopup);
  if (dismissBtn) dismissBtn.addEventListener("click", closePopup);

  if (primaryBtn) {
    primaryBtn.addEventListener("click", () => {
      closePopup();
      const targetTab = config.primaryButtonTab || "programs";
      window.dispatchEvent(new CustomEvent("navigate-tab", { detail: { tab: targetTab } }));
    });
  }

  // 백드롭 클릭 닫기
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) {
      closePopup();
    }
  });

  // 관리자 모드 팝업 편집 버튼
  if (btnAdminEdit) {
    btnAdminEdit.addEventListener("click", () => {
      closePopup();
      openAdminPopupModal(() => {
        // 편집 완료 후 재열기
        openNoticePopupModal();
      });
    });
  }
}
