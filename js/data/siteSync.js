// 관리자가 수정한 사이트 콘텐츠를 클라우드(Firestore)와 동기화한다.
// localStorage는 첫 화면을 즉시 그리기 위한 캐시로만 쓰고,
// 실제 원본은 Firestore에 두어 기기·브라우저가 달라도 같은 내용이 보이게 한다.
import { FirestoreContentService } from "./firestoreService.js";

const SITE_DOC = "site_content";

// 클라우드와 공유할 localStorage 키 목록
export const SYNCED_KEYS = [
  "seobu_custom_events_v4",
  "seobu_padlet_rooms_custom_v1",
  "seobu_categories_v2",
  "seobu_active_months_v2",
  "seobu_overview_months_v2",
  "seobu_month_themes_v3",
  "seobu_selected_year_v1"
];

// 값이 지워진 상태(기본값 사용)를 나타내는 표식
const CLEARED = "";

function isAdminMode() {
  return localStorage.getItem("seobu_admin_mode") === "true";
}

// localStorage에 저장하고 클라우드에도 반영
export function persist(key, rawValue) {
  localStorage.setItem(key, rawValue);
  FirestoreContentService.save(SITE_DOC, { [key]: rawValue });
}

// localStorage에서 지우고 클라우드에도 '기본값으로 되돌림'을 반영
export function clearPersisted(key) {
  localStorage.removeItem(key);
  FirestoreContentService.save(SITE_DOC, { [key]: CLEARED });
}

// 클라우드에 아직 올라가지 않은 항목이 관리자 브라우저에 남아 있으면
// 한 번 올려서 그동안의 수정 작업을 보존한다.
// 문서 전체가 없는 경우뿐 아니라 일부 항목만 비어 있는 경우도 처리한다.
function seedFromLocal(remote) {
  if (!isAdminMode()) return;

  const payload = {};
  let hasAny = false;
  SYNCED_KEYS.forEach(key => {
    const alreadyInCloud = remote && typeof remote[key] === "string" && remote[key] !== CLEARED;
    if (alreadyInCloud) return;

    const local = localStorage.getItem(key);
    if (local) {
      payload[key] = local;
      hasAny = true;
    }
  });

  if (hasAny) {
    FirestoreContentService.save(SITE_DOC, payload);
  }
}

// 클라우드 구독 시작. 원격 내용이 바뀌면 캐시를 갱신하고 화면을 다시 그린다.
export function initSiteSync() {
  if (!FirestoreContentService.isAvailable()) return;

  let seeded = false;

  FirestoreContentService.subscribe(SITE_DOC, (data) => {
    if (!seeded) {
      seeded = true;
      seedFromLocal(data);
    }
    if (!data) return;

    let eventsChanged = false;
    let roomsChanged = false;

    SYNCED_KEYS.forEach(key => {
      const remote = data[key];
      if (typeof remote !== "string") return;

      const local = localStorage.getItem(key) || CLEARED;
      if (remote === local) return;

      if (remote === CLEARED) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, remote);
      }

      if (key === "seobu_padlet_rooms_custom_v1") {
        roomsChanged = true;
      } else {
        eventsChanged = true;
      }
    });

    if (eventsChanged) {
      window.dispatchEvent(new CustomEvent("events-updated"));
    }
    if (roomsChanged) {
      window.dispatchEvent(new CustomEvent("rooms-updated"));
    }
  });
}
