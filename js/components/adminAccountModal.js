import { getPrimaryAdminEmail, getAdminPassword, updateAdminCredentials, GoogleAuthService } from "../auth/googleAuth.js";

/**
 * 관리자 계정 이메일 및 비밀번호(PW) 변경/설정 모달
 * @param {Function} onSaved 저장 후 콜백
 */
export function openAdminAccountModal(onSaved) {
  const mount = document.getElementById("modal-mount");
  if (!mount) return;

  const currentEmail = getPrimaryAdminEmail();

  mount.innerHTML = `
    <div class="m3-modal-backdrop open" id="admin-account-backdrop">
      <div class="m3-modal-dialog" style="max-width: 440px;">
        <div class="modal-header">
          <h3 style="font-size: 19px; font-weight: 900; color: #0e3753; display: flex; align-items: center; gap: 8px;">
            <span>🔑 관리자 계정 및 비밀번호 설정</span>
            <span style="font-size: 11px; font-weight: 800; background: #0e3753; color: #ffffff; padding: 2px 8px; border-radius: 9999px;">
              관리자
            </span>
          </h3>
          <button class="modal-close-btn" id="btn-close-account-modal" aria-label="닫기">✕</button>
        </div>

        <p style="font-size: 13.5px; color: #64748b; margin-bottom: 18px; line-height: 1.5;">
          관리자 로그인에 사용할 이메일과 접속 비밀번호(PW)를 설정 및 변경할 수 있습니다.
        </p>

        <form id="admin-account-form">
          <div class="form-group" style="margin-bottom: 14px;">
            <label for="acc-email-input" style="font-weight: 800; font-size: 13px; color: #0e3753;">
              관리자 이메일 주소
            </label>
            <input type="email" id="acc-email-input" class="m3-input" value="${currentEmail}" placeholder="seobuedu2026@gmail.com" required style="padding: 10px 12px; font-size: 14.5px;" />
            <span style="font-size: 11.5px; color: #64748b; margin-top: 4px; display: block;">
              * 로그인 시 사용할 관리자 공식 이메일입니다.
            </span>
          </div>

          <div class="form-group" style="margin-bottom: 14px;">
            <label for="acc-current-pw-input" style="font-weight: 800; font-size: 13px; color: #0e3753;">
              현재 비밀번호 (PW) *
            </label>
            <input type="password" id="acc-current-pw-input" class="m3-input" placeholder="현재 비밀번호를 입력하세요" required style="padding: 10px 12px; font-size: 14.5px;" />
          </div>

          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; margin-bottom: 20px;">
            <div style="font-weight: 800; font-size: 13px; color: #0e3753; margin-bottom: 10px;">
              🔒 비밀번호 변경 (변경할 경우에만 입력)
            </div>

            <div class="form-group" style="margin-bottom: 10px;">
              <label for="acc-new-pw-input" style="font-weight: 700; font-size: 12.5px; color: #475569;">
                새 비밀번호
              </label>
              <input type="password" id="acc-new-pw-input" class="m3-input" placeholder="새 비밀번호 입력 (4자 이상 권장)" style="padding: 9px 12px; font-size: 14px;" />
            </div>

            <div class="form-group" style="margin-bottom: 0;">
              <label for="acc-confirm-pw-input" style="font-weight: 700; font-size: 12.5px; color: #475569;">
                새 비밀번호 확인
              </label>
              <input type="password" id="acc-confirm-pw-input" class="m3-input" placeholder="새 비밀번호 다시 입력" style="padding: 9px 12px; font-size: 14px;" />
            </div>
          </div>

          <div style="display: flex; gap: 8px; justify-content: flex-end;">
            <button type="button" id="btn-cancel-account" class="btn-m3-outlined">취소</button>
            <button type="submit" class="btn-m3-filled">💾 설정 저장</button>
          </div>
        </form>
      </div>
    </div>
  `;

  const backdrop = mount.querySelector("#admin-account-backdrop");
  const closeBtn = mount.querySelector("#btn-close-account-modal");
  const cancelBtn = mount.querySelector("#btn-cancel-account");
  const form = mount.querySelector("#admin-account-form");
  const emailInput = mount.querySelector("#acc-email-input");
  const currentPwInput = mount.querySelector("#acc-current-pw-input");
  const newPwInput = mount.querySelector("#acc-new-pw-input");
  const confirmPwInput = mount.querySelector("#acc-confirm-pw-input");

  const closeModal = () => {
    backdrop.classList.remove("open");
    setTimeout(() => {
      if (mount.querySelector("#admin-account-backdrop") === backdrop) {
        mount.innerHTML = "";
      }
    }, 200);
  };

  closeBtn.addEventListener("click", (e) => { e.stopPropagation(); closeModal(); });
  cancelBtn.addEventListener("click", (e) => { e.stopPropagation(); closeModal(); });

  let isMouseDown = false;
  backdrop.addEventListener("mousedown", (e) => {
    isMouseDown = (e.target === backdrop);
  });
  backdrop.addEventListener("mouseup", (e) => {
    if (isMouseDown && e.target === backdrop) {
      closeModal();
    }
    isMouseDown = false;
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const newEmail = emailInput.value.trim();
    const currentPw = currentPwInput.value.trim();
    const newPw = newPwInput.value.trim();
    const confirmPw = confirmPwInput.value.trim();

    const storedPw = getAdminPassword();
    const defaultPws = ["qwer1234", "seobuedu2026@gmail.com"];

    // 현재 비밀번호 검증
    if (currentPw !== storedPw && !defaultPws.includes(currentPw)) {
      alert("❌ 현재 비밀번호가 일치하지 않습니다.");
      currentPwInput.focus();
      return;
    }

    // 새 비밀번호 일치 검증
    if (newPw) {
      if (newPw.length < 4) {
        alert("⚠️ 새 비밀번호는 최소 4자 이상으로 설정해주세요.");
        newPwInput.focus();
        return;
      }
      if (newPw !== confirmPw) {
        alert("❌ 새 비밀번호가 서로 일치하지 않습니다. 다시 확인해주세요.");
        confirmPwInput.focus();
        return;
      }
    }

    // 변경 사항 적용
    updateAdminCredentials(newEmail, newPw || null);

    alert("✅ 관리자 계정 정보 및 비밀번호가 성공적으로 저장되었습니다!");
    closeModal();
    if (onSaved) onSaved();
  });
}
