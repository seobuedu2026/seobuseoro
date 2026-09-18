import {
  getAdminEmails,
  getPrimaryAdminEmail,
  getAdminPasswordMap,
  getAdminPasswordForEmail,
  setAdminPasswordForEmail,
  addAdminEmail,
  removeAdminEmail,
  setPrimaryAdminEmail,
  GoogleAuthService
} from "../auth/googleAuth.js";

/**
 * 관리자 ID 현황 및 비밀번호(PW) 보안 관리 대시보드 모달
 * @param {Function} onSaved 상태 변경 시 콜백
 */
export function openAdminAccountModal(onSaved) {
  const mount = document.getElementById("modal-mount");
  if (!mount) return;

  let activeTab = "list"; // "list" | "password" | "session"
  let selectedEmailForPwEdit = null; // 인라인 PW 변경 대상 ID

  function render() {
    const adminEmails = getAdminEmails();
    const primaryEmail = getPrimaryAdminEmail();
    const passwordMap = getAdminPasswordMap();
    const currentUser = GoogleAuthService.getCurrentUser() || {
      email: primaryEmail,
      name: "관리자",
      role: "시스템 관리자"
    };

    mount.innerHTML = `
      <div class="m3-modal-backdrop open" id="admin-account-backdrop">
        <div class="m3-modal-dialog" style="max-width: 640px; padding: 26px;">
          <!-- 모달 헤더 -->
          <div class="modal-header" style="margin-bottom: 12px; align-items: center;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <div style="width: 38px; height: 38px; border-radius: 10px; background: rgba(14, 55, 83, 0.1); display: flex; align-items: center; justify-content: center; font-size: 20px;">
                👥
              </div>
              <div>
                <h3 style="font-size: 19px; font-weight: 900; color: #0e3753; margin: 0; display: flex; align-items: center; gap: 8px;">
                  관리자 ID 현황 및 비밀번호 관리
                  <span style="font-size: 11px; font-weight: 800; background: #0e3753; color: #ffffff; padding: 2px 8px; border-radius: 9999px;">
                    총 ${adminEmails.length}명
                  </span>
                </h3>
                <p style="font-size: 12.5px; color: #64748b; margin: 2px 0 0 0;">
                  관리자 ID 목록을 조회·추가·삭제하고, 각 ID별 전용 비밀번호(PW)를 설정 및 변경합니다.
                </p>
              </div>
            </div>
            <button class="modal-close-btn" id="btn-close-account-modal" aria-label="닫기">✕</button>
          </div>

          <!-- 상단 요약 미니 카드 (등록된 관리자 ID / 현재 접속 계정) -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 18px;">
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 10px 14px;">
              <div style="font-size: 11.5px; color: #64748b; font-weight: 700;">등록된 관리자 ID</div>
              <div style="font-size: 18px; font-weight: 900; color: #0e3753; margin-top: 2px;">
                ${adminEmails.length}<span style="font-size: 13px; font-weight: 700; color: #64748b;"> 개</span>
              </div>
            </div>
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 10px 14px;">
              <div style="font-size: 11.5px; color: #166534; font-weight: 700;">현재 접속 계정</div>
              <div style="font-size: 13.5px; font-weight: 800; color: #15803d; margin-top: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${currentUser.email}">
                ${currentUser.email}
              </div>
            </div>
          </div>

          <!-- 탭 메뉴 버튼 -->
          <div style="display: flex; gap: 8px; border-bottom: 2px solid #e2e8f0; margin-bottom: 18px; padding-bottom: 2px;">
            <button type="button" class="tab-btn ${activeTab === 'list' ? 'active' : ''}" id="tab-btn-list" style="padding: 8px 14px; font-size: 13.5px; font-weight: 800; border: none; background: none; cursor: pointer; color: ${activeTab === 'list' ? '#0e3753' : '#64748b'}; border-bottom: 2px solid ${activeTab === 'list' ? '#0e3753' : 'transparent'}; margin-bottom: -4px;">
              📋 관리자 ID & 비밀번호 등록 (${adminEmails.length})
            </button>
            <button type="button" class="tab-btn ${activeTab === 'password' ? 'active' : ''}" id="tab-btn-password" style="padding: 8px 14px; font-size: 13.5px; font-weight: 800; border: none; background: none; cursor: pointer; color: ${activeTab === 'password' ? '#0e3753' : '#64748b'}; border-bottom: 2px solid ${activeTab === 'password' ? '#0e3753' : 'transparent'}; margin-bottom: -4px;">
              🔒 비밀번호(PW) 변경
            </button>
            <button type="button" class="tab-btn ${activeTab === 'session' ? 'active' : ''}" id="tab-btn-session" style="padding: 8px 14px; font-size: 13.5px; font-weight: 800; border: none; background: none; cursor: pointer; color: ${activeTab === 'session' ? '#0e3753' : '#64748b'}; border-bottom: 2px solid ${activeTab === 'session' ? '#0e3753' : 'transparent'}; margin-bottom: -4px;">
              ℹ️ 권한 및 세션 정보
            </button>
          </div>

          <!-- 탭 1: 관리자 ID 목록 & 새 ID + PW 추가 등록 -->
          <div id="tab-content-list" style="display: ${activeTab === 'list' ? 'block' : 'none'};">
            <!-- 새 관리자 ID + 비밀번호 등록 폼 -->
            <form id="form-add-admin-email" style="background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 14px; padding: 16px; margin-bottom: 18px;">
              <div style="font-weight: 900; font-size: 13.5px; color: #0e3753; margin-bottom: 10px; display: flex; align-items: center; gap: 6px;">
                <span>➕ 새 관리자 ID 및 비밀번호 등록</span>
              </div>

              <div style="display: grid; grid-template-columns: 1fr; gap: 10px; margin-bottom: 10px;">
                <div>
                  <label for="input-new-admin-email" style="font-size: 12px; font-weight: 700; color: #475569; display: block; margin-bottom: 4px;">
                    이메일 주소 * (구글 이메일 또는 @senedu.kr)
                  </label>
                  <input type="email" id="input-new-admin-email" class="m3-input" placeholder="예: seobuedu2026@gmail.com 또는 teacher@senedu.kr" required style="padding: 8px 12px; font-size: 13.5px;" />
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                  <div>
                    <label for="input-new-admin-pw" style="font-size: 12px; font-weight: 700; color: #475569; display: block; margin-bottom: 4px;">
                      접속 비밀번호 * (4자 이상)
                    </label>
                    <input type="password" id="input-new-admin-pw" class="m3-input" placeholder="새 비밀번호 입력 (4자 이상)" required minlength="4" style="padding: 8px 12px; font-size: 13.5px;" />
                  </div>
                  <div>
                    <label for="input-new-admin-pw-confirm" style="font-size: 12px; font-weight: 700; color: #475569; display: block; margin-bottom: 4px;">
                      비밀번호 확인 *
                    </label>
                    <input type="password" id="input-new-admin-pw-confirm" class="m3-input" placeholder="비밀번호 다시 입력" required minlength="4" style="padding: 8px 12px; font-size: 13.5px;" />
                  </div>
                </div>
              </div>

              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 11.5px; color: #64748b;">
                  * 관리자 ID 등록 시 사용할 전용 비밀번호를 직접 지정합니다.
                </span>
                <button type="submit" class="btn-m3-filled" style="background: #008080; border-color: #008080; white-space: nowrap; padding: 8px 18px; font-size: 13.5px; font-weight: 800;">
                  ➕ 관리자 ID 및 PW 등록
                </button>
              </div>
            </form>

            <!-- 개별 PW 빠른 수정 인라인 폼 (선택 시 활성화) -->
            ${selectedEmailForPwEdit ? `
              <div id="box-inline-pw-edit" style="background: #fffbeb; border: 1.5px solid #fde68a; border-radius: 12px; padding: 14px; margin-bottom: 16px; animation: fadeIn 0.2s ease;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                  <span style="font-weight: 900; font-size: 13px; color: #92400e; display: flex; align-items: center; gap: 6px;">
                    🔑 [${selectedEmailForPwEdit}] 비밀번호(PW) 변경
                  </span>
                  <button type="button" id="btn-cancel-inline-pw" style="background: none; border: none; font-size: 14px; color: #92400e; cursor: pointer;">✕</button>
                </div>
                <form id="form-inline-pw-save" style="display: flex; gap: 8px; flex-wrap: wrap;">
                  <input type="password" id="input-inline-pw" class="m3-input" placeholder="새 비밀번호 입력 (4자 이상)" required minlength="4" style="flex: 1; min-width: 160px; padding: 8px 12px; font-size: 13.5px; background: #ffffff;" />
                  <input type="password" id="input-inline-pw-confirm" class="m3-input" placeholder="새 비밀번호 확인" required minlength="4" style="flex: 1; min-width: 160px; padding: 8px 12px; font-size: 13.5px; background: #ffffff;" />
                  <button type="submit" class="btn-m3-filled" style="background: #d97706; border-color: #d97706; padding: 8px 16px; font-size: 13px; font-weight: 800;">
                    저장
                  </button>
                </form>
              </div>
            ` : ''}

            <!-- 관리자 ID 목록 -->
            <div style="font-weight: 800; font-size: 13px; color: #0e3753; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
              <span>등록된 관리자 ID 목록 (${adminEmails.length}개)</span>
              <span style="font-size: 11.5px; color: #64748b; font-weight: normal;">* 각 ID별 [🔑 PW 변경]으로 비밀번호를 수정할 수 있습니다.</span>
            </div>

            <div style="max-height: 240px; overflow-y: auto; border: 1px solid #e2e8f0; border-radius: 12px; divide-y: 1px solid #e2e8f0; background: #ffffff;">
              ${adminEmails.map((email, idx) => {
                const clean = email.toLowerCase();
                const isPrimary = (clean === primaryEmail.toLowerCase()) || (idx === 0);
                const isCurrent = (clean === (currentUser.email || '').toLowerCase());
                const hasCustomPw = Boolean(passwordMap[clean] && passwordMap[clean].trim());

                return `
                  <div style="display: flex; align-items: center; justify-content: space-between; padding: 11px 14px; border-bottom: 1px solid #f1f5f9; gap: 8px; flex-wrap: wrap;">
                    <div style="display: flex; align-items: center; gap: 8px; min-width: 0; flex: 1;">
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
                          ${hasCustomPw ? `
                            <span style="font-size: 10.5px; font-weight: 800; background: #e0f2fe; color: #0369a1; padding: 1px 7px; border-radius: 9999px;" title="전용 비밀번호가 등록되어 있습니다.">
                              🔑 PW 설정완료
                            </span>
                          ` : `
                            <span style="font-size: 10.5px; font-weight: 700; background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; padding: 1px 7px; border-radius: 9999px;" title="비밀번호 설정이 필요합니다.">
                              ⚠️ PW 설정필요
                            </span>
                          `}
                          ${isCurrent ? `
                            <span style="font-size: 10.5px; font-weight: 800; background: #dcfce7; color: #15803d; padding: 1px 7px; border-radius: 9999px;">
                              접속중
                            </span>
                          ` : ''}
                        </div>
                      </div>
                    </div>

                    <div style="display: flex; align-items: center; gap: 6px; flex-shrink: 0;">
                      <button type="button" class="btn-quick-edit-pw btn-m3-outlined" data-email="${email}" style="padding: 4px 8px; font-size: 11.5px; border-radius: 6px; color: #0e3753; border-color: #cbd5e1; font-weight: 700;" title="이 ID의 비밀번호 변경">
                        🔑 PW 변경
                      </button>
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
            <!-- 관리자 ID별 개별 비밀번호 설정 -->
            <form id="form-specific-admin-pw" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 16px;">
              <div style="font-weight: 900; font-size: 13.5px; color: #0e3753; margin-bottom: 10px;">
                👤 관리자 ID별 비밀번호(PW) 변경
              </div>
              
              <div class="form-group" style="margin-bottom: 12px;">
                <label for="select-admin-target-email" style="font-weight: 700; font-size: 12.5px; color: #475569;">
                  대상 관리자 ID 선택 *
                </label>
                <select id="select-admin-target-email" class="m3-input" style="padding: 9px 12px; font-size: 13.5px; background: #ffffff;">
                  ${adminEmails.map(e => `
                    <option value="${e}" ${e.toLowerCase() === (currentUser.email || '').toLowerCase() ? 'selected' : ''}>
                      ${e} (${getAdminPasswordForEmail(e) ? 'PW 설정완료' : 'PW 설정필요'})
                    </option>
                  `).join("")}
                </select>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px;">
                <div class="form-group" style="margin-bottom: 0;">
                  <label for="input-target-new-pw" style="font-weight: 700; font-size: 12.5px; color: #475569;">
                    새 비밀번호 *
                  </label>
                  <input type="password" id="input-target-new-pw" class="m3-input" placeholder="새 비밀번호 입력 (4자 이상)" required minlength="4" style="padding: 9px 12px; font-size: 13.5px; background: #ffffff;" />
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                  <label for="input-target-confirm-pw" style="font-weight: 700; font-size: 12.5px; color: #475569;">
                    새 비밀번호 확인 *
                  </label>
                  <input type="password" id="input-target-confirm-pw" class="m3-input" placeholder="새 비밀번호 다시 입력" required minlength="4" style="padding: 9px 12px; font-size: 13.5px; background: #ffffff;" />
                </div>
              </div>

              <div style="display: flex; justify-content: flex-end;">
                <button type="submit" class="btn-m3-filled" style="background: #0e3753; border-color: #0e3753; padding: 8px 18px; font-size: 13px; font-weight: 800;">
                  💾 비밀번호 변경 저장
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
                <li><strong>관리자 ID 및 PW 관리:</strong> 각 ID별 전용 비밀번호 부여 및 관리자 계정 추가/삭제</li>
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
    const formSpecificPw = mount.querySelector("#form-specific-admin-pw");
    const formInlinePw = mount.querySelector("#form-inline-pw-save");
    const btnCancelInlinePw = mount.querySelector("#btn-cancel-inline-pw");
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

    // 새 관리자 ID + 비밀번호 등록 처리
    if (formAdd) {
      formAdd.addEventListener("submit", (e) => {
        e.preventDefault();
        const inputEmail = mount.querySelector("#input-new-admin-email");
        const inputPw = mount.querySelector("#input-new-admin-pw");
        const inputConfirmPw = mount.querySelector("#input-new-admin-pw-confirm");

        const email = inputEmail.value.trim();
        const pw = inputPw.value.trim();
        const confirmPw = inputConfirmPw.value.trim();

        if (!pw || pw.length < 4) {
          alert("⚠️ 접속 비밀번호는 최소 4자 이상으로 입력해주세요.");
          inputPw.focus();
          return;
        }
        if (pw !== confirmPw) {
          alert("❌ 입력한 비밀번호가 서로 일치하지 않습니다.");
          inputConfirmPw.focus();
          return;
        }

        const res = addAdminEmail(email, pw);
        if (res.success) {
          alert(`✅ 관리자 ID (${email}) 및 비밀번호가 성공적으로 등록되었습니다!`);
          render();
        } else {
          alert(`⚠️ ${res.message || '관리자 ID 등록에 실패했습니다.'}`);
          inputEmail.focus();
        }
      });
    }

    // 인라인 PW 빠른 변경 폼
    if (formInlinePw) {
      formInlinePw.addEventListener("submit", (e) => {
        e.preventDefault();
        const pw = mount.querySelector("#input-inline-pw").value.trim();
        const confirmPw = mount.querySelector("#input-inline-pw-confirm").value.trim();

        if (pw.length < 4) {
          alert("⚠️ 새 비밀번호는 최소 4자 이상으로 입력해주세요.");
          return;
        }
        if (pw !== confirmPw) {
          alert("❌ 새 비밀번호가 일치하지 않습니다.");
          return;
        }

        setAdminPasswordForEmail(selectedEmailForPwEdit, pw);
        alert(`✅ [${selectedEmailForPwEdit}]의 비밀번호가 성공적으로 변경되었습니다.`);
        selectedEmailForPwEdit = null;
        render();
      });
    }

    if (btnCancelInlinePw) {
      btnCancelInlinePw.addEventListener("click", () => {
        selectedEmailForPwEdit = null;
        render();
      });
    }

    // 관리자 목록에서 [PW 변경] 버튼 클릭 시 인라인 수정 폼 활성화
    mount.querySelectorAll(".btn-quick-edit-pw").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const email = e.currentTarget.dataset.email;
        selectedEmailForPwEdit = email;
        render();
        const inputInline = mount.querySelector("#input-inline-pw");
        if (inputInline) inputInline.focus();
      });
    });

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
            if (selectedEmailForPwEdit === email) selectedEmailForPwEdit = null;
            alert(`✅ [${email}] 관리자 ID가 삭제되었습니다.`);
            render();
          } else {
            alert(`⚠️ ${res.message || '삭제에 실패했습니다.'}`);
          }
        }
      });
    });

    // 탭 2: 특정 관리자 ID 비밀번호 변경 폼
    if (formSpecificPw) {
      formSpecificPw.addEventListener("submit", (e) => {
        e.preventDefault();
        const targetEmail = mount.querySelector("#select-admin-target-email").value;
        const newPw = mount.querySelector("#input-target-new-pw").value.trim();
        const confirmPw = mount.querySelector("#input-target-confirm-pw").value.trim();

        if (newPw.length < 4) {
          alert("⚠️ 새 비밀번호는 최소 4자 이상으로 입력해주세요.");
          mount.querySelector("#input-target-new-pw").focus();
          return;
        }
        if (newPw !== confirmPw) {
          alert("❌ 새 비밀번호가 일치하지 않습니다.");
          mount.querySelector("#input-target-confirm-pw").focus();
          return;
        }

        setAdminPasswordForEmail(targetEmail, newPw);
        alert(`✅ [${targetEmail}]의 비밀번호가 성공적으로 변경되었습니다!`);
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
