// Google & @senedu.kr 인증 및 관리자(Admin) 권한 관리 모듈

const STORAGE_KEY = "seobu_user_session";
const ADMIN_MODE_KEY = "seobu_admin_mode";
const DEFAULT_ADMIN_CODE = "seobu2026"; // 기본 관리자 인증 코드

// 관리자 이메일 목록
const ADMIN_EMAILS = [
  "admin@senedu.kr",
  "seobu@senedu.kr",
  "manager@senedu.kr"
];

export const GoogleAuthService = {
  // 현재 로그인한 사용자 정보 반환
  getCurrentUser() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const user = JSON.parse(saved);
        user.isAdmin = this.isUserAdmin(user);
        return user;
      } catch (e) {
        return null;
      }
    }
    // 로그인하지 않아도 관리자 모드가 활성화되어 있는지 확인
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
    // URL 파라미터(?admin=true 또는 ?seobu_admin_mode=true) 확인
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

  // 로그인 처리 (구글 또는 senedu.kr 계정)
  login(email = "teacher@senedu.kr", name = "서부 교사", picture = "") {
    const isSenedu = email.endsWith("@senedu.kr");
    const isAdmin = ADMIN_EMAILS.includes(email.toLowerCase()) || this.isAdminModeActive();
    
    const user = {
      email,
      name,
      picture: picture || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=0e3753`,
      domain: isSenedu ? "senedu.kr" : "gmail.com",
      isSenedu,
      isAdmin,
      role: isAdmin ? "시스템 총괄 관리자" : (isSenedu ? "서울시교육청 인증교원" : "일반 구글 사용자"),
      loggedInAt: new Date().toISOString()
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    window.dispatchEvent(new CustomEvent("auth-state-changed", { detail: { user } }));
    return user;
  },

  // 로그아웃 처리
  logout() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(ADMIN_MODE_KEY);
    window.dispatchEvent(new CustomEvent("auth-state-changed", { detail: { user: null } }));
  },

  // 구글 로그인 팝업 대화상자 열기
  showLoginPrompt(callback) {
    const defaultEmail = "teacher@senedu.kr";
    const userEmail = prompt(
      "구글 계정 또는 서울시교육청(@senedu.kr) 이메일을 입력하세요:\n(관리자 계정 테스트: admin@senedu.kr)",
      defaultEmail
    );
    if (userEmail && userEmail.trim()) {
      const email = userEmail.trim();
      const defaultName = email.includes("@") ? email.split("@")[0] + " 선생님" : "서부 교사";
      const userName = prompt("표시할 이름을 입력해주세요:", defaultName) || defaultName;
      const user = this.login(email, userName);
      if (callback) callback(user);
    }
  },

  // 관리자 인증 대화상자 열기
  promptAdminVerification(callback) {
    const code = prompt("관리자 인증 코드를 입력하세요:\n(초기 기본 비밀번호: seobu2026 또는 1234)");
    if (code !== null) {
      const success = this.verifyAdminCode(code);
      if (success) {
        alert("✅ 관리자 권한이 성공적으로 인증되었습니다!\n이제 엑셀 파일을 업로드하여 행사를 추가할 수 있습니다.");
        if (callback) callback(true);
      } else {
        alert("❌ 인증 코드가 일치하지 않습니다.");
        if (callback) callback(false);
      }
    }
  }
};
