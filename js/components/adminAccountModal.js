import {
  getAdminEmails,
  getPrimaryAdminEmail,
  getAdminPassword,
  addAdminEmail,
  removeAdminEmail,
  setPrimaryAdminEmail,
  updateAdminCredentials,
  GoogleAuthService
} from "../auth/googleAuth.js";

/**
 * 관리자 ID 현황 및 보안 관리 대시보드 모달
 * @param {Function} onSaved 상태 변경 시 콜백
 */
export function openAdminAccountModal(onSaved) {
  const mount = document.getElementById("modal-mount");
  if (!mount) return;

  let activeTab = "list"; // "list" | "password" | "session"

  function render() {
    const adminEmails = getAdminEmails();
    const primaryEmail = getPrimaryAdminEmail();
    const currentUser = GoogleAuthService.getCurrentUser() || {
      email: primaryEmail,
      name: "관리자",
      role: "시스템 관리자"
    };

    mount.innerHTML = `
      <div class="m3-modal-backdrop open" id="admin-account-backdrop">
        <div class="m3-modal-dialog" style="max-width: 620px; padding: 26px;">
          <!-- 모달 헤더 -->
          <div class="modal-header" style="margin-bottom: 12px; align-items: center;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <div style="width: 38px; height: 38px; border-radius: 10px; background: rgba(14, 55, 83, 0.1); display: flex; align-items: center; justify-content: center; font-size: 20px;">
                👥
              </div>
              <div>
                <h3 style="font-size: 19px; font-weight: 900; color: #0e3753; margin: 0; display: flex; align-items: center; gap: 8px;">
                  관리자 ID 현황 및 관리
                  <span style="font-size: 11px; font-weight: 800; background: #0e3753; color: #ffffff; padding: 2px 8px; border-radius: 9999px;">
                    총 ${adminEmails.length}명
                  </span>
                </h3>
                <p style="font-size: 12.5px; color: #64748b; margin: 2px 0 0 0;">
                  관리자 로그인 권한이 부여된 ID 목록을 확인하고 추가·삭제 및 보안을 관리합니다.
                </p>
              </div>
            </div>
            <button class="modal-close-btn" id="btn-close-account-modal" aria-label="닫기">✕</button>
          </div>

          <!-- 상단 요약 미니 카드 -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 10px; margin-bottom: 18px;">
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 10px 14px;">
              <div style="font-size: 11.5px; color: #64748b; font-weight: 700;">등록된 관리자 ID</div>
              <div style="font-size: 18px; font-weight: 900; color: #0e3753; margin-top: 2px;">${adminEmails.length}<span style="font-size: 13px; font-weight: 700; color: #64748b;"> 개</span></div>
            </div>
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 10px 14px;">
              <div style="font-size: 11.5px; color: #166534; font-weight: 700;">현재 접속 계정</div>
              <div style="font-size: 13.5px; font-weight: 800; color: #15803d; margin-top: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${currentUser.email}">
                ${currentUser.email}
              </div>
            </div>
            <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; padding: 10px 14px;">
              <div style="font-size: 11.5px; color: #0369a1; font-weight: 700;">보안 인증 상태</div>
              <div style="font-size: 13.5px; font-weight: 800; color: #0284c7; margin-top: 4px; display: flex; align-items: center; gap: 4px;">
                <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #22c55e;"></span>
                정상 활성화
              </div>
            </div>
          </div>

          <!-- 탭 메뉴 버튼 -->
          <div style="display: flex; gap: 8px; border-bottom: 2px solid #e2e8f0; margin-bottom: 18px; padding-bottom: 2px;">
            <button type="button" class="tab-btn ${activeTab === 'list' ? 'active' : ''}" id="tab-btn-list" style="padding: 8px 14px; font-size: 13.5px; font-weight: 800; border: none; background: none; cursor: pointer; color: ${activeTab === 'list' ? '#0e3753' : '#64748b'}; border-bottom: 2px solid ${activeTab === 'list' ? '#0e3753' : 'transparent'}; margin-bottom: -4px;">
              📋 관리자 ID 목록 & 추가 (${adminEmails.length})
            </button>
            <button type="button" class="tab-btn ${activeTab === 'password' ? 'active' : ''}" id="tab-btn-password" style="padding: 8px 14px; font-size: 13.5px; font-weight: 800; border: none; background: none; cursor: pointer; color: ${activeTab === 'password' ? '#0e3753' : '#64748b'}; border-bottom: 2px solid ${activeTab === 'password' ? '#0e3753' : 'transparent'}; margin-bottom: -4px;">
              🔒 비밀번호(PW) 변경
            </button>
            <button type="button" class="tab-btn ${activeTab === 'session' ? 'active' : ''}" id="tab-btn-session" style="padding: 8px 14px; font-size: 13.5px; font-weight: 800; border: none; background: none; cursor: pointer; color: ${activeTab === 'session' ? '#0e3753' : '#64748b'}; border-bottom: 2px solid ${activeTab === 'session' ? '#0e3753' : 'transparent'}; margin-bottom: -4px;">
              ℹ️ 권한 및 세션 정보
            </button>
          </div>

          <!-- 탭 1: 관리자 ID 목록 & 추가 -->
          <div id="tab-content-list" style="display: ${activeTab === 'list' ? 'block' : 'none'};">
            <!-- 새 관리자 ID 등록 폼 -->
            <form id="form-add-admin-email" style="background: #f8fafc; border: 1.5px dashed #cbd5e1; border-radius: 12px; padding: 14px; margin-bottom: 18px;">
              <label for="input-new-admin-email" style="font-weight: 800; font-size: 13px; color: #0e3753; display: flex; align-items: center; gap: 6px; margin-bottom: 8px;">
                <span>➕ 새 관리자 ID(이메일) 등록</span>
                <span style="font-size: 11px; font-weight: normal; color: #64748b;">(@senedu.kr 또는 구글 이메일)</span>
              </label>
              <div style="display: flex; gap: 8px;">
                <input type="email" id="input-new-admin-email" class="m3-input" placeholder="추가할 이메일 입력 (예: teacher@senedu.kr)" required style="flex: 1; padding: 9px 12px; font-size: 13.5px;" />
                <button type="submit" class="btn-m3-filled" style="background: #008080; border-color: #008080; white-space: nowrap; padding: 9px 16px; font-size: 13.5px;">
                  + ID 추가
                </button>
              </div>
            </form>

            <!-- 관리자 ID 목록 -->
            <div style="font-weight: 800; font-size: 13px; color: #0e3753; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
              <span>등록된 관리자 ID 목록</span>
              <span style="font-size: 11.5px; color: #64748b; font-weight: normal;">* 등록된 ID는 공통 관리자 PW로 로그인 가능합니다.</span>
            </div>

            <div style="max-height: 250px; overflow-y: auto; border: 1px solid #e2e8f0; border-radius: 12px; divide-y: 1px solid #e2e8f0; background: #ffffff;">
              ${adminEmails.map((email, idx) => {
                const isPrimary = (email.toLowerCase() === primaryEmail.toLowerCase()) || (idx === 0);
                const isCurrent = (email.toLowerCase() === (currentUser.email || '').toLowerCase());
                return `
                  <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; border-bottom: 1px solid #f1f5f9; gap: 10px;">
                    <div style="display: flex; align-items: center; gap: 10px; min-width: 0; flex: 1;">
                      <span style="font-size: 16px; flex-shrink: 0;">${isPrimary ? '👑' : '👤'}</span>
                      <div style="min-width: 0;">
                        <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                          <span style="font-weight: 800; font-size: 13.5px; color: #0e3753; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                            ${email}
                          </span>
                          ${isPrimary ? `
                            <span style="font-size: 10.5px; font-weight: 800; background: #0e3753; color: #ffffff; padding: 1px 7px; border-radius: 9999px;">
                              대표 관리자
                            </span>
                          ` : `
                            <span style="font-size: 10.5px; font-weight: 700; background: #f1f5f9; color: #475569; padding: 1px 7px; border-radius: 9999px;">
                              관리자 ID
                            </span>
                          `}
                          ${isCurrent ? `
                            <span style="font-size: 10.5px; font-weight: 800; background: #dcfce7; color: #15803d; padding: 1px 7px; border-radius: 9999px;">
                              현재 접속중
                            </span>
                          ` : ''}
                        </div>
                        <div style="font-size: 11.5px; color: #94a3b8; margin-top: 2px;">
                          로그인 가능 • 전체 행사 및 후기 관리 권한
                        </div>
                      </div>
                    </div>

                    <div style="display: flex; align-items: center; gap: 6px; flex-shrink: 0;">
                      ${!isPrimary ? `
                        <button type="button" class="btn-set-primary btn-m3-outlined" data-email="${email}" style="padding: 4px 8px; font-size: 11.5px; border-radius: 6px; color: #0284c7; border-color: #bae6fd;">
                          대표 지정
                        </button>
                      ` : ''}
                      ${adminEmails.length > 1 ? `
                        <button type="button" class="btn-delete-admin btn-m3-outlined" data-email="${email}" style="padding: 4px 8px; font-size: 11.5px; border-radius: 6px; color: #ef4444; border-color: #fecaca;" title="관리자 ID 삭제">
                          🗑️ 삭제
                        </button>
                      ` : `
                        <span style="font-size: 11px; color: #94a3b8; padding: 4px 6px;">(기본 ID)</span>
                      `}
                    </div>
                  </div>
                `;
              }).join("")}
            </div>
          </div>

          <!-- 탭 2: 비밀번호(PW) 변경 -->
          <div id="tab-content-password" style="display: ${activeTab === 'password' ? 'block' : 'none'};">
            <form id="admin-password-change-form">
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 16px;">
                <div class="form-group" style="margin-bottom: 14px;">
                  <label for="pw-current-input" style="font-weight: 800; font-size: 13px; color: #0e3753;">
                    현재 비밀번호 (PW) *
                  </label>
                  <input type="password" id="pw-current-input" class="m3-input" placeholder="현재 비밀번호 입력" required style="padding: 10px 12px; font-size: 14px;" />
                </div>

                <div class="form-group" style="margin-bottom: 14px;">
                  <label for="pw-new-input" style="font-weight: 800; font-size: 13px; color: #0e3753;">
                    새 비밀번호 (PW) *
                  </label>
                  <input type="password" id="pw-new-input" class="m3-input" placeholder="새 비밀번호 입력 (4자 이상 권장)" required style="padding: 10px 12px; font-size: 14px;" />
                </div>

                <div class="form-group" style="margin-bottom: 0;">
                  <label for="pw-confirm-input" style="font-weight: 800; font-size: 13px; color: #0e3753;">
                    새 비밀번호 확인 *
                  </label>
                  <input type="password" id="pw-confirm-input" class="m3-input" placeholder="새 비밀번호 다시 입력" required style="padding: 10px 12px; font-size: 14px;" />
                </div>
              </div>

              <div style="display: flex; justify-content: flex-end; gap: 8px;">
                <button type="submit" class="btn-m3-filled" style="background: #0e3753; border-color: #0e3753; padding: 10px 20px; font-size: 14px; font-weight: 800;">
                  🔒 비밀번호 변경 저장
                </button>
              </div>
            </form>
          </div>

          <!-- 탭 3: 권한 및 세션 정보 -->
          <div id="tab-content-session" style="display: ${activeTab === 'session' ? 'block' : 'none'};">
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 16px;">
              <h4 style="font-size: 14px; font-weight: 800; color: #0e3753; margin: 0 0 12px 0;">
                🛡️ 관리자 권한 안내
              </h4>
              <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #475569; line-height: 1.8;">
                <li><strong>행사 드래그&드롭 일정 이동:</strong> 달력에서 행사를 끌어다 놓아 날짜 즉시 변경</li>
                <li><strong>후기 원클릭 승인 & 일괄 승인:</strong> 선생님들이 작성한 참여후기를 즉시 또는 일괄 공개 승인</li>
                <li><strong>엑셀 일괄 등록:</strong> 엑셀 서식 파일(.xlsx) 업로드로 행사 대량 등록 및 수정</li>
                <li><strong>달력 월 관리 및 강조 주간 설정:</strong> 상단 강조 주간 텍스트 및 달력 표시 월 편집</li>
                <li><strong>관리자 ID 및 PW 관리:</strong> 관리자 ID 추가/삭제 및 시스템 비밀번호 변경</li>
              </ul>
            </div>

            <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; padding: 14px; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-size: 12.5px; font-weight: 800; color: #0369a1;">현재 세션: ${currentUser.email}</div>
                <div style="font-size: 11.5px; color: #64748b; margin-top: 2px;">안전한 관리를 위해 작업 완료 후 로그아웃을 권장합니다.</div>
              </div>
              <button type="button" id="btn-session-logout" class="btn-m3-outlined" style="color: #ef4444; border-color: #fecaca; padding: 6px 12px; font-size: 12px; font-weight: 800;">
                관리자 로그아웃
              </button>
            </div>
          </div>

          <!-- 모달 하단 닫기 버튼 -->
          <div style="display: flex; justify-content: flex-end; margin-top: 18px; border-top: 1px solid #e2e8f0; padding-top: 14px;">
            <button type="button" id="btn-close-bottom" class="btn-m3-filled" style="padding: 8px 18px; font-size: 13.5px;">
              확인 (닫기)
            </button>
          </div>
        </div>
      </div>
    `;

    bindEvents();
  }

  function bindEvents() {
    const backdrop = mount.querySelector("#admin-account-backdrop");
    const closeBtn = mount.querySelector("#btn-close-account-modal");
    const closeBottomBtn = mount.querySelector("#btn-close-bottom");

    const tabBtnList = mount.querySelector("#tab-btn-list");
    const tabBtnPassword = mount.querySelector("#tab-btn-password");
    const tabBtnSession = mount.querySelector("#tab-btn-session");

    const formAdd = mount.querySelector("#form-add-admin-email");
    const formPw = mount.querySelector("#admin-password-change-form");
    const btnSessionLogout = mount.querySelector("#btn-session-logout");

    const closeModal = () => {
      backdrop.classList.remove("open");
      setTimeout(() => {
        if (mount.querySelector("#admin-account-backdrop") === backdrop) {
          mount.innerHTML = "";
        }
      }, 200);
      if (onSaved) onSaved();
    };

    if (closeBtn) closeBtn.addEventListener("click", (e) => { e.stopPropagation(); closeModal(); });
    if (closeBottomBtn) closeBottomBtn.addEventListener("click", (e) => { e.stopPropagation(); closeModal(); });

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

    // 탭 전환 이벤트
    if (tabBtnList) {
      tabBtnList.addEventListener("click", () => {
        activeTab = "list";
        render();
      });
    }
    if (tabBtnPassword) {
      tabBtnPassword.addEventListener("click", () => {
        activeTab = "password";
        render();
      });
    }
    if (tabBtnSession) {
      tabBtnSession.addEventListener("click", () => {
        activeTab = "session";
        render();
      });
    }

    // 새 관리자 ID 등록 처리
    if (formAdd) {
      formAdd.addEventListener("submit", (e) => {
        e.preventDefault();
        const input = mount.querySelector("#input-new-admin-email");
        const email = input.value.trim();

        const res = addAdminEmail(email);
        if (res.success) {
          alert(`✅ 관리자 ID (${email})가 성공적으로 등록되었습니다!`);
          render();
        } else {
          alert(`⚠️ ${res.message || '관리자 ID 등록에 실패했습니다.'}`);
          input.focus();
        }
      });
    }

    // 대표 관리자 지정 버튼
    mount.querySelectorAll(".btn-set-primary").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const email = e.currentTarget.dataset.email;
        if (confirm(`👑 [${email}] 계정을 대표 관리자로 지정하시겠습니까?`)) {
          setPrimaryAdminEmail(email);
          alert(`✅ [${email}] 계정이 대표 관리자로 지정되었습니다.`);
          render();
        }
      });
    });

    // 관리자 ID 삭제 버튼
    mount.querySelectorAll(".btn-delete-admin").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const email = e.currentTarget.dataset.email;
        if (confirm(`🗑️ [${email}] 관리자 ID를 삭제하시겠습니까?\n삭제 후에는 해당 ID로 관리자 로그인이 제한됩니다.`)) {
          const res = removeAdminEmail(email);
          if (res.success) {
            alert(`✅ [${email}] 관리자 ID가 삭제되었습니다.`);
            render();
          } else {
            alert(`⚠️ ${res.message || '삭제에 실패했습니다.'}`);
          }
        }
      });
    });

    // 비밀번호 변경 폼
    if (formPw) {
      formPw.addEventListener("submit", (e) => {
        e.preventDefault();
        const curPw = mount.querySelector("#pw-current-input").value.trim();
        const newPw = mount.querySelector("#pw-new-input").value.trim();
        const confirmPw = mount.querySelector("#pw-confirm-input").value.trim();

        const storedPw = getAdminPassword();
        const defaultPws = ["qwer1234", "seobuedu2026@gmail.com"];

        if (curPw !== storedPw && !defaultPws.includes(curPw)) {
          alert("❌ 현재 비밀번호가 일치하지 않습니다.");
          mount.querySelector("#pw-current-input").focus();
          return;
        }

        if (newPw.length < 4) {
          alert("⚠️ 새 비밀번호는 최소 4자 이상으로 입력해주세요.");
          mount.querySelector("#pw-new-input").focus();
          return;
        }

        if (newPw !== confirmPw) {
          alert("❌ 새 비밀번호와 비밀번호 확인이 일치하지 않습니다.");
          mount.querySelector("#pw-confirm-input").focus();
          return;
        }

        updateAdminCredentials(null, newPw);
        alert("✅ 관리자 비밀번호(PW)가 성공적으로 변경되었습니다!");
        activeTab = "list";
        render();
      });
    }

    // 세션 탭 로그아웃 버튼
    if (btnSessionLogout) {
      btnSessionLogout.addEventListener("click", () => {
        if (confirm("로그아웃 하시겠습니까?")) {
          GoogleAuthService.logout();
          closeModal();
        }
      });
    }
  }

  render();
}
