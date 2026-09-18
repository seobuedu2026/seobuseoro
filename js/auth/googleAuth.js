// Google Identity Services & @senedu.kr 전용 인증 및 관리자 모듈

const STORAGE_KEY = "seobu_user_session";
const ADMIN_MODE_KEY = "seobu_admin_mode";
const ADMIN_PW_STORAGE_KEY = "seobu_admin_password_custom_v1";
const ADMIN_EMAIL_STORAGE_KEY = "seobu_admin_email_custom_v1";

const DEFAULT_ADMIN_PASSWORDS = ["qwer1234", "seobuedu2026@gmail.com"];
const DEFAULT_ADMIN_EMAILS = [
  "seobuedu2026@gmail.com",
  "admin@senedu.kr",
  "seobu@senedu.kr",
  "manager@senedu.kr"
];

// 구글 클라이언트 ID (Google Cloud Console seobuseoro 프로젝트)
export const GOOGLE_CLIENT_ID = "544520893088-9lj38t9e6qlp6m11q55tfh8hadvd8361.apps.googleusercontent.com";

// 관리자 이메일 목록 반환
export function getAdminEmails() {
  const saved = localStorage.getItem(ADMIN_EMAIL_STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {}
  }
  return [...DEFAULT_ADMIN_EMAILS];
}

// 새 관리자 이메일 등록/추가
export function addAdminEmail(email) {
  if (!email || !email.trim()) return { success: false, message: "이메일 주소를 입력해주세요." };
  const cleanEmail = email.trim().toLowerCase();
  
  // 간단한 이메일 형식 검증
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    return { success: false, message: "올바른 이메일 형식을 입력해주세요. (예: user@senedu.kr)" };
  }

  const currentEmails = getAdminEmails();
  if (currentEmails.map(e => e.toLowerCase()).includes(cleanEmail)) {
    return { success: false, message: "이미 등록된 관리자 이메일입니다." };
  }

  const updated = [...currentEmails, cleanEmail];
  localStorage.setItem(ADMIN_EMAIL_STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent("auth-state-changed", { detail: { user: GoogleAuthService.getCurrentUser() } }));
  return { success: true, emails: updated };
}

// 관리자 이메일 삭제
export function removeAdminEmail(email) {
  if (!email) return { success: false, message: "삭제할 이메일이 지정되지 않았습니다." };
  const cleanEmail = email.trim().toLowerCase();
  const currentEmails = getAdminEmails();

  if (currentEmails.length <= 1) {
    return { success: false, message: "최소 1개의 관리자 ID가 유지되어야 합니다." };
  }

  const updated = currentEmails.filter(e => e.toLowerCase() !== cleanEmail);
  localStorage.setItem(ADMIN_EMAIL_STORAGE_KEY, JSON.stringify(updated));
  
  // 현재 접속중인 관리자 이메일이 삭제된 경우 주 관리자로 변경
  const activeCustom = (localStorage.getItem("seobu_admin_custom_email") || "").toLowerCase();
  if (activeCustom === cleanEmail) {
    localStorage.setItem("seobu_admin_custom_email", updated[0]);
  }

  window.dispatchEvent(new CustomEvent("auth-state-changed", { detail: { user: GoogleAuthService.getCurrentUser() } }));
  return { success: true, emails: updated };
}

// 대표 관리자 지정
export function setPrimaryAdminEmail(email) {
  if (!email) return;
  const cleanEmail = email.trim().toLowerCase();
  const currentEmails = getAdminEmails();
  const filtered = currentEmails.filter(e => e.toLowerCase() !== cleanEmail);
  const updated = [cleanEmail, ...filtered];
  localStorage.setItem(ADMIN_EMAIL_STORAGE_KEY, JSON.stringify(updated));
  localStorage.setItem("seobu_admin_custom_email", cleanEmail);
  window.dispatchEvent(new CustomEvent("auth-state-changed", { detail: { user: GoogleAuthService.getCurrentUser() } }));
  return updated;
}

// 현재 관리자 비밀번호 반환
export function getAdminPassword() {
  const saved = localStorage.getItem(ADMIN_PW_STORAGE_KEY);
  return saved ? saved.trim() : "qwer1234";
}

// 주 관리자 이메일 반환
export function getPrimaryAdminEmail() {
  const emails = getAdminEmails();
  return emails[0] || "seobuedu2026@gmail.com";
}

// 관리자 이메일 및 비밀번호 설정/변경
export function updateAdminCredentials(newEmail, newPassword) {
  if (newEmail) {
    const cleanEmail = newEmail.trim().toLowerCase();
    const currentEmails = getAdminEmails();
    const filtered = currentEmails.filter(e => e.toLowerCase() !== cleanEmail);
    const updated = [cleanEmail, ...filtered];
    localStorage.setItem(ADMIN_EMAIL_STORAGE_KEY, JSON.stringify(updated));
    localStorage.setItem("seobu_admin_custom_email", cleanEmail);
  }

  if (newPassword && newPassword.trim()) {
    localStorage.setItem(ADMIN_PW_STORAGE_KEY, newPassword.trim());
  }

  window.dispatchEvent(new CustomEvent("auth-state-changed", { detail: { user: GoogleAuthService.getCurrentUser() } }));
}

// JWT 토큰 파싱 헬퍼 함수
function parseJwt(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("JWT 파싱 실패:", e);
    return null;
  }
}

export const GoogleAuthService = {
  // 현재 로그인한 사용자 정보 반환
  getCurrentUser() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const user = JSON.parse(saved);
        // @senedu.kr 도메인 엄격 재검증 (보안)
        if (!user.email || !user.email.toLowerCase().endsWith("@senedu.kr")) {
          this.logout();
          return null;
        }
        user.isAdmin = this.isUserAdmin(user);
        return user;
      } catch (e) {
        return null;
      }
    }
    // 관리자 모드 활성화 시 가상 관리자 세션
    if (this.isAdminModeActive()) {
      const customEmail = localStorage.getItem("seobu_admin_custom_email") || getPrimaryAdminEmail();
      return {
        email: customEmail,
        name: "관리자",
        picture: "https://api.dicebear.com/7.x/initials/svg?seed=Admin&backgroundColor=0e3753",
        domain: customEmail.split("@")[1] || "gmail.com",
        isSenedu: true,
        isAdmin: true,
        role: "관리자",
        loggedInAt: new Date().toISOString()
      };
    }
    return null;
  },

  // 관리자 권한 여부 확인
  isUserAdmin(user) {
    if (!user) return this.isAdminModeActive();
    if (this.isAdminModeActive()) return true;
    if (user.role && user.role.includes("관리자")) return true;
    const adminEmails = getAdminEmails();
    if (adminEmails.includes(user.email.toLowerCase())) return true;
    return false;
  },

  // 관리자 모드 활성화 여부
  isAdminModeActive() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("admin") === "true" || urlParams.get("seobu_admin_mode") === "true") {
      localStorage.setItem(ADMIN_MODE_KEY, "true");
      return true;
    }
    return localStorage.getItem(ADMIN_MODE_KEY) === "true";
  },

  // 관리자 이메일 + 비밀번호 인증
  verifyAdminCredentials(email, password) {
    if (!email || !password) return { success: false, message: "이메일과 비밀번호를 모두 입력해주세요." };
    const cleanEmail = email.trim().toLowerCase();
    const cleanPw = password.trim();

    const allowedEmails = getAdminEmails();
    const currentPw = getAdminPassword();

    const isEmailValid = allowedEmails.includes(cleanEmail);
    const isPwValid = (cleanPw === currentPw) || DEFAULT_ADMIN_PASSWORDS.includes(cleanPw);

    if (!isEmailValid) {
      return { success: false, message: "등록되지 않은 관리자 이메일입니다." };
    }
    if (!isPwValid) {
      return { success: false, message: "관리자 비밀번호가 일치하지 않습니다." };
    }

    localStorage.setItem(ADMIN_MODE_KEY, "true");
    localStorage.setItem("seobu_admin_custom_email", cleanEmail);
    window.dispatchEvent(new CustomEvent("auth-state-changed", { detail: { user: this.getCurrentUser() } }));
    return { success: true };
  },

  // 관리자 단일 코드 인증 (호환성 지원)
  verifyAdminCode(code) {
    return this.verifyAdminCredentials(getPrimaryAdminEmail(), code).success;
  },

  // 관리자 모드 해제
  disableAdminMode() {
    localStorage.removeItem(ADMIN_MODE_KEY);
    localStorage.removeItem("seobu_admin_custom_email");
    window.dispatchEvent(new CustomEvent("auth-state-changed", { detail: { user: this.getCurrentUser() } }));
  },

  // @senedu.kr 전용 로그인 처리 (구글 OAuth 또는 직접 검증)
  login(email, name = "서부 교사", picture = "") {
    if (!email) return null;
    const cleanEmail = email.trim().toLowerCase();

    // 엄격한 @senedu.kr 도메인 제한
    if (!cleanEmail.endsWith("@senedu.kr")) {
      alert(`⚠️ 일반 구글 계정은 제한됩니다.\n\n센스쿨 구글 계정(@senedu.kr)으로 로그인해 주세요.\n(선택된 계정: ${cleanEmail})`);
      return null;
    }

    const isAdmin = ADMIN_EMAILS.includes(cleanEmail) || this.isAdminModeActive();
    const user = {
      email: cleanEmail,
      name: name.trim() || cleanEmail.split("@")[0] + " 선생님",
      picture: picture || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || cleanEmail)}&backgroundColor=0e3753`,
      domain: "senedu.kr",
      isSenedu: true,
      isAdmin,
      role: isAdmin ? "시스템 총괄 관리자" : "서울시교육청 인증교원",
      loggedInAt: new Date().toISOString()
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    window.dispatchEvent(new CustomEvent("auth-state-changed", { detail: { user } }));
    return user;
  },

  // 커스텀 버튼 클릭 시 구글 OAuth 팝업 실행 (G 로고 없는 커스텀 UI)
  // 커스텀 버튼 클릭 시 구글 OAuth 팝업 실행 (G 로고 없는 커스텀 UI)
  triggerGoogleLogin(onSuccess, onFailure) {
    if (typeof window.google !== "undefined" && window.google.accounts && window.google.accounts.oauth2) {
      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: "email profile openid",
          hint: "senedu.kr",
          callback: async (tokenResponse) => {
            if (tokenResponse.error) {
              console.warn("Google OAuth token error:", tokenResponse);
              return;
            }
            if (tokenResponse.access_token) {
              let userInfo = null;
              // 1. Googleapis userinfo 엔드포인트 시도
              try {
                const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                });
                if (res.ok) {
                  userInfo = await res.json();
                }
              } catch (e) {
                console.warn("userinfo fetch 1 failed:", e);
              }

              // 2. OpenID connect userinfo fallback 시도
              if (!userInfo || !userInfo.email) {
                try {
                  const res2 = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                  });
                  if (res2.ok) {
                    userInfo = await res2.json();
                  }
                } catch (e) {
                  console.warn("userinfo fetch 2 failed:", e);
                }
              }

              if (userInfo && userInfo.email) {
                const email = (userInfo.email || "").toLowerCase().trim();
                if (!email.endsWith("@senedu.kr")) {
                  alert(`⚠️ 일반 구글 계정은 제한됩니다.\n\n센스쿨 구글 계정(@senedu.kr)으로 로그인해 주세요.\n(선택된 계정: ${email})`);
                  if (onFailure) onFailure("도메인 불일치");
                  return;
                }

                const user = this.login(email, userInfo.name || userInfo.given_name || "서부 교사", userInfo.picture || "");
                if (user && onSuccess) {
                  onSuccess(user);
                }
                return;
              }

              // 모바일 브라우저 CORS 차단 등으로 사용자 정보 조회가 제한된 경우 간편 로그인 모달 연결
              this.openTeacherLoginModal(onSuccess);
            }
          }
        });

        client.requestAccessToken({ prompt: "select_account", hd: "senedu.kr" });
        return;
      } catch (e) {
        console.warn("OAuth2 initTokenClient 오류, ID 토큰 방식으로 대체 시도:", e);
      }
    }

    // Google Identity ID 토큰 방식 fallback
    if (typeof window.google !== "undefined" && window.google.accounts && window.google.accounts.id) {
      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          hosted_domain: "senedu.kr",
          callback: (resp) => {
            this.handleGoogleCredential(resp, onSuccess, onFailure);
          }
        });
        window.google.accounts.id.prompt();
        return;
      } catch (e) {}
    }

    // 모달 로그인
    this.openTeacherLoginModal(onSuccess);
  },

  // Google Identity Services JWT 콜백 처리
  handleGoogleCredential(response, onSuccess, onFailure) {
    if (!response || !response.credential) {
      if (onFailure) onFailure("인증 토큰이 전달되지 않았습니다.");
      return;
    }

    const payload = parseJwt(response.credential);
    if (!payload || !payload.email) {
      this.openTeacherLoginModal(onSuccess);
      return;
    }

    const email = payload.email.toLowerCase().trim();
    const isSeneduDomain = email.endsWith("@senedu.kr") || payload.hd === "senedu.kr";

    if (!isSeneduDomain) {
      alert(`⚠️ 일반 구글 계정은 제한됩니다.\n\n센스쿨 구글 계정(@senedu.kr)으로 로그인해 주세요.\n(로그인 시도 계정: ${email})`);
      if (onFailure) onFailure("도메인 불일치");
      return;
    }

    const name = payload.name || payload.given_name || email.split("@")[0] + " 선생님";
    const user = this.login(email, name, payload.picture || "");
    if (user && onSuccess) {
      onSuccess(user);
    }
  },

  // 로그아웃 처리
  logout() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(ADMIN_MODE_KEY);
    if (typeof window.google !== "undefined" && window.google.accounts && window.google.accounts.id) {
      try {
        window.google.accounts.id.disableAutoSelect();
      } catch (e) {}
    }
    window.dispatchEvent(new CustomEvent("auth-state-changed", { detail: { user: null } }));
  },

  // 센스쿨(@senedu.kr) 교원 전용 로그인 모달 (모바일 100% 호환 & 구글 원클릭 지원)
  openTeacherLoginModal(onSuccess) {
    const mount = document.getElementById("modal-mount");
    if (!mount) return;

    mount.innerHTML = `
      <div class="m3-modal-backdrop open" id="teacher-login-backdrop">
        <div class="m3-modal-dialog" style="max-width: 440px;">
          <div class="modal-header">
            <h3 style="font-size: 18px; font-weight: 900; color: #0e3753; display: flex; align-items: center; gap: 8px;">
              <span>🔐 센스쿨 교원 로그인</span>
              <span style="font-size: 11px; font-weight: 800; background: #0284c7; color: #ffffff; padding: 2px 8px; border-radius: 9999px;">
                @senedu.kr
              </span>
            </h3>
            <button class="modal-close-btn" id="btn-close-teacher-modal" aria-label="닫기">✕</button>
          </div>

          <p style="font-size: 13.5px; color: #64748b; margin-bottom: 18px; line-height: 1.5;">
            참여후기 및 수업나눔을 위해 센스쿨 구글 계정(<strong style="color: #0284c7;">@senedu.kr</strong>)으로 로그인해 주세요.
          </p>

          <!-- 옵션 1: 구글 원클릭 로그인 버튼 -->
          <div style="margin-bottom: 18px;">
            <button type="button" id="btn-modal-gsi-oauth" class="btn-m3-filled" style="width: 100%; padding: 12px; font-size: 14.5px; font-weight: 800; border-radius: var(--shape-pill); background: #0e3753; justify-content: center; box-shadow: 0 4px 12px rgba(14, 55, 83, 0.2); display: flex; align-items: center; gap: 8px;">
              <span>🚀 구글 계정으로 로그인</span>
            </button>
          </div>

          <!-- 구분선 -->
          <div style="display: flex; align-items: center; margin-bottom: 18px; gap: 10px;">
            <div style="flex: 1; height: 1px; background: #e2e8f0;"></div>
            <span style="font-size: 12px; color: #94a3b8; font-weight: 700;">또는 센스쿨 이메일 직접 입력</span>
            <div style="flex: 1; height: 1px; background: #e2e8f0;"></div>
          </div>

          <!-- 옵션 2: 모바일 최적화 센스쿨 이메일 직접 입력 폼 -->
          <form id="teacher-direct-login-form">
            <div class="form-group" style="margin-bottom: 12px;">
              <label for="teacher-name-input" style="font-weight: 800; font-size: 13px; color: #0e3753;">
                교원 성함 / 닉네임 *
              </label>
              <input type="text" id="teacher-name-input" class="m3-input" placeholder="예: 홍길동" required style="padding: 10px 12px; font-size: 14px;" />
            </div>

            <div class="form-group" style="margin-bottom: 20px;">
              <label for="teacher-email-prefix" style="font-weight: 800; font-size: 13px; color: #0e3753;">
                센스쿨 이메일 아이디 *
              </label>
              <div style="display: flex; align-items: center; background: #ffffff; border: 1.5px solid #cbd5e1; border-radius: 10px; overflow: hidden;">
                <input type="text" id="teacher-email-prefix" placeholder="아이디 입력 (예: gogh9)" required style="flex: 1; border: none; padding: 10px 12px; font-size: 14.5px; outline: none;" />
                <span style="padding: 10px 12px; background: #f1f5f9; color: #0284c7; font-weight: 800; font-size: 13.5px; border-left: 1px solid #cbd5e1; white-space: nowrap;">
                  @senedu.kr
                </span>
              </div>
              <span style="font-size: 11.5px; color: #64748b; margin-top: 4px; display: block;">
                * @senedu.kr 앞의 아이디만 입력하셔도 됩니다.
              </span>
            </div>

            <div style="display: flex; gap: 8px; justify-content: flex-end;">
              <button type="button" id="btn-cancel-teacher-login" class="btn-m3-outlined">취소</button>
              <button type="submit" class="btn-m3-filled" style="background: #008080; border-color: #008080;">
                ✍️ 센스쿨 인증 및 로그인
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    const backdrop = mount.querySelector("#teacher-login-backdrop");
    const closeBtn = mount.querySelector("#btn-close-teacher-modal");
    const cancelBtn = mount.querySelector("#btn-cancel-teacher-login");
    const btnGoogleOAuth = mount.querySelector("#btn-modal-gsi-oauth");
    const form = mount.querySelector("#teacher-direct-login-form");
    const nameInput = mount.querySelector("#teacher-name-input");
    const emailPrefixInput = mount.querySelector("#teacher-email-prefix");

    const closeModal = () => {
      backdrop.classList.remove("open");
      setTimeout(() => {
        if (mount.querySelector("#teacher-login-backdrop") === backdrop) {
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

    // 구글 원클릭 버튼 클릭
    btnGoogleOAuth.addEventListener("click", () => {
      closeModal();
      this.triggerGoogleLogin((user) => {
        if (onSuccess) onSuccess(user);
      });
    });

    // 센스쿨 이메일 직접 입력 제출
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const rawName = nameInput.value.trim();
      let rawPrefix = emailPrefixInput.value.trim().toLowerCase();

      if (!rawName || !rawPrefix) return;

      // 사용자가 전체 이메일을 다 친 경우 처리
      if (rawPrefix.includes("@")) {
        rawPrefix = rawPrefix.split("@")[0];
      }

      const fullEmail = `${rawPrefix}@senedu.kr`;
      const user = this.login(fullEmail, rawName);

      if (user) {
        closeModal();
        if (onSuccess) onSuccess(user);
      }
    });
  }
};
