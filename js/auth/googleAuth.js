// Google Identity Services & @senedu.kr 전용 인증 및 관리자 모듈

const STORAGE_KEY = "seobu_user_session";
const ADMIN_MODE_KEY = "seobu_admin_mode";
const DEFAULT_ADMIN_CODE = "seobuedu2026@gmail.com"; // 관리자 인증 코드

// 구글 클라이언트 ID (Google Cloud Console seobuseoro 프로젝트)
export const GOOGLE_CLIENT_ID = "544520893088-9lj38t9e6qlp6m11q55tfh8hadvd8361.apps.googleusercontent.com";

// 관리자 이메일 목록 (@senedu.kr)
const ADMIN_EMAILS = [
  "admin@senedu.kr",
  "seobu@senedu.kr",
  "manager@senedu.kr",
  "gogh9@senedu.kr",
  "gogh9@susaek.sen.es.kr",
  "seobuedu2026@gmail.com"
];

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
      return {
        email: "admin@senedu.kr",
        name: "서부 관리자",
        picture: "https://api.dicebear.com/7.x/initials/svg?seed=Admin&backgroundColor=0e3753",
        domain: "senedu.kr",
        isSenedu: true,
        isAdmin: true,
        role: "시스템 총괄 관리자",
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
    if (ADMIN_EMAILS.includes(user.email.toLowerCase())) return true;
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

  // 관리자 모드 토글/인증
  verifyAdminCode(code) {
    if (!code) return false;
    const clean = code.trim();
    if (clean.toLowerCase() === DEFAULT_ADMIN_CODE.toLowerCase()) {
      localStorage.setItem(ADMIN_MODE_KEY, "true");
      window.dispatchEvent(new CustomEvent("auth-state-changed", { detail: { user: this.getCurrentUser() } }));
      return true;
    }
    return false;
  },

  // 관리자 모드 해제
  disableAdminMode() {
    localStorage.removeItem(ADMIN_MODE_KEY);
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
  triggerGoogleLogin(onSuccess, onFailure) {
    if (typeof window.google !== "undefined" && window.google.accounts && window.google.accounts.oauth2) {
      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: "email profile openid",
          hint: "senedu.kr",
          callback: async (tokenResponse) => {
            if (tokenResponse.error) {
              console.error("Google OAuth token error:", tokenResponse);
              return;
            }
            if (tokenResponse.access_token) {
              try {
                const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                });
                const data = await res.json();
                const email = (data.email || "").toLowerCase().trim();

                if (!email.endsWith("@senedu.kr")) {
                  alert(`⚠️ 일반 구글 계정은 제한됩니다.\n\n센스쿨 구글 계정(@senedu.kr)으로 로그인해 주세요.\n(로그인 시도 계정: ${email})`);
                  if (onFailure) onFailure("도메인 불일치");
                  return;
                }

                const user = this.login(email, data.name || data.given_name || "서부 교사", data.picture || "");
                if (user && onSuccess) {
                  onSuccess(user);
                }
              } catch (err) {
                console.error("사용자 정보 조회 실패:", err);
                alert("구글 사용자 정보를 불러오지 못했습니다.");
              }
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

    // 만약 라이브러리가 로드되지 않은 환경인 경우
    this.showLoginPrompt(onSuccess);
  },

  // Google Identity Services JWT 콜백 처리
  handleGoogleCredential(response, onSuccess, onFailure) {
    if (!response || !response.credential) {
      if (onFailure) onFailure("인증 토큰이 전달되지 않았습니다.");
      return;
    }

    const payload = parseJwt(response.credential);
    if (!payload || !payload.email) {
      alert("❌ 구글 사용자 정보를 불러오지 못했습니다.");
      if (onFailure) onFailure("사용자 정보 파싱 실패");
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

  // 직접 로그인 모달/프롬프트 (도메인 엄격 검증)
  showLoginPrompt(callback) {
    const userEmail = prompt(
      "📌 센스쿨 구글 계정(@senedu.kr)을 입력하세요:\n(예: teacher@senedu.kr)\n* 일반 구글 계정은 제한됩니다.",
      "teacher@senedu.kr"
    );
    if (userEmail && userEmail.trim()) {
      const email = userEmail.trim().toLowerCase();
      if (!email.endsWith("@senedu.kr")) {
        alert(`⚠️ 일반 구글 계정은 제한됩니다.\n\n센스쿨 구글 계정(@senedu.kr)으로 로그인해 주세요.\n(입력된 계정: ${email})`);
        return;
      }
      const defaultName = email.split("@")[0] + " 선생님";
      const userName = prompt("표시할 성함을 입력해주세요:", defaultName) || defaultName;
      const user = this.login(email, userName);
      if (user && callback) callback(user);
    }
  }
};
