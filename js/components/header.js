import { GoogleAuthService } from "../auth/googleAuth.js";
import { getCustomHeaderImage, openHeaderImageModal } from "./headerImageModal.js";

export function renderHeader(container) {
  const user = GoogleAuthService.getCurrentUser();
  const isAdmin = !!(user && user.isAdmin);
  const headerImg = getCustomHeaderImage();

  container.innerHTML = `
    <header class="hero-header">
      <div class="hero-header-inner" style="position: relative;">
        ${isAdmin ? `
          <div class="header-admin-action-bar" style="position: absolute; top: 10px; right: 10px; z-index: 10;">
            <button id="btn-change-header-img" class="btn-m3-pill-action" style="font-size: 12px; padding: 6px 14px; box-shadow: 0 2px 10px rgba(0,0,0,0.12);" title="상단 타이틀 배너 이미지 변경">
              <span>🖼️ 타이틀 이미지 변경</span>
            </button>
          </div>
        ` : ''}

        <!-- 메인 타이틀 배너 영역 -->
        <div class="main-title-wrap">
          <img 
            src="${headerImg}" 
            alt="2026학년도 2학기 서부서로 수업성장 캘린더 - 혼자가 아닌 함께 하는 서부, 서부가 서로에게 길(路)이 되어 줍니다." 
            class="header-official-logo-img" 
          />
        </div>
      </div>
    </header>
  `;

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
