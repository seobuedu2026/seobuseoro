import { GoogleAuthService } from "../auth/googleAuth.js";
import { getCustomHeaderImage, openHeaderImageModal } from "./headerImageModal.js";
import { openAdminPopupModal } from "./adminPopupModal.js";
import { checkAndOpenNoticePopup, openNoticePopupModal } from "./noticePopupModal.js";
import { getPopupNoticeConfig } from "../data/popupNotice.js";

export function renderHeader(container) {
  const user = GoogleAuthService.getCurrentUser();
  const isAdmin = !!(user && user.isAdmin);
  const headerImg = getCustomHeaderImage();
  const popupConfig = getPopupNoticeConfig();

  container.innerHTML = `
    <header class="hero-header">
      <div class="hero-header-inner" style="position: relative;">
        <div style="position: absolute; top: 10px; left: 10px; z-index: 10; display: flex; align-items: center; gap: 8px;">
          <button type="button" id="btn-home-pill" class="header-home-pill" title="첫 화면으로 이동">
            <span aria-hidden="true">🏠</span> 홈
          </button>
          ${popupConfig.enabled ? `
            <button type="button" id="btn-open-notice-popup" class="header-home-pill" style="background: rgba(255,255,255,0.95); color: #e11d48; border-color: #fecdd3; box-shadow: 0 2px 8px rgba(225,29,72,0.15);" title="주요 공지 및 일정 변경 안내 팝업 열기">
              <span aria-hidden="true">📢</span> 주요 공지
            </button>
          ` : ''}
        </div>

        ${isAdmin ? `
          <div class="header-admin-action-bar" style="position: absolute; top: 10px; right: 10px; z-index: 10; display: flex; gap: 6px; flex-wrap: wrap;">
            <button id="btn-admin-popup-setting" class="btn-admin-action" style="box-shadow: 0 2px 10px rgba(0,0,0,0.12); background: #f0fdfa; color: #0f766e; border-color: #99f6e4;" title="팝업 공지(일정 변경/모집 안내) 설정">
              📢 팝업 공지 설정
            </button>
            <button id="btn-change-header-img" class="btn-admin-action" style="box-shadow: 0 2px 10px rgba(0,0,0,0.12);" title="상단 타이틀 배너 이미지 변경">
              타이틀 이미지 변경
            </button>
          </div>
        ` : ''}

        <!-- 메인 타이틀 배너 영역 (클릭 시 첫 화면으로 이동) -->
        <div class="main-title-wrap">
          <button type="button" id="btn-go-home" class="header-home-link" title="첫 화면(캘린더)으로 이동" aria-label="첫 화면으로 이동">
            <img
              src="${headerImg}"
              alt="2026학년도 2학기 서부서로 수업성장 캘린더 - 혼자가 아닌 함께 하는 서부, 서부가 서로에게 길(路)이 되어 줍니다."
              class="header-official-logo-img"
              width="980"
              height="140"
              decoding="async"
              fetchpriority="high"
            />
          </button>
        </div>
      </div>
    </header>
  `;

  // 배너 및 홈 버튼 클릭 시 첫 화면(캘린더)으로 이동
  const goHome = () => {
    window.dispatchEvent(new CustomEvent("navigate-tab", { detail: { tab: "calendar" } }));
  };
  container.querySelectorAll("#btn-go-home, #btn-home-pill").forEach(btn => {
    btn.addEventListener("click", goHome);
  });

  // 주요 공지 팝업 열기 버튼
  const btnOpenNotice = container.querySelector("#btn-open-notice-popup");
  if (btnOpenNotice) {
    btnOpenNotice.addEventListener("click", () => {
      openNoticePopupModal();
    });
  }

  // 관리자 팝업 공지 설정 버튼
  const btnAdminPopup = container.querySelector("#btn-admin-popup-setting");
  if (btnAdminPopup) {
    btnAdminPopup.addEventListener("click", () => {
      openAdminPopupModal(() => {
        renderHeader(container);
      });
    });
  }

  // 관리자 모드 이미지 변경 버튼 이벤트 바인딩
  const btnChange = container.querySelector("#btn-change-header-img");
  if (btnChange) {
    btnChange.addEventListener("click", () => {
      openHeaderImageModal(() => {
        renderHeader(container);
      });
    });
  }
}
