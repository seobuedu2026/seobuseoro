// 개인정보 수집·이용 동의 팝업
import { saveConsent, PRIVACY_POLICY_VERSION } from "../data/consent.js";
import { GoogleAuthService } from "../auth/googleAuth.js";

// 수집 항목 안내 (구글 로그인으로 전달받는 정보)
const COLLECT_ITEMS = [
  { label: "이메일 주소", detail: "센스쿨 계정(@senedu.kr)", purpose: "교원 본인 확인" },
  { label: "이름", detail: "구글 계정에 등록된 이름", purpose: "후기 작성자 표시" },
  { label: "프로필 사진", detail: "구글 계정 프로필 이미지", purpose: "작성자 표시(선택)" }
];

/**
 * 개인정보 동의 팝업 열기
 * @param {Object} options
 *   - email: 동의 주체 계정
 *   - onAgree: 동의 완료 후 콜백
 *   - onDecline: 동의 거부 시 콜백 (미지정 시 로그아웃)
 *   - reason: 팝업이 뜬 이유 안내 문구 (예: 후기 작성 시도)
 */
export function openPrivacyConsentModal({ email, onAgree, onDecline, reason = "" } = {}) {
  const mount = document.getElementById("modal-mount");
  if (!mount) return;

  const safeEmail = String(email || "").trim();

  mount.innerHTML = `
    <div class="m3-modal-backdrop open" id="consent-backdrop">
      <div class="m3-modal-dialog pcm-dialog" role="dialog" aria-modal="true" aria-labelledby="pcm-title">
        <div class="pcm-head">
          <p class="pcm-eyebrow">개인정보 수집·이용 동의</p>
          <h3 class="pcm-title" id="pcm-title">서비스 이용을 위해 동의가 필요합니다</h3>
          <p class="pcm-account">${safeEmail ? `로그인 계정 · <strong>${escapeHtml(safeEmail)}</strong>` : ""}</p>
        </div>

        <div class="pcm-body">
          ${reason ? `<div class="pcm-notice">${escapeHtml(reason)}</div>` : ""}

          <p class="pcm-lead">
            서울특별시서부교육지원청은 「개인정보 보호법」 제15조 및 제22조에 따라
            아래와 같이 개인정보를 수집·이용합니다. 내용을 확인하신 후 동의해 주세요.
          </p>

          <div class="pcm-table-wrap">
            <table class="pcm-table">
              <thead>
                <tr><th>수집 항목</th><th>수집 내용</th><th>이용 목적</th></tr>
              </thead>
              <tbody>
                ${COLLECT_ITEMS.map(i => `
                  <tr>
                    <td><strong>${i.label}</strong></td>
                    <td>${i.detail}</td>
                    <td>${i.purpose}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>

          <ul class="pcm-points">
            <li><strong>보유·이용 기간</strong> — 동의 철회 시 또는 작성하신 후기 삭제 시까지 보관하며, 기간 경과 후 지체 없이 파기합니다.</li>
            <li><strong>제3자 제공</strong> — 수집한 정보를 외부에 제공하지 않습니다. 다만 서비스 운영을 위해 Google Firebase(클라우드 저장)를 이용합니다.</li>
            <li><strong>동의 거부 권리</strong> — 동의를 거부하실 수 있습니다. 다만 이 경우 참여후기 작성 등 로그인이 필요한 기능은 이용하실 수 없습니다.</li>
          </ul>

          <details class="pcm-details">
            <summary>개인정보처리방침 전문 보기</summary>
            <div class="pcm-policy">
              <h4>1. 개인정보의 처리 목적</h4>
              <p>본 누리집은 교원 대상 연수·협의회 안내 및 참여후기 수집을 위하여 개인정보를 처리합니다. 처리한 개인정보는 명시한 목적 외의 용도로는 이용하지 않습니다.</p>

              <h4>2. 처리하는 개인정보 항목</h4>
              <p>센스쿨 구글 계정(@senedu.kr) 로그인 시 이메일 주소, 이름, 프로필 사진을 수집합니다. 후기 작성 시 작성 내용과 작성 일시가 함께 저장됩니다.</p>

              <h4>3. 개인정보의 보유 및 이용 기간</h4>
              <p>정보주체가 동의를 철회하거나 작성한 후기를 삭제한 때까지 보유합니다. 누리집 운영이 종료되는 경우 보유 중인 개인정보를 모두 파기합니다.</p>

              <h4>4. 개인정보의 제3자 제공</h4>
              <p>원칙적으로 개인정보를 외부에 제공하지 않습니다. 다만 서비스 제공에 필요한 범위에서 클라우드 서비스(Google Firebase)에 저장·처리됩니다.</p>

              <h4>5. 정보주체의 권리·의무 및 행사 방법</h4>
              <p>정보주체는 언제든지 개인정보 열람·정정·삭제·처리정지를 요구할 수 있습니다. 후기 화면의 '후기 수정하기' 기능으로 직접 수정·삭제하실 수 있으며, 그 밖의 요청은 아래 담당자에게 문의해 주시기 바랍니다.</p>

              <h4>6. 개인정보의 파기</h4>
              <p>보유 기간이 경과하거나 처리 목적이 달성된 경우 지체 없이 해당 개인정보를 파기합니다. 전자적 파일은 복구가 불가능한 방법으로 삭제합니다.</p>

              <h4>7. 개인정보 보호책임자</h4>
              <p>
                기관: 서울특별시서부교육지원청<br />
                담당 부서 및 연락처: 누리집 관리자에게 문의
              </p>

              <h4>8. 개인정보처리방침의 변경</h4>
              <p>법령·정책 변경에 따라 내용이 추가·삭제·수정될 수 있으며, 변경 시 누리집을 통해 공지하고 재동의를 받습니다.</p>

              <p class="pcm-policy-version">방침 버전 · ${PRIVACY_POLICY_VERSION}</p>
            </div>
          </details>

          <label class="pcm-agree-row" for="pcm-agree-check">
            <input type="checkbox" id="pcm-agree-check" />
            <span>위 개인정보 수집·이용 내용을 확인하였으며 이에 <strong>동의합니다.</strong> (필수)</span>
          </label>
        </div>

        <div class="pcm-foot">
          <button type="button" class="btn-m3-outlined pcm-btn" id="pcm-decline">동의하지 않음</button>
          <button type="button" class="btn-m3-filled pcm-btn" id="pcm-agree" disabled>동의하고 계속하기</button>
        </div>
      </div>
    </div>
  `;

  const backdrop = mount.querySelector("#consent-backdrop");
  const checkbox = mount.querySelector("#pcm-agree-check");
  const agreeBtn = mount.querySelector("#pcm-agree");
  const declineBtn = mount.querySelector("#pcm-decline");

  // 동의 팝업은 바깥 클릭으로 닫히지 않도록 한다 (동의 여부를 반드시 선택)
  const dialog = mount.querySelector(".m3-modal-dialog");
  if (dialog) dialog.addEventListener("click", (e) => e.stopPropagation());

  const close = () => {
    backdrop.classList.remove("open");
    setTimeout(() => {
      if (mount.querySelector("#consent-backdrop") === backdrop) mount.innerHTML = "";
    }, 200);
  };

  checkbox.addEventListener("change", () => {
    agreeBtn.disabled = !checkbox.checked;
  });

  agreeBtn.addEventListener("click", () => {
    if (!checkbox.checked) return;
    saveConsent(safeEmail);
    close();
    if (onAgree) onAgree();
  });

  declineBtn.addEventListener("click", () => {
    close();
    if (onDecline) {
      onDecline();
    } else {
      // 동의하지 않으면 로그인 상태를 유지하지 않는다
      GoogleAuthService.logout();
      alert("개인정보 수집·이용에 동의하지 않아 로그아웃되었습니다.\n후기 작성 등 기능은 동의 후 이용하실 수 있습니다.");
    }
  });

  setTimeout(() => checkbox.focus(), 60);
}

function escapeHtml(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
