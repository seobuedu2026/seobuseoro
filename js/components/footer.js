import { GoogleAuthService, getPrimaryAdminEmail } from "../auth/googleAuth.js";
import { openAdminExcelModal } from "./adminExcelModal.js";
import { openAdminAccountModal } from "./adminAccountModal.js";

export function renderFooter(container) {
  const user = GoogleAuthService.getCurrentUser();
  const isAdmin = user && user.isAdmin;

  container.innerHTML = `
    <footer class="site-footer">
      <div class="site-footer-inner">
        <div class="footer-top-info">
          <div class="footer-org-name">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            <span>서울특별시서부교육지원청 초등교육지원과</span>
          </div>
          <p class="footer-notice-text">※ 세부 일정 및 장소는 학교 공문 및 신청 링크를 통해 확인하시기 바랍니다.</p>
        </div>

        <!-- 저작권 표시 (중앙 정렬) -->
        <div class="footer-copyright-center">
          <span class="footer-copy">© 2026 서울특별시서부교육지원청. All Rights Reserved.</span>
        </div>

        <!-- 하단 관리자 모드 영역 (중앙 정렬) -->
        <div class="footer-admin-row">
          <div class="footer-admin-actions">
            ${isAdmin ? `
              <button id="footer-btn-admin-excel" class="btn-footer-pill admin-active" title="행사 엑셀 파일 업로드/관리">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
                ⚙️ 행사 관리 (엑셀 등록)
              </button>
              <button id="footer-btn-admin-account" class="btn-footer-pill" style="background: #0e3753; color: #ffffff; font-weight: 800; border-color: #0e3753;" title="관리자 이메일 및 비밀번호(PW) 설정">
                🔑 계정/PW 설정
              </button>
              <button id="footer-btn-logout" class="footer-link-btn" style="margin-left: 6px;">[관리자 로그아웃]</button>
            ` : `
              <button id="footer-btn-admin-verify" class="btn-footer-pill admin-badge" title="관리자 로그인">
                🔐 관리자 모드
              </button>
            `}
          </div>
        </div>
      </div>
    </footer>
  `;

  // 이벤트 리스너 바인딩
  const btnLogout = container.querySelector("#footer-btn-logout");
  const btnAdminVerify = container.querySelector("#footer-btn-admin-verify");
  const btnAdminExcel = container.querySelector("#footer-btn-admin-excel");
  const btnAdminAccount = container.querySelector("#footer-btn-admin-account");

  if (btnLogout) {
    btnLogout.addEventListener("click", () => {
      GoogleAuthService.logout();
      renderFooter(container);
    });
  }

  if (btnAdminVerify) {
    btnAdminVerify.addEventListener("click", () => {
      openAdminAuthModal(() => {
        renderFooter(container);
      });
    });
  }

  if (btnAdminExcel) {
    btnAdminExcel.addEventListener("click", () => {
      openAdminExcelModal();
    });
  }

  if (btnAdminAccount) {
    btnAdminAccount.addEventListener("click", () => {
      openAdminAccountModal(() => {
        renderFooter(container);
      });
    });
  }
}

// 브라우저 팝업 차단 걱정 없는 깔끔한 M3 관리자 로그인 모달 (이메일 + PW)
export function openAdminAuthModal(onSuccess) {
  const mount = document.getElementById("modal-mount");
  const defaultEmail = getPrimaryAdminEmail();

  mount.innerHTML = `
    <div class="m3-modal-backdrop open" id="admin-auth-backdrop">
      <div class="m3-modal-dialog" style="max-width: 440px;">
        <div class="modal-header">
          <h3 style="font-size: 18px; font-weight: 900; color: #0e3753;">
            🔐 관리자 로그인
          </h3>
          <button class="modal-close-btn" id="btn-close-auth-modal" aria-label="닫기">✕</button>
        </div>

        <p style="font-size: 13.5px; color: #64748b; margin-bottom: 16px; line-height: 1.5;">
          행사 관리 및 후기 승인 권한을 활성화하려면 관리자 계정 정보를 입력하세요.
        </p>

        <form id="admin-auth-form">
          <div class="form-group" style="margin-bottom: 14px;">
            <label for="admin-email-input" style="font-weight: 800; font-size: 13px; color: #0e3753;">관리자 이메일</label>
            <input type="email" id="admin-email-input" class="m3-input" placeholder="seobuedu2026@gmail.com" value="${defaultEmail}" required style="padding:11px 12px; font-size:14.5px;" />
          </div>

          <div class="form-group" style="margin-bottom: 20px;">
            <label for="admin-pw-input" style="font-weight: 800; font-size: 13px; color: #0e3753;">비밀번호 (PW)</label>
            <input type="password" id="admin-pw-input" class="m3-input" placeholder="비밀번호를 입력하세요" autofocus required style="padding:11px 12px; font-size:14.5px;" />
          </div>

          <div style="display: flex; gap: 10px; justify-content: flex-end;">
            <button type="button" id="btn-cancel-auth" class="btn-m3-outlined">취소</button>
            <button type="submit" class="btn-m3-filled">관리자 로그인</button>
          </div>
        </form>
      </div>
    </div>
  `;

  const backdrop = mount.querySelector("#admin-auth-backdrop");
  const closeBtn = mount.querySelector("#btn-close-auth-modal");
  const cancelBtn = mount.querySelector("#btn-cancel-auth");
  const form = mount.querySelector("#admin-auth-form");
  const emailInput = mount.querySelector("#admin-email-input");
  const pwInput = mount.querySelector("#admin-pw-input");

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
    const email = emailInput.value.trim();
    const pw = pwInput.value.trim();

    const res = GoogleAuthService.verifyAdminCredentials(email, pw);
    if (res.success) {
      alert("✅ 관리자 권한으로 로그인되었습니다!\n행사 관리 및 후기 승인 기능을 이용하실 수 있습니다.");
      closeModal();
      if (onSuccess) onSuccess();
    } else {
      alert(`❌ ${res.message || '관리자 인증 정보가 일치하지 않습니다.'}`);
      pwInput.focus();
    }
  });
}
