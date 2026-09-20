// Firebase Firestore Cloud Real-time Database Service
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  updateDoc, 
  query, 
  orderBy, 
  onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const FIREBASE_CONFIG = {
  projectId: "seobuseoro",
  appId: "1:544520893088:web:98433834094a7c11b8cfc5",
  storageBucket: "seobuseoro.firebasestorage.app",
  apiKey: "AIzaSyBazGp976rivd9tc5iQ1Jcsdz-p1uJh8I0",
  authDomain: "seobuseoro.firebaseapp.com",
  messagingSenderId: "544520893088",
  projectNumber: "544520893088"
};

let db = null;
let isFirestoreAvailable = false;

try {
  const app = initializeApp(FIREBASE_CONFIG, "seobuseoro_app");
  db = getFirestore(app);
  isFirestoreAvailable = true;
} catch (e) {
  console.warn("Firebase Firestore 초기화 중 알림:", e);
}

const REVIEWS_COLLECTION = "reviews";
const CONTENT_COLLECTION = "settings";
const CONSENTS_COLLECTION = "consents";

// 개인정보 수집·이용 동의 기록 보관
export const FirestoreConsentService = {
  // 이메일을 문서 ID로 쓸 수 있게 변환 ('/' 등 사용 불가 문자 제거)
  toDocId(email) {
    return String(email || "").trim().toLowerCase().replace(/[^a-z0-9._-]/g, "_");
  },

  async saveConsent(email, record) {
    if (!db || !email) return false;
    try {
      const ref = doc(db, CONSENTS_COLLECTION, this.toDocId(email));
      await setDoc(ref, { email, ...record }, { merge: true });
      return true;
    } catch (e) {
      console.warn("동의 기록 저장 오류:", e);
      return false;
    }
  }
};

// 관리자가 수정하는 사이트 콘텐츠를 클라우드에 보관하여
// 브라우저/기기가 달라도 동일한 내용이 보이도록 한다.
export const FirestoreContentService = {
  isAvailable() {
    return !!db;
  },

  // 콘텐츠 문서 실시간 구독
  subscribe(docId, onUpdate) {
    if (!db) return () => {};
    try {
      const ref = doc(db, CONTENT_COLLECTION, docId);
      return onSnapshot(ref, (snap) => {
        if (!snap.exists()) {
          if (onUpdate) onUpdate(null);
          return;
        }
        if (onUpdate) onUpdate(snap.data() || null);
      }, (err) => {
        console.warn(`Firestore 콘텐츠(${docId}) 리스너 알림:`, err);
      });
    } catch (e) {
      console.warn(`Firestore 콘텐츠(${docId}) 구독 실패:`, e);
      return () => {};
    }
  },

  // 콘텐츠 문서 저장
  async save(docId, payload) {
    if (!db) return false;
    try {
      const ref = doc(db, CONTENT_COLLECTION, docId);
      await setDoc(ref, { ...payload, updatedAt: new Date().toISOString() }, { merge: true });
      return true;
    } catch (e) {
      console.warn(`Firestore 콘텐츠(${docId}) 저장 오류:`, e);
      return false;
    }
  }
};

export const FirestoreReviewService = {
  // 실시간 구독 (모든 기기/브라우저 실시간 동기화)
  subscribeReviews(onUpdate, onError) {
    if (!db) return () => {};

    try {
      const colRef = collection(db, REVIEWS_COLLECTION);
      const unsubscribe = onSnapshot(colRef, (snapshot) => {
        const reviews = [];
        snapshot.forEach((docSnap) => {
          reviews.push({ id: docSnap.id, ...docSnap.data() });
        });
        reviews.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
        if (onUpdate) onUpdate(reviews);
      }, (err) => {
        console.warn("Firestore 실시간 리스너 오류 (로컬 모드 유지):", err);
        if (onError) onError(err);
      });
      return unsubscribe;
    } catch (err) {
      console.warn("Firestore 구독 실패:", err);
      return () => {};
    }
  },

  // 후기 등록 (클라우드 DB에 영구 저장)
  async saveReview(review) {
    if (!db) return false;
    try {
      const revDoc = doc(db, REVIEWS_COLLECTION, review.id);
      await setDoc(revDoc, {
        ...review,
        updatedAt: new Date().toISOString()
      });
      return true;
    } catch (e) {
      console.warn("Firestore 후기 저장 오류:", e);
      return false;
    }
  },

  // 후기 승인/승인취소 상태 갱신
  async updateReviewStatus(reviewId, status) {
    if (!db) return false;
    try {
      const revDoc = doc(db, REVIEWS_COLLECTION, reviewId);
      await updateDoc(revDoc, { status, updatedAt: new Date().toISOString() });
      return true;
    } catch (e) {
      console.warn("Firestore 상태 변경 오류:", e);
      return false;
    }
  },

  // 후기 공감수 갱신
  async updateReviewLikes(reviewId, likes) {
    if (!db) return false;
    try {
      const revDoc = doc(db, REVIEWS_COLLECTION, reviewId);
      await updateDoc(revDoc, { likes, updatedAt: new Date().toISOString() });
      return true;
    } catch (e) {
      console.warn("Firestore 공감 갱신 오류:", e);
      return false;
    }
  },

  // 후기 내용 수정 (status가 주어지면 status도 함께 갱신)
  async updateReviewContent(reviewId, content, status = null) {
    if (!db) return false;
    try {
      const revDoc = doc(db, REVIEWS_COLLECTION, reviewId);
      const updateData = { content, updatedAt: new Date().toISOString() };
      if (status) {
        updateData.status = status;
      }
      await updateDoc(revDoc, updateData);
      return true;
    } catch (e) {
      console.warn("Firestore 내용 수정 오류:", e);
      return false;
    }
  },

  // 후기 영구 삭제
  async deleteReview(reviewId) {
    if (!db) return false;
    try {
      const revDoc = doc(db, REVIEWS_COLLECTION, reviewId);
      await deleteDoc(revDoc);
      return true;
    } catch (e) {
      console.warn("Firestore 후기 삭제 오류:", e);
      return false;
    }
  },

  // 후기 작성 방식 설정 조회
  getReviewAuthMode() {
    return localStorage.getItem("seobu_review_auth_mode") || "login_required"; // 'login_required' | 'anonymous_allowed'
  },

  // 후기 작성 방식 설정 저장
  async saveReviewAuthMode(mode) {
    localStorage.setItem("seobu_review_auth_mode", mode);
    window.dispatchEvent(new CustomEvent("review-auth-mode-changed", { detail: { mode } }));
    if (!db) return;
    try {
      const settingDoc = doc(db, "settings", "review_config");
      await setDoc(settingDoc, { authMode: mode, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (e) {
      console.warn("Firestore 설정 저장 오류:", e);
    }
  },

  // 후기 작성 방식 설정 실시간 구독
  subscribeReviewAuthMode(callback) {
    if (!db) return () => {};
    try {
      const settingDoc = doc(db, "settings", "review_config");
      const unsubscribe = onSnapshot(settingDoc, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data && data.authMode) {
            localStorage.setItem("seobu_review_auth_mode", data.authMode);
            if (callback) callback(data.authMode);
          }
        }
      }, (err) => {
        console.warn("Firestore 설정 리스너 알림:", err);
      });
      return unsubscribe;
    } catch (e) {
      return () => {};
    }
  }
};
