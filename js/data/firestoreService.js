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

export const FirestoreReviewService = {
  // 실시간 구독 (모든 기기/브라우저 실시간 동기화)
  subscribeReviews(onUpdate, onError) {
    if (!db) return () => {};

    try {
      const q = query(collection(db, REVIEWS_COLLECTION), orderBy("createdAt", "desc"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const reviews = [];
        snapshot.forEach((docSnap) => {
          reviews.push({ id: docSnap.id, ...docSnap.data() });
        });
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
  }
};
