// 개인정보 수집·이용 동의 상태 관리
import { FirestoreConsentService } from "./firestoreService.js";

const CONSENT_KEY = "seobu_privacy_consent_v1";

// 처리방침이 개정되면 이 값을 올려 재동의를 받는다.
export const PRIVACY_POLICY_VERSION = "2026-09-21";

function readAll() {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return (parsed && typeof parsed === "object") ? parsed : {};
  } catch (e) {
    return {};
  }
}

function normalize(email) {
  return String(email || "").trim().toLowerCase();
}

// 해당 계정이 현재 처리방침에 동의했는지 확인
export function hasConsented(email) {
  const key = normalize(email);
  if (!key) return false;
  const rec = readAll()[key];
  return !!(rec && rec.agreed && rec.version === PRIVACY_POLICY_VERSION);
}

// 동의 기록 저장 (로컬 + 클라우드)
export function saveConsent(email) {
  const key = normalize(email);
  if (!key) return false;

  const record = {
    agreed: true,
    version: PRIVACY_POLICY_VERSION,
    agreedAt: new Date().toISOString()
  };

  const all = readAll();
  all[key] = record;
  localStorage.setItem(CONSENT_KEY, JSON.stringify(all));

  FirestoreConsentService.saveConsent(key, record);
  window.dispatchEvent(new CustomEvent("consent-changed", { detail: { email: key, agreed: true } }));
  return true;
}

// 동의 철회 (개인정보 보호법상 정보주체의 권리)
export function revokeConsent(email) {
  const key = normalize(email);
  if (!key) return false;

  const all = readAll();
  delete all[key];
  localStorage.setItem(CONSENT_KEY, JSON.stringify(all));

  FirestoreConsentService.saveConsent(key, {
    agreed: false,
    version: PRIVACY_POLICY_VERSION,
    revokedAt: new Date().toISOString()
  });
  window.dispatchEvent(new CustomEvent("consent-changed", { detail: { email: key, agreed: false } }));
  return true;
}
