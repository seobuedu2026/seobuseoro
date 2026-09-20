import { GoogleAuthService, getPrimaryAdminEmail } from "../auth/googleAuth.js";
import { openAdminAccountModal } from "./adminAccountModal.js";

export function renderFooter(container) {
  const user = GoogleAuthService.getCurrentUser();
  const isAdmin = user && user.isAdmin;

  container.innerHTML = `
    <footer class="site-footer">
      <div class="site-footer-inner">
        <div class="footer-top-info">
          <div class="footer-org-name">
            서울특별시서부교육지원청 초등교육지원과
          </div>
          <p class="footer-notice-text">※ 세부 일정 및 장소는 학교 공문 및 신청 링크를 통해 확인하시기 바랍니다.</p>
        </div>

        <!-- 하단 영역 (저작권 문구 가운데 정렬, 관리자 버튼 우측 정렬) -->
        <div class="footer-bottom-bar">
          <div class="footer-copy">
            © 2026 서울특별시서부교육지원청. All Rights Reserved.
          </div>
          <div class="footer-admin-actions">
            ${isAdmin ? `
              <button id="footer-btn-admin-account" class="btn-admin-action" title="관리자 ID 현황 조회, 추가/삭제 및 비밀번호(PW) 설정">
                관리자 계정 관리
              </button>
              <button id="footer-btn-logout" class="btn-admin-action danger" title="관리자 모드 로그아웃">
                로그아웃
              </button>
            ` : `
              <button id="footer-btn-admin-verify" class="btn-admin-action" title="관리자 로그인">
                관리자 로그인
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
  const btnAdminAccount = container.querySelector("#footer-btn-admin-account");

  if (btnLogout) {
    btnLogout.addEventListener("click", () => {
      GoogleAuthService.logout();
      alert("✅ 관리자 로그아웃 되었습니다.");
    });
  }

  if (btnAdminVerify) {
    btnAdminVerify.addEventListener("click", () => {
      openAdminAuthModal(() => {
        renderFooter(container);
        window.dispatchEvent(new CustomEvent("auth-state-changed"));
      });
    });
  }

  if (btnAdminAccount) {
    btnAdminAccount.addEventListener("click", () => {
      openAdminAccountModal(() => {
        renderFooter(container);
        window.dispatchEvent(new CustomEvent("auth-state-changed"));
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
            관리자 로그인
          </h3>
          <button class="modal-close-btn" id="btn-close-auth-modal" aria-label="닫기">✕</button>
        </div>

        <form id="admin-auth-form" style="margin-top: 6px;">
          <div class="form-group" style="margin-bottom: 14px;">
            <label for="admin-email-input" style="font-weight: 800; font-size: 14px; color: #0e3753;">관리자 이메일</label>
            <input type="email" id="admin-email-input" class="m3-input" placeholder="관리자 이메일을 입력하세요" value="" autofocus required autocomplete="off" style="padding:11px 12px; font-size:15px;" />
          </div>

          <div class="form-group" style="margin-bottom: 20px;">
            <label for="admin-pw-input" style="font-weight: 800; font-size: 14px; color: #0e3753;">비밀번호 (PW)</label>
            <input type="password" id="admin-pw-input" class="m3-input" placeholder="비밀번호를 입력하세요" required autocomplete="current-password" style="padding:11px 12px; font-size:15px;" />
          </div>

          <div style="display: flex; gap: 8px; justify-content: flex-end;">
            <button type="button" id="btn-cancel-auth" class="btn-admin-action">취소</button>
            <button type="submit" class="btn-admin-action filled">관리자 로그인</button>
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
