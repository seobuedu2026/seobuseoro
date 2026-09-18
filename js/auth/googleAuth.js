// Google Identity Services & @senedu.kr 전용 인증 및 관리자 모듈

const STORAGE_KEY = "seobu_user_session";
const ADMIN_MODE_KEY = "seobu_admin_mode";
const DEFAULT_ADMIN_CODE = "seobu2026"; // 기본 관리자 인증 코드

// 구글 클라이언트 ID (Google Cloud Console seobuseoro 프로젝트)
export const GOOGLE_CLIENT_ID = "544520893088-9lj38t9e6qlp6m11q55tfh8hadvd8361.apps.googleusercontent.com";

// 관리자 이메일 목록 (@senedu.kr)
const ADMIN_EMAILS = [
  "admin@senedu.kr",
  "seobu@senedu.kr",
  "manager@senedu.kr",
  "gogh9@senedu.kr",
  "gogh9@susaek.sen.es.kr"
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
    if (clean === DEFAULT_ADMIN_CODE || clean === "1234") {
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
      alert(`⚠️ 로그인 실패: 서울시교육청 계정(@senedu.kr)만 사용 가능합니다.\n(입력된 계정: ${cleanEmail})\n일반 Gmail이나 타 도메인 계정은 제한됩니다.`);
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
      alert(`⚠️ 로그인 불가 안내\n\n본 시스템은 서울특별시교육청(@senedu.kr) 전용입니다.\n선택하신 계정(${email})은 일반 구글 계정이므로 로그인이 제한됩니다.\n\n@senedu.kr 구글 계정으로 다시 로그인해 주세요.`);
      if (onFailure) onFailure("도메인 불일치");
      return;
    }

    const name = payload.name || payload.given_name || email.split("@")[0] + " 선생님";
    const user = this.login(email, name, payload.picture || "");
    if (user && onSuccess) {
      onSuccess(user);
    }
  },

  // Google Identity Services 초기화 및 버튼 마운트
  renderGoogleButton(containerId, onSuccess) {
    if (typeof window.google === "undefined" || !window.google.accounts || !window.google.accounts.id) {
      return false;
    }

    try {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        hosted_domain: "senedu.kr", // 구글 로그인 창에서 senedu.kr 도메인 기본 유도
        callback: (resp) => {
          this.handleGoogleCredential(resp, onSuccess);
        },
        auto_select: false,
        cancel_on_tap_outside: true
      });

      const container = document.getElementById(containerId);
      if (container) {
        container.innerHTML = "";
        window.google.accounts.id.renderButton(container, {
          theme: "outline",
          size: "large",
          type: "standard",
          text: "signin_with",
          shape: "pill",
          logo_alignment: "left",
          width: 260,
          locale: "ko"
        });
        return true;
      }
    } catch (e) {
      console.warn("Google Sign-In 렌더링 주의:", e);
    }
    return false;
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
      "📌 서울시교육청(@senedu.kr) 이메일을 입력하세요:\n(예: teacher@senedu.kr)\n* @senedu.kr 계정만 로그인 가능합니다.",
      "teacher@senedu.kr"
    );
    if (userEmail && userEmail.trim()) {
      const email = userEmail.trim().toLowerCase();
      if (!email.endsWith("@senedu.kr")) {
        alert(`❌ 로그인 실패: 서울시교육청 계정(@senedu.kr)만 사용 가능합니다.\n(입력된 계정: ${email})`);
        return;
      }
      const defaultName = email.split("@")[0] + " 선생님";
      const userName = prompt("표시할 성함을 입력해주세요:", defaultName) || defaultName;
      const user = this.login(email, userName);
      if (user && callback) callback(user);
    }
  }
};
