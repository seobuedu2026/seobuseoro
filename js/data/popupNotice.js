/**
 * 팝업 공지사항(Notice Popup) 데이터 및 설정 관리 모듈
 * - 인쇄물 일정 변경 내용 및 현재 모집 중인 연수/워크숍 안내
 * - 관리자 모드에서 실시간 수정 및 Firestore 클라우드 동기화 지원
 */
import { persist, clearPersisted } from "./siteSync.js";

export const STORAGE_KEY_POPUP_NOTICE = "seobu_popup_notice_v1";
export const STORAGE_KEY_POPUP_HIDE_UNTIL = "seobu_popup_hide_until";

// 기본 팝업 공지 데이터
export const DEFAULT_POPUP_NOTICE = {
  enabled: true,
  badge: "중요 공지",
  title: "2026학년도 2학기 서부서로 수업성장 안내",
  subtitle: "인쇄물 일정 변경 사항 및 현재 모집 중인 연수·워크숍을 안내해 드립니다.",
  
  // 1. 인쇄물 일정 변경 안내 섹션
  scheduleChangeSection: {
    enabled: true,
    badge: "일정 변경 안내",
    title: "📋 인쇄물(포스터) 대비 일정 변경 사항 안내",
    description: "기존에 학교로 배포된 인쇄물(포스터/리플릿) 이후 변경 및 확정된 행사 일정입니다. 웹 캘린더에서 최신 일정을 확인해 주세요.",
    items: [
      {
        title: "수다박스 연수 (학적업무 첫걸음)",
        original: "인쇄물: 9월 중 예정",
        updated: "변경: 9월 10일(목) 15:20 녹번초 확정",
        note: "신청 접수 중"
      },
      {
        title: "AI·에듀테크 기반 수업나눔 워크숍",
        original: "인쇄물: 10월 3주차",
        updated: "변경: 10월 15일(목) 15:00 서부교육지원청 대강당",
        note: "세부 프로그램 확정"
      },
      {
        title: "수업성장 나눔 한마당",
        original: "인쇄물: 11월 예정",
        updated: "변경: 11월 12일(목) ~ 11월 13일(금) 온라인/오프라인 병행",
        note: "참여 신청 링크 오픈"
      }
    ]
  },

  // 2. 현재 모집 중인 연수/워크숍 안내 섹션
  recruitingSection: {
    enabled: true,
    badge: "모집 중",
    title: "🔥 현재 신청 접수 중인 연수 & 워크숍",
    description: "서부 관내 교원을 위한 맞춤형 성장 연수의 신청이 진행 중입니다. 마감 전 신청해 보세요!",
    items: [
      {
        id: "ev-0904",
        name: "과학실무사 연수 (실험역량 강화)",
        date: "2026. 9. 4.(금) / 9. 8.(화) 14:00~",
        location: "서부과학교육센터 실험실",
        target: "관내 초·중·고 과학실무사",
        status: "모집중",
        link: "https://senedu.kr/apply/ev0904"
      },
      {
        id: "ev-0910",
        name: "수다박스 연수 (학적업무 첫걸음)",
        date: "2026. 9. 10.(목) 15:20 ~ 17:00",
        location: "녹번초등학교",
        target: "관내 교무·연구부장 및 희망교원",
        status: "모집중",
        link: "https://senedu.kr/apply/ev0910"
      }
    ]
  },

  // 하단 강조 문구 및 탭 이동 안내
  footerNotice: "※ 세부 일정, 장소 및 온라인 신청은 상단 [캘린더] 또는 [프로그램] 탭에서 확인하실 수 있습니다.",
  primaryButtonText: "📋 전체 프로그램 보러가기",
  primaryButtonTab: "programs"
};

/**
 * 팝업 공지 데이터 불러오기
 */
export function getPopupNoticeConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_POPUP_NOTICE);
    if (!raw) return JSON.parse(JSON.stringify(DEFAULT_POPUP_NOTICE));
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_POPUP_NOTICE,
      ...parsed,
      scheduleChangeSection: {
        ...DEFAULT_POPUP_NOTICE.scheduleChangeSection,
        ...(parsed.scheduleChangeSection || {})
      },
      recruitingSection: {
        ...DEFAULT_POPUP_NOTICE.recruitingSection,
        ...(parsed.recruitingSection || {})
      }
    };
  } catch (e) {
    console.error("Failed to parse popup notice config:", e);
    return JSON.parse(JSON.stringify(DEFAULT_POPUP_NOTICE));
  }
}

/**
 * 팝업 공지 데이터 저장하기 (localStorage + Firestore 클라우드 동기화)
 */
export function savePopupNoticeConfig(config) {
  const jsonStr = JSON.stringify(config);
  persist(STORAGE_KEY_POPUP_NOTICE, jsonStr);
  window.dispatchEvent(new CustomEvent("popup-notice-updated", { detail: config }));
}

/**
 * 팝업 공지 기본값으로 초기화
 */
export function resetPopupNoticeConfig() {
  clearPersisted(STORAGE_KEY_POPUP_NOTICE);
  window.dispatchEvent(new CustomEvent("popup-notice-updated", { detail: DEFAULT_POPUP_NOTICE }));
}

/**
 * 오늘 하루 보지 않기 여부 체크
 */
export function isPopupHiddenToday() {
  const hideUntil = localStorage.getItem(STORAGE_KEY_POPUP_HIDE_UNTIL);
  if (!hideUntil) return false;
  const now = Date.now();
  if (now < parseInt(hideUntil, 10)) {
    return true;
  }
  localStorage.removeItem(STORAGE_KEY_POPUP_HIDE_UNTIL);
  return false;
}

/**
 * 오늘 하루 보지 않기 설정 (내일 0시까지 숨김)
 */
export function setPopupHideToday() {
  const tomorrowMidnight = new Date();
  tomorrowMidnight.setHours(24, 0, 0, 0);
  localStorage.setItem(STORAGE_KEY_POPUP_HIDE_UNTIL, tomorrowMidnight.getTime().toString());
}
