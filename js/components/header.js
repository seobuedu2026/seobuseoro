import { GoogleAuthService } from "../auth/googleAuth.js";
import { openAdminExcelModal } from "./adminExcelModal.js";

export function renderHeader(container) {
  const user = GoogleAuthService.getCurrentUser();
  const isAdmin = user && user.isAdmin;

  container.innerHTML = `
    <header class="hero-header">
      <div class="hero-header-inner">
        <!-- 상단 라인: 교육지원청 브랜딩 및 손글씨 슬로건 / 로그인 -->
        <div class="header-top-row">
          <div style="display:flex; align-items:center; gap:8px; font-size:13.5px; font-weight:800; color:#0e3753;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#008080" stroke-width="2.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            <span>서울특별시서부교육지원청</span>
          </div>

          <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
            <!-- 관리자 전용 엑셀 관리 버튼 -->
            ${isAdmin ? `
              <button id="btn-open-admin-excel" class="btn-m3-filled" style="background:linear-gradient(135deg, #0e3753 0%, #008080 100%); padding:7px 18px; font-size:13px; box-shadow:0 3px 10px rgba(0,128,128,0.3); font-weight:800;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
                ⚙️ 행사 관리 (엑셀 등록)
              </button>
            ` : ''}

            <!-- 사용자 인증 영역 -->
            <div id="user-auth-slot">
              ${user ? `
                <div style="display:flex; align-items:center; gap:8px; padding:4px 14px; background:#fff; border:1.5px solid #cbd5e1; border-radius:9999px; font-size:13px; font-weight:700;">
                  <span>
                    <strong>${user.name}</strong> 
                    ${user.isAdmin ? '<span style="color:#008080; font-weight:800;">[관리자]</span>' : (user.isSenedu ? '<span style="color:#0284c7;">(@senedu)</span>' : '')}
                  </span>
                  <button id="btn-logout" style="color:#64748b; font-size:11px; text-decoration:underline; cursor:pointer;">로그아웃</button>
                </div>
              ` : `
                <div style="display:flex; align-items:center; gap:6px;">
                  <button id="btn-login" class="header-login-btn">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.761H12.545z"/></svg>
                    Google 로그인
                  </button>
                  <button id="btn-admin-verify" title="관리자 인증" style="font-size:11.5px; color:#008080; font-weight:700; background:#e0f2f1; padding:5px 10px; border-radius:9999px; cursor:pointer;">
                    🔐 관리자 모드
                  </button>
                </div>
              `}
            </div>
          </div>
        </div>

        <!-- 메인 타이틀 (인쇄물 공식 그래픽 로고 적용) -->
        <div class="main-title-wrap">
          <img 
            src="assets/images/title-logo.png" 
            alt="2026학년도 2학기 서부서로 수업성장 캘린더 - 혼자가 아닌 함께 하는 서부, 서부가 서로에게 길(路)이 되어 줍니다." 
            class="header-official-logo-img" 
          />
        </div>
      </div>
    </header>
  `;

  // 이벤트 바인딩
  const btnLogin = container.querySelector("#btn-login");
  const btnLogout = container.querySelector("#btn-logout");
  const btnAdminVerify = container.querySelector("#btn-admin-verify");
  const btnAdminExcel = container.querySelector("#btn-open-admin-excel");

  if (btnLogin) {
    btnLogin.addEventListener("click", () => {
      GoogleAuthService.showLoginPrompt(() => {
        renderHeader(container);
      });
    });
  }

  if (btnLogout) {
    btnLogout.addEventListener("click", () => {
      GoogleAuthService.logout();
      renderHeader(container);
    });
  }

  if (btnAdminVerify) {
    btnAdminVerify.addEventListener("click", () => {
      openAdminAuthModal(() => {
        renderHeader(container);
      });
    });
  }

  if (btnAdminExcel) {
    btnAdminExcel.addEventListener("click", () => {
      openAdminExcelModal();
    });
  }
}

// 브라우저 팝업 차단 걱정 없는 깔끔한 M3 관리자 인증 모달
function openAdminAuthModal(onSuccess) {
  const mount = document.getElementById("modal-mount");
  mount.innerHTML = `
    <div class="m3-modal-backdrop open" id="admin-auth-backdrop">
      <div class="m3-modal-dialog" style="max-width: 440px;">
        <div class="modal-header">
          <h3 style="font-size: 18px; font-weight: 900; color: #0e3753;">
            🔐 관리자 인증
          </h3>
          <button class="modal-close-btn" id="btn-close-auth-modal" aria-label="닫기">✕</button>
        </div>

        <p style="font-size: 13.5px; color: #64748b; margin-bottom: 16px; line-height: 1.5;">
          행사 엑셀 업로드 및 일정 관리 권한을 활성화하려면 관리자 인증 코드(또는 비밀번호)를 입력하세요.
        </p>

        <form id="admin-auth-form">
          <div class="form-group" style="margin-bottom: 20px;">
            <label for="admin-code-input" style="font-weight: 800; font-size: 13px; color: #0e3753;">인증 코드</label>
            <input type="password" id="admin-code-input" class="m3-input" placeholder="기본 코드: seobu2026 또는 1234" autofocus required style="padding:12px; font-size:15px;" />
            <div style="font-size: 11px; color: #008080; margin-top: 4px; font-weight: 600;">
              * 기본 인증 코드: seobu2026 또는 1234
            </div>
          </div>

          <div style="display: flex; gap: 10px; justify-content: flex-end;">
            <button type="button" id="btn-cancel-auth" class="btn-m3-outlined">취소</button>
            <button type="submit" class="btn-m3-filled">관리자 인증하기</button>
          </div>
        </form>
      </div>
    </div>
  `;

  const backdrop = mount.querySelector("#admin-auth-backdrop");
  const closeBtn = mount.querySelector("#btn-close-auth-modal");
  const cancelBtn = mount.querySelector("#btn-cancel-auth");
  const form = mount.querySelector("#admin-auth-form");
  const input = mount.querySelector("#admin-code-input");

  const closeModal = () => {
    backdrop.classList.remove("open");
    setTimeout(() => { mount.innerHTML = ""; }, 200);
  };

  closeBtn.addEventListener("click", closeModal);
  cancelBtn.addEventListener("click", closeModal);
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) closeModal();
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const code = input.value.trim();
    if (GoogleAuthService.verifyAdminCode(code)) {
      alert("✅ 관리자 권한이 인증되었습니다!\n이제 상단의 [⚙️ 행사 관리 (엑셀 등록)] 버튼으로 엑셀을 업로드하실 수 있습니다.");
      closeModal();
      if (onSuccess) onSuccess();
    } else {
      alert("❌ 인증 코드가 일치하지 않습니다. (기본 코드: seobu2026 또는 1234)");
      input.focus();
    }
  });
}
