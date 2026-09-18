// Google Identity Services & @senedu.kr 전용 인증 및 관리자 모듈

const STORAGE_KEY = "seobu_user_session";
const ADMIN_MODE_KEY = "seobu_admin_mode";
const ADMIN_PW_STORAGE_KEY = "seobu_admin_password_custom_v1";
const ADMIN_EMAIL_STORAGE_KEY = "seobu_admin_email_custom_v2"; // v2로 승격하여 기존 예시 ID 잔여물 완전 격리
const ADMIN_PASSWORDS_MAP_KEY = "seobu_admin_passwords_map_v1";

const DEFAULT_ADMIN_PASSWORDS = ["qwer1234", "seobuedu2026@gmail.com"];
// 오직 실 서비스용 기본 관리자 1개만 유지 (예시 더미 ID 전부 삭제)
const DEFAULT_ADMIN_EMAILS = ["seobuedu2026@gmail.com"];

// 구글 클라이언트 ID (Google Cloud Console seobuseoro 프로젝트)
export const GOOGLE_CLIENT_ID = "544520893088-9lj38t9e6qlp6m11q55tfh8hadvd8361.apps.googleusercontent.com";

// 관리자 계정별 비밀번호 맵 조회
export function getAdminPasswordMap() {
  const saved = localStorage.getItem(ADMIN_PASSWORDS_MAP_KEY);
  if (saved) {
    try {
      return JSON.parse(saved) || {};
    } catch (e) {
      return {};
    }
  }
  return {};
}

// 특정 관리자 이메일의 비밀번호 반환 (미설정 시 공통 관리자 비밀번호 반환)
export function getAdminPasswordForEmail(email) {
  if (!email) return getAdminPassword();
  const cleanEmail = email.trim().toLowerCase();
  const map = getAdminPasswordMap();
  if (map[cleanEmail] && map[cleanEmail].trim()) {
    return map[cleanEmail].trim();
  }
  return getAdminPassword();
}

// 특정 관리자 이메일의 비밀번호 설정
export function setAdminPasswordForEmail(email, newPassword) {
  if (!email || !newPassword || !newPassword.trim()) {
    return { success: false, message: "이메일과 새 비밀번호를 모두 입력해주세요." };
  }
  const cleanEmail = email.trim().toLowerCase();
  const cleanPw = newPassword.trim();
  
  if (cleanPw.length < 4) {
    return { success: false, message: "비밀번호는 최소 4자 이상이어야 합니다." };
  }

  const map = getAdminPasswordMap();
  map[cleanEmail] = cleanPw;
  localStorage.setItem(ADMIN_PASSWORDS_MAP_KEY, JSON.stringify(map));
  return { success: true };
}

// 더미/예시 아이디 목록 (삭제 대상 블랙리스트)
const DUMMY_EXAMPLE_EMAILS = [
  "admin@senedu.kr",
  "seobu@senedu.kr",
  "manager@senedu.kr",
  "gogh9@gmail.com",
  "gogh9@senedu.kr"
];

// 관리자 이메일 목록 반환 (저장된 목록 그대로 반환, 삭제된 항목이 되살아나지 않음)
export function getAdminEmails() {
  const saved = localStorage.getItem(ADMIN_EMAIL_STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // 더미 예시 이메일 필터링 및 고유화
        const cleanList = parsed
          .map(e => (typeof e === 'string' ? e.trim() : ''))
          .filter(e => e && !DUMMY_EXAMPLE_EMAILS.includes(e.toLowerCase()));

        if (cleanList.length > 0) {
          return cleanList;
        }
      }
    } catch (e) {}
  }

  // 저장된 내역이 없거나 초기화된 경우 기본 관리자만 저장 후 반환
  const initial = [...DEFAULT_ADMIN_EMAILS];
  localStorage.setItem(ADMIN_EMAIL_STORAGE_KEY, JSON.stringify(initial));
  return initial;
}

// 새 관리자 이메일 및 초기 비밀번호 등록/추가
export function addAdminEmail(email, initialPassword = "") {
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

  // 비밀번호가 지정된 경우 개별 비밀번호 저장
  if (initialPassword && initialPassword.trim()) {
    setAdminPasswordForEmail(cleanEmail, initialPassword.trim());
  }

  window.dispatchEvent(new CustomEvent("auth-state-changed", { detail: { user: GoogleAuthService.getCurrentUser() } }));
  return { success: true, emails: updated };
}

// 관리자 이메일 영구 삭제
export function removeAdminEmail(email) {
  if (!email) return { success: false, message: "삭제할 이메일이 지정되지 않았습니다." };
  const cleanEmail = email.trim().toLowerCase();
  const currentEmails = getAdminEmails();

  if (currentEmails.length <= 1) {
    return { success: false, message: "최소 1개의 관리자 ID가 유지되어야 합니다." };
  }

  const updated = currentEmails.filter(e => e.trim().toLowerCase() !== cleanEmail);
  localStorage.setItem(ADMIN_EMAIL_STORAGE_KEY, JSON.stringify(updated));
  
  // 비밀번호 맵에서도 완전히 제거
  const map = getAdminPasswordMap();
  if (map[cleanEmail]) {
    delete map[cleanEmail];
    localStorage.setItem(ADMIN_PASSWORDS_MAP_KEY, JSON.stringify(map));
  }

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
  const filtered = currentEmails.filter(e => e.trim().toLowerCase() !== cleanEmail);
  const updated = [cleanEmail, ...filtered];
  localStorage.setItem(ADMIN_EMAIL_STORAGE_KEY, JSON.stringify(updated));
  localStorage.setItem("seobu_admin_custom_email", cleanEmail);
  window.dispatchEvent(new CustomEvent("auth-state-changed", { detail: { user: GoogleAuthService.getCurrentUser() } }));
  return updated;
}

// 현재 공통 관리자 비밀번호 반환
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
    const filtered = currentEmails.filter(e => e.trim().toLowerCase() !== cleanEmail);
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
    const specificPw = getAdminPasswordForEmail(cleanEmail);
    const globalPw = getAdminPassword();

    const isPwValid = (cleanPw === specificPw) || (cleanPw === globalPw) || DEFAULT_ADMIN_PASSWORDS.includes(cleanPw);
    const isEmailValid = allowedEmails.map(e => e.toLowerCase()).includes(cleanEmail);

    if (!isPwValid) {
      return { success: false, message: "관리자 비밀번호(PW)가 일치하지 않습니다." };
    }

    // 관리자 비밀번호가 일치하면 해당 이메일을 관리자 목록에 자동 등록 및 허용
    if (!isEmailValid) {
      addAdminEmail(cleanEmail);
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

    const adminList = getAdminEmails().map(e => e.toLowerCase());
    const isAdmin = adminList.includes(cleanEmail) || this.isAdminModeActive();
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

  // 구글 OAuth 직접 리다이렉트 (모바일 Safari, 팝업 차단 환경 100% 호환)
  redirectToGoogleOAuth() {
    const origin = window.location.origin;
    const pathname = window.location.pathname.endsWith("/") ? window.location.pathname : window.location.pathname.substring(0, window.location.pathname.lastIndexOf("/") + 1);
    const redirectUri = `${origin}${pathname}`;
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token%20id_token&scope=email%20profile%20openid&hd=senedu.kr&prompt=select_account&nonce=${Date.now()}`;
    window.location.href = authUrl;
  },

  // 액세스 토큰으로 사용자 프로필 조회 및 로그인
  async fetchUserInfoAndLogin(accessToken, onSuccess, onFailure) {
    if (!accessToken) {
      if (onFailure) onFailure("인증 토큰이 없습니다.");
      return;
    }

    let userInfo = null;
    // 1. Googleapis userinfo 엔드포인트
    try {
      const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.ok) {
        userInfo = await res.json();
      }
    } catch (e) {
      console.warn("userinfo fetch 1 failed:", e);
    }

    // 2. OpenID Connect fallback
    if (!userInfo || !userInfo.email) {
      try {
        const res2 = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
          headers: { Authorization: `Bearer ${accessToken}` }
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
      return user;
    }

    if (onFailure) onFailure("사용자 정보를 불러올 수 없습니다.");
  },

  // 커스텀 버튼 클릭 시 구글 OAuth 로그인 실행
  triggerGoogleLogin(onSuccess, onFailure) {
    // 모바일/PC 브라우저 Google Identity Services OAuth 토큰 클라이언트
    if (typeof window.google !== "undefined" && window.google.accounts && window.google.accounts.oauth2) {
      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: "email profile openid",
          hint: "senedu.kr",
          callback: async (tokenResponse) => {
            if (tokenResponse.error) {
              console.warn("Google OAuth popup error:", tokenResponse.error);
              if (tokenResponse.error === "popup_closed_by_user" || tokenResponse.error === "access_denied") {
                return;
              }
              // 팝업 차단 또는 모바일 오류 시 리다이렉트 로그인으로 자동 전환
              this.redirectToGoogleOAuth();
              return;
            }
            if (tokenResponse.access_token) {
              await this.fetchUserInfoAndLogin(tokenResponse.access_token, onSuccess, onFailure);
            }
          }
        });

        client.requestAccessToken({ prompt: "select_account", hd: "senedu.kr" });
        return;
      } catch (e) {
        console.warn("OAuth2 initTokenClient 오류, 리다이렉트 로그인으로 진행:", e);
        this.redirectToGoogleOAuth();
        return;
      }
    }

    // Google 라이브러리가 지연 로딩되거나 모바일 팝업이 차단된 경우 구글 직접 리다이렉트
    this.redirectToGoogleOAuth();
  },

  // Google Identity Services JWT 콜백 처리
  handleGoogleCredential(response, onSuccess, onFailure) {
    if (!response || !response.credential) {
      if (onFailure) onFailure("인증 토큰이 전달되지 않았습니다.");
      return;
    }

    const payload = parseJwt(response.credential);
    if (!payload || !payload.email) {
      if (onFailure) onFailure("토큰 파싱 실패");
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
  }
};

// URL Hash에서 OAuth 리다이렉트 토큰 자동 감지 및 로그인 처리
export function checkOAuthRedirectResult() {
  const hash = window.location.hash;
  if (hash && (hash.includes("access_token=") || hash.includes("id_token="))) {
    try {
      const cleanHash = hash.startsWith("#") ? hash.substring(1) : hash;
      const params = new URLSearchParams(cleanHash);
      const accessToken = params.get("access_token");
      const idToken = params.get("id_token");

      // 주소창 hash 정리
      if (window.history && window.history.replaceState) {
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
      }

      if (idToken) {
        const payload = parseJwt(idToken);
        if (payload && payload.email) {
          const email = payload.email.toLowerCase().trim();
          if (email.endsWith("@senedu.kr") || payload.hd === "senedu.kr") {
            const name = payload.name || payload.given_name || email.split("@")[0] + " 선생님";
            GoogleAuthService.login(email, name, payload.picture || "");
            return;
          } else {
            alert(`⚠️ 일반 구글 계정은 제한됩니다.\n\n센스쿨 구글 계정(@senedu.kr)으로 로그인해 주세요.\n(로그인 시도 계정: ${email})`);
            return;
          }
        }
      }

      if (accessToken) {
        GoogleAuthService.fetchUserInfoAndLogin(accessToken);
      }
    } catch (e) {
      console.warn("OAuth redirect parse error:", e);
    }
  }
}

// 레거시 v1 저장소 잔여물 자동 정리
try {
  localStorage.removeItem("seobu_admin_email_custom_v1");
} catch (e) {}

// 스크립트 로드 시 즉시 URL OAuth 콜백 검사
checkOAuthRedirectResult();
