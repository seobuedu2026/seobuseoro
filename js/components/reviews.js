import { getEvents, isEventPastOrToday } from "../data/events.js";
import { GoogleAuthService } from "../auth/googleAuth.js";
import { FirestoreReviewService } from "../data/firestoreService.js";
import { renderParticipationStories, bindParticipationStories } from "./participationStories.js";
import { openPrivacyConsentModal } from "./privacyConsentModal.js";
import { hasConsented } from "../data/consent.js";

const REVIEWS_STORAGE_KEY = "seobu_user_reviews_v8";
const MY_REVIEWS_STORAGE_KEY = "seobu_my_review_ids_v1";
const EXCLUDED_IDS = new Set(["rev-1", "rev-2", "rev-3", "rev-4"]);

const INITIAL_REVIEWS = [];

function getMyReviewIds() {
  try {
    return JSON.parse(localStorage.getItem(MY_REVIEWS_STORAGE_KEY)) || [];
  } catch (e) {
    return [];
  }
}

// 이미 공감한 후기 목록 (중복 공감 방지)
const LIKED_REVIEWS_STORAGE_KEY = "seobu_liked_review_ids_v1";

function getLikedReviewIds() {
  try {
    const list = JSON.parse(localStorage.getItem(LIKED_REVIEWS_STORAGE_KEY));
    return Array.isArray(list) ? list : [];
  } catch (e) {
    return [];
  }
}

function setLikedReviewIds(ids) {
  try {
    localStorage.setItem(LIKED_REVIEWS_STORAGE_KEY, JSON.stringify(ids));
  } catch (e) {
    // 저장 실패해도 화면 동작에는 영향 없음
  }
}

function addMyReviewId(id) {
  const ids = getMyReviewIds();
  if (!ids.includes(id)) {
    ids.push(id);
    localStorage.setItem(MY_REVIEWS_STORAGE_KEY, JSON.stringify(ids));
  }
}

function getStoredReviews() {
  let data = localStorage.getItem(REVIEWS_STORAGE_KEY);
  
  if (!data) {
    const v7Data = localStorage.getItem("seobu_user_reviews_v7");
    if (v7Data) {
      try {
        const parsedV7 = JSON.parse(v7Data);
        if (Array.isArray(parsedV7)) {
          const migrated = parsedV7.filter(r => !EXCLUDED_IDS.has(r.id));
          localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(migrated));
          data = JSON.stringify(migrated);
        }
      } catch (e) {}
    }
  }

  if (!data) {
    localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify([]));
    return [];
  }

  try {
    const list = JSON.parse(data);
    if (Array.isArray(list)) {
      return list
        .filter(r => !EXCLUDED_IDS.has(r.id))
        .map(r => ({
          ...r,
          userName: (r.userName === "김형찬" || r.userName === "김*찬") ? "김세찬" : (r.userName || "").replace(/\s*(교사|실무사|선생님)$/, "").trim(),
          status: r.status === "pending" ? "pending" : "approved"
        }));
    }
    return [];
  } catch (e) {
    return [];
  }
}

function saveReviews(reviews, shouldDispatch = true) {
  const cleanList = reviews.filter(r => !EXCLUDED_IDS.has(r.id));
  localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(cleanList));
  if (shouldDispatch) {
    window.dispatchEvent(new CustomEvent("reviews-updated", { detail: { reviews: cleanList } }));
  }
}

let selectedRating = 5;

// 후기 목록 보기 설정 (이 브라우저에만 저장)
const REVIEW_VIEW_PREF_KEY = "seobu_reviews_view_pref_v1";

const REVIEW_SORT_OPTIONS = [
  { key: "recent", label: "최신순" },
  { key: "oldest", label: "오래된순" },
  { key: "likes", label: "공감 많은순" }
];

let reviewSort = (() => {
  try {
    const saved = localStorage.getItem(REVIEW_VIEW_PREF_KEY);
    return REVIEW_SORT_OPTIONS.some(o => o.key === saved) ? saved : "recent";
  } catch (e) {
    return "recent";
  }
})();

let reviewEventFilter = "all";

function sortReviews(list) {
  const copy = [...list];
  switch (reviewSort) {
    case "oldest":
      return copy.sort((a, b) => String(a.createdAt || "").localeCompare(String(b.createdAt || "")));
    case "likes":
      return copy.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    default:
      return copy.sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
  }
}

// Firestore 설정 및 후기 실시간 동기화 리스너 전역 등록
if (typeof window !== "undefined") {
  // 초기 샘플 더미 후기 Firestore 완전 제거
  EXCLUDED_IDS.forEach(id => FirestoreReviewService.deleteReview(id));

  if (!window._firestoreConfigSubscribed) {
    window._firestoreConfigSubscribed = true;
    FirestoreReviewService.subscribeReviewAuthMode((mode) => {
      const activeContainer = document.querySelector("#tab-content-mount");
      if (activeContainer && activeContainer.querySelector(".reviews-view-wrapper")) {
        renderReviews(activeContainer);
      }
    });
  }

  if (!window._firestoreReviewsSubscribed) {
    window._firestoreReviewsSubscribed = true;
    FirestoreReviewService.subscribeReviews((remoteReviews) => {
      if (Array.isArray(remoteReviews)) {
        const cleanRemote = remoteReviews
          .filter(r => !EXCLUDED_IDS.has(r.id))
          .map(r => ({
            ...r,
            userName: (r.userName === "김형찬" || r.userName === "김*찬") ? "김세찬" : (r.userName || "").replace(/\s*(교사|실무사|선생님)$/, "").trim(),
            status: r.status === "pending" ? "pending" : "approved"
          }));

        saveReviews(cleanRemote, false);

        const activeContainer = document.querySelector("#tab-content-mount");
        if (activeContainer && activeContainer.querySelector(".reviews-view-wrapper")) {
          renderReviews(activeContainer);
        }
      }
    });
  }
}

/**
 * 작성자 성함 표시 포맷팅 (관리자가 아닌 경우 첫 글자만 표시하고 나머지는 * 처리)
 * 예: 김세찬 -> 김**, 홍길동 -> 홍**, 이산 -> 이*
 */
function formatAuthorDisplayName(rawName, isAdmin) {
  const clean = (rawName || "서부 교원").replace(/\s*(교사|실무사|선생님)$/, "").trim();
  if (isAdmin) {
    return clean;
  }
  if (!clean) return "익명";
  if (clean.length <= 1) return clean;
  return clean[0] + "*".repeat(clean.length - 1);
}

export function renderReviews(container, preselectedEventId = null, page = 1) {
  const user = GoogleAuthService.getCurrentUser();
  const isAdmin = !!(user && user.isAdmin);
  const authMode = FirestoreReviewService.getReviewAuthMode(); // 'login_required' | 'anonymous_allowed'
  const allReviews = getStoredReviews();
  const myReviewIds = getMyReviewIds();
  const likedReviewIds = getLikedReviewIds();

  // 일반 사용자에게는 승인된 후기 + 본인이 작성하여 승인 대기 중인 후기 노출
  const displayedReviews = isAdmin 
    ? allReviews 
    : allReviews.filter(r => {
        if (r.status === "approved") return true;
        const isMyReview = myReviewIds.includes(r.id) || (user && user.email && r.userEmail && user.email.toLowerCase() === r.userEmail.toLowerCase());
        return isMyReview;
      });

  // 행사별 필터에 쓸 목록 (후기가 있는 행사만)
  const eventOptions = [];
  const seenEventIds = new Set();
  displayedReviews.forEach(r => {
    if (r.eventId && !seenEventIds.has(r.eventId)) {
      seenEventIds.add(r.eventId);
      eventOptions.push({ id: r.eventId, title: (r.eventTitle || "서부 교육 프로그램").replace(/^🎯\s*/, "") });
    }
  });
  if (reviewEventFilter !== "all" && !seenEventIds.has(reviewEventFilter)) {
    reviewEventFilter = "all";
  }

  const visibleReviews = sortReviews(
    reviewEventFilter === "all"
      ? displayedReviews
      : displayedReviews.filter(r => r.eventId === reviewEventFilter)
  );

  // 페이지네이션: 한 페이지당 10개씩 표시
  const REVIEWS_PER_PAGE = 10;
  const totalReviews = visibleReviews.length;
  const totalPages = Math.ceil(totalReviews / REVIEWS_PER_PAGE) || 1;
  let currentPage = Math.min(Math.max(1, page), totalPages);
  const startIndex = (currentPage - 1) * REVIEWS_PER_PAGE;
  const pagedReviews = visibleReviews.slice(startIndex, startIndex + REVIEWS_PER_PAGE);

  container.innerHTML = `
    <div class="reviews-view-wrapper">
      <div class="tab-header-single-line" style="margin-bottom: 24px;">
        <h2 class="tab-header-title">참여후기</h2>
        <p class="tab-header-desc">행사에 참여하신 선생님들의 생생한 후기와 교실 수업 적용 사례를 자유롭게 공유해주세요.</p>
      </div>

      ${renderParticipationStories()}

      <div class="review-layout">
        <!-- 후기 작성 영역 (@senedu.kr 전용 로그인 또는 비로그인 모드) -->
        <div class="review-form-card">
          <div style="text-align: center; margin-bottom: 14px; padding-bottom: 8px; border-bottom: 1px solid #f1f5f9;">
            <h3 style="font-size: 16.5px; font-weight: 900; color: #0e3753; margin: 0; text-align: center;">
              참여 후기 등록
            </h3>
          </div>

          ${isAdmin ? `
            <div style="background-color: #f8fafc; border: 1.5px solid #0e3753; border-radius: 12px; padding: 14px; text-align: left;">
              <div style="margin-bottom: 10px; padding-bottom: 6px; border-bottom: 1px solid #e2e8f0;">
                <div style="font-size: 14px; font-weight: 800; color: #0e3753; display: flex; align-items: center; gap: 6px;">
                  ⚙️ <span>후기 작성 방식 설정</span>
                </div>
              </div>

              <div style="background: #ffffff; border: 1.5px solid #cbd5e1; border-radius: 8px; padding: 10px 12px; display: flex; flex-direction: column; gap: 10px;">
                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 13.5px; font-weight: 700; color: #0e3753;">
                  <input type="radio" name="review-auth-mode-radio" value="login_required" ${authMode === 'login_required' ? 'checked' : ''} style="cursor: pointer;" />
                  <span>🔒 센스쿨 로그인 필수</span>
                </label>

                <div style="height: 1px; background: #f1f5f9;"></div>

                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 13.5px; font-weight: 700; color: #0e3753;">
                  <input type="radio" name="review-auth-mode-radio" value="anonymous_allowed" ${authMode === 'anonymous_allowed' ? 'checked' : ''} style="cursor: pointer;" />
                  <span>🔓 로그인 없이 작성 허용</span>
                </label>
              </div>
            </div>
          ` : (!user && authMode === 'login_required') ? `
            <div style="background-color: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 18px 12px; text-align: center;">
              <p style="font-size: 14px; font-weight: 800; color: #0e3753; margin-bottom: 6px; line-height: 1.45;">
                후기 작성은 교원 로그인 후 가능합니다.
              </p>
              <p style="font-size: 12.5px; color: #0284c7; font-weight: 700; margin-bottom: 14px;">
                (센스쿨 구글 계정 @senedu.kr)
              </p>

              <!-- 센스쿨 구글 계정 로그인 버튼 (컴팩트 사이즈) -->
              <div style="display: flex; justify-content: center; margin-bottom: 12px;">
                <button id="btn-custom-google-login" class="btn-m3-filled" style="padding: 8px 24px; font-size: 13.5px; font-weight: 800; border-radius: 10px; justify-content: center; box-shadow: 0 2px 8px rgba(14, 55, 83, 0.15);">
                  교원 로그인
                </button>
              </div>

              <!-- 후기 수정하기 버튼 -->
              <div style="border-top: 1px dashed #cbd5e1; padding-top: 12px;">
                <button type="button" id="btn-open-review-lookup" class="btn-m3-outlined" style="width: 100%; height: 38px; border-radius: 10px; font-size: 13.5px; font-weight: 800; justify-content: center; color: #0e3753; border-color: #cbd5e1; background: #ffffff;">
                  ✏️ 후기 수정하기
                </button>
              </div>
            </div>
          ` : `
            <form id="review-submit-form">
              ${user ? `
                <div style="background: #f1f5f9; border: 1.5px solid #e2e8f0; padding: 9px 12px; border-radius: 10px; margin-bottom: 12px; display: flex; align-items: center; justify-content: center; gap: 6px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                  <span style="font-weight: 800; color: #0e3753; font-size: 14.5px;">${user.name}</span>
                  <span style="font-size: 13px; font-weight: 600; color: #64748b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">(${user.email})</span>
                </div>
              ` : `
                <div class="form-group" style="margin-bottom: 12px;">
                  <label for="review-author-input" style="font-weight: 800; font-size: 13.5px; color: #0e3753; margin-bottom: 2px;">
                    작성자 성함
                  </label>
                  <input type="text" id="review-author-input" class="m3-input" style="font-size: 14px; padding: 10px 14px; border: 1.5px solid #cbd5e1; border-radius: 10px; width: 100%; box-sizing: border-box; background: #ffffff; outline: none;" />
                </div>

                <div class="form-group" style="margin-bottom: 12px;">
                  <label for="review-password-input" style="font-weight: 800; font-size: 13.5px; color: #0e3753; margin-bottom: 2px;">
                    비밀번호
                  </label>
                  <input type="password" id="review-password-input" class="m3-input" required maxlength="20" style="font-size: 14px; padding: 10px 14px; border: 1.5px solid #cbd5e1; border-radius: 10px; width: 100%; box-sizing: border-box; background: #ffffff; outline: none;" />
                </div>
              `}

              <div class="form-group" style="margin-bottom: 12px;">
                <label for="review-event-select" style="font-weight: 800; font-size: 13px; color: #0e3753; margin-bottom: 2px;">
                  후기를 작성할 행사 선택
                </label>
                <select id="review-event-select" class="m3-select" required>
                  <option value="">행사 선택</option>
                  ${getEvents().filter(isEventPastOrToday).map(ev => `
                    <option value="${ev.id}" ${preselectedEventId === ev.id ? 'selected' : ''}>
                      [${ev.month}월 ${ev.day}일] ${ev.title} ${ev.subtitle ? `(${ev.subtitle})` : ''}
                    </option>
                  `).join("")}
                </select>
              </div>

              <div class="form-group" style="margin-bottom: 14px;">
                <label for="review-text-input" style="font-weight: 800; font-size: 13.5px; color: #0e3753; margin-bottom: 2px;">소감 및 수업 적용 나눔</label>
                <textarea id="review-text-input" class="m3-textarea" rows="4" placeholder="연수/행사에서 얻은 인사이트나 교실 실천 계획을 자유롭게 적어주세요." required style="resize: vertical; white-space: pre-wrap; line-height: 1.6;"></textarea>
              </div>

              <div style="display: flex; gap: 8px; align-items: center;">
                <button type="submit" class="btn-m3-filled" style="flex: 1; height: 42px; border-radius: 10px; font-size: 14px; font-weight: 800; justify-content: center; padding: 0 16px;">
                  후기 등록하기
                </button>
                ${user ? `
                  <button type="button" id="btn-review-logout" class="btn-review-logout-inline" title="로그아웃">
                    로그아웃
                  </button>
                ` : ''}
              </div>

              <!-- 후기 등록하기 버튼 아래: 후기 수정하기 버튼 -->
              <div style="margin-top: 10px; border-top: 1px dashed #cbd5e1; padding-top: 10px;">
                <button type="button" id="btn-open-review-lookup" class="btn-m3-outlined" style="width: 100%; height: 38px; border-radius: 10px; font-size: 13.5px; font-weight: 800; justify-content: center; color: #0e3753; border-color: #cbd5e1; background: #ffffff;">
                  ✏️ 후기 수정하기
                </button>
              </div>
            </form>
          `}
        </div>

        <!-- 등록된 후기 목록 -->
        <div class="review-feed-list" id="review-feed-container">

          ${displayedReviews.length > 0 ? `
            <div class="review-view-bar">
              <p class="review-view-count">
                ${reviewEventFilter === "all"
                  ? `후기 ${totalReviews}건`
                  : `전체 ${displayedReviews.length}건 중 ${totalReviews}건`}
              </p>

              <div class="review-view-controls">
                ${eventOptions.length > 1 ? `
                  <select id="review-event-filter" class="m3-select review-view-select" aria-label="행사별 보기">
                    <option value="all" ${reviewEventFilter === "all" ? "selected" : ""}>전체 행사</option>
                    ${eventOptions.map(o => `
                      <option value="${o.id}" ${reviewEventFilter === o.id ? "selected" : ""}>${o.title}</option>
                    `).join("")}
                  </select>
                ` : ""}

                <select id="review-sort-select" class="m3-select review-view-select" aria-label="정렬 기준">
                  ${REVIEW_SORT_OPTIONS.map(o => `
                    <option value="${o.key}" ${reviewSort === o.key ? "selected" : ""}>${o.label}</option>
                  `).join("")}
                </select>
              </div>
            </div>
          ` : ""}

          ${pagedReviews.length === 0 ? `
            <div style="background: #ffffff; border: 1.5px dashed #cbd5e1; border-radius: 18px; padding: 48px 20px; text-align: center; color: #64748b;">
              <div style="font-size: 36px; margin-bottom: 10px;">💬</div>
              <p style="font-size: 15px; font-weight: 700; color: #334155; margin: 0;">
                등록된 참여 후기가 없습니다.
              </p>
            </div>
          ` : pagedReviews.map(rev => {
            const cleanName = formatAuthorDisplayName(rev.userName, isAdmin);
            const cleanTitle = (rev.eventTitle || "").replace(/^🎯\s*/, "");
            const isAuthor = myReviewIds.includes(rev.id) || (user && user.email && rev.userEmail && (user.email.toLowerCase() === rev.userEmail.toLowerCase()));
            const isApproved = rev.status !== "pending";

            return `
            <div class="review-feed-card ${!isApproved ? 'is-pending' : ''}" data-review-id="${rev.id}">
              ${(!isApproved && !isAdmin && isAuthor) ? `
                <div style="background: #fffbeb; border: 1.5px solid #fde68a; border-radius: 10px; padding: 9px 13px; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; color: #b45309; line-height: 1.45;">
                  <span style="font-size: 16px;">⏳</span>
                  <span>작성하신 후기는 관리자의 승인을 기다리고 있습니다. (승인 후 모든 사용자에게 공개됩니다)</span>
                </div>
              ` : ''}

              <!-- 상단 바: 연수 종류 태그 + 작성자 이름 + 작성일시 | 공감 및 관리자 승인 버튼 -->
              <div class="review-card-top-row">
                <div class="review-user-name">
                  <span class="review-event-tag">${cleanTitle}</span>
                  <span class="user-display-name">${cleanName}</span>
                  <span class="review-date-text">${rev.createdAt}</span>
                  ${isAdmin ? `
                    <span style="font-size: 11px; font-weight: 800; padding: 2px 7px; border-radius: 4px; ${isApproved ? 'background:#dcfce7; color:#166534;' : 'background:#fef3c7; color:#b45309;'}">
                      ${isApproved ? '승인됨' : '승인대기'}
                    </span>
                  ` : (!isApproved && isAuthor) ? `
                    <span style="font-size: 11px; font-weight: 800; padding: 2px 7px; border-radius: 4px; background:#fef3c7; color:#b45309;">
                      승인대기
                    </span>
                  ` : ''}
                </div>

                <div class="review-top-actions-group">
                  <button class="btn-like-pill btn-like ${likedReviewIds.includes(rev.id) ? 'liked' : ''}"
                          data-review-id="${rev.id}"
                          aria-pressed="${likedReviewIds.includes(rev.id)}"
                          title="${likedReviewIds.includes(rev.id) ? '공감 취소' : '공감하기'}">
                    ${likedReviewIds.includes(rev.id) ? '❤️' : '🤍'} <span>공감</span> <strong>${rev.likes || 0}</strong>
                  </button>

                  ${isAdmin ? `
                    ${isApproved ? `
                      <button class="btn-review-mod-unapprove btn-admin-action" data-review-id="${rev.id}" style="padding: 3px 8px; font-size: 11.5px; color: #b45309; border-color: #fde68a;" title="승인 취소 (일반 교원 화면에서 숨김)">
                        승인취소
                      </button>
                    ` : `
                      <button class="btn-review-mod-approve btn-admin-action filled" data-review-id="${rev.id}" style="padding: 3px 8px; font-size: 11.5px; background: #166534; border-color: #166534; color: #ffffff;" title="후기 승인 (홈페이지에 공개)">
                        승인
                      </button>
                    `}
                    <button class="btn-review-mod-delete btn-admin-action" data-review-id="${rev.id}" style="padding: 3px 8px; font-size: 11.5px; color: #dc2626; border-color: #fecdd3;" title="후기 영구 삭제 (되돌릴 수 없음)">
                      삭제
                    </button>
                  ` : ''}
                </div>
              </div>

              <p class="review-content-body">${rev.content}</p>
            </div>
          `;
          }).join("")}

          ${totalPages > 1 ? `
            <div class="reviews-pagination" style="display: flex; justify-content: center; align-items: center; gap: 6px; margin-top: 24px; flex-wrap: wrap;">
              <button class="btn-page-nav" data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled style="opacity: 0.4; cursor: not-allowed; padding: 6px 12px; border: 1.5px solid #cbd5e1; background: #ffffff; border-radius: 8px; font-weight: 700; font-size: 13px; color: #0e3753;"' : 'style="cursor: pointer; padding: 6px 12px; border: 1.5px solid #cbd5e1; background: #ffffff; border-radius: 8px; font-weight: 700; font-size: 13px; color: #0e3753;"'}>
                ◀ 이전
              </button>

              ${Array.from({ length: totalPages }, (_, i) => i + 1).map(p => `
                <button class="btn-page-num ${p === currentPage ? 'active' : ''}" data-page="${p}" style="padding: 6px 12px; border-radius: 8px; font-weight: 800; font-size: 13px; border: 1.5px solid ${p === currentPage ? '#0e3753' : '#cbd5e1'}; background: ${p === currentPage ? '#0e3753' : '#ffffff'}; color: ${p === currentPage ? '#ffffff' : '#0e3753'}; cursor: pointer;">
                  ${p}
                </button>
              `).join("")}

              <button class="btn-page-nav" data-page="${currentPage + 1}" ${currentPage === totalPages ? 'disabled style="opacity: 0.4; cursor: not-allowed; padding: 6px 12px; border: 1.5px solid #cbd5e1; background: #ffffff; border-radius: 8px; font-weight: 700; font-size: 13px; color: #0e3753;"' : 'style="cursor: pointer; padding: 6px 12px; border: 1.5px solid #cbd5e1; background: #ffffff; border-radius: 8px; font-weight: 700; font-size: 13px; color: #0e3753;"'}>
                다음 ▶
              </button>
            </div>
          ` : ''}
        </div>
      </div>
    </div>
  `;

  // 참여 이야기 펼침 버튼 바인딩
  bindParticipationStories(container);

  // 후기 정렬 변경
  const reviewSortSelect = container.querySelector("#review-sort-select");
  if (reviewSortSelect) {
    reviewSortSelect.addEventListener("change", (e) => {
      reviewSort = e.target.value;
      try {
        localStorage.setItem(REVIEW_VIEW_PREF_KEY, reviewSort);
      } catch (err) {
        // 저장 실패해도 화면 동작에는 영향 없음
      }
      renderReviews(container, preselectedEventId, 1);
    });
  }

  // 행사별 보기 변경
  const reviewEventSelect = container.querySelector("#review-event-filter");
  if (reviewEventSelect) {
    reviewEventSelect.addEventListener("change", (e) => {
      reviewEventFilter = e.target.value;
      renderReviews(container, preselectedEventId, 1);
    });
  }

  // 페이지네이션 버튼 바인딩
  container.querySelectorAll(".btn-page-num:not(.active), .btn-page-nav:not(:disabled)").forEach(btn => {
    btn.addEventListener("click", () => {
      const targetPage = parseInt(btn.dataset.page, 10);
      if (!isNaN(targetPage) && targetPage >= 1 && targetPage <= totalPages) {
        renderReviews(container, preselectedEventId, targetPage);
        const feedElem = container.querySelector("#review-feed-container");
        if (feedElem) {
          feedElem.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    });
  });

  // 관리자 모드: 후기 작성 방식 라디오 버튼 변경 이벤트 바인딩
  if (isAdmin) {
    container.querySelectorAll("input[name='review-auth-mode-radio']").forEach(radio => {
      radio.addEventListener("change", (e) => {
        const newMode = e.target.value;
        FirestoreReviewService.saveReviewAuthMode(newMode);
        renderReviews(container, preselectedEventId);
      });
    });
  }

  // 로그아웃 버튼 바인딩 (관리자 또는 로그인 사용자)
  const btnLogout = container.querySelector("#btn-review-logout");
  if (btnLogout) {
    btnLogout.addEventListener("click", () => {
      GoogleAuthService.logout();
      renderReviews(container, preselectedEventId);
    });
  }

  // 미로그인 상태일 때 구글 로그인 버튼 바인딩
  const btnLogin = container.querySelector("#btn-custom-google-login");
  if (btnLogin) {
    btnLogin.addEventListener("click", () => {
      GoogleAuthService.triggerGoogleLogin((loggedInUser) => {
        // 로그인 직후 개인정보 수집·이용 동의 여부 확인
        if (loggedInUser && !hasConsented(loggedInUser.email)) {
          openPrivacyConsentModal({
            email: loggedInUser.email,
            onAgree: () => renderReviews(container, preselectedEventId),
            onDecline: () => {
              GoogleAuthService.logout();
              alert("개인정보 수집·이용에 동의하지 않아 로그아웃되었습니다.\n후기 작성 등 기능은 동의 후 이용하실 수 있습니다.");
              renderReviews(container, preselectedEventId);
            }
          });
          return;
        }
        renderReviews(container, preselectedEventId);
      });
    });
  }

  // 후기 수정하기 버튼 바인딩 (이름 + 비밀번호로 후기 조회 및 수정)
  container.querySelectorAll("#btn-open-review-lookup").forEach(btn => {
    btn.addEventListener("click", () => {
      openReviewLookupModal(container, preselectedEventId);
    });
  });

  // 후기 등록 폼 바인딩
  const form = container.querySelector("#review-submit-form");
  if (form && !isAdmin) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (isAdmin) {
        alert("⚠️ 관리자 계정은 후기 작성 대상이 아닙니다.");
        return;
      }
      // 로그인 사용자는 개인정보 동의가 있어야 후기를 작성할 수 있다
      if (user && !hasConsented(user.email)) {
        openPrivacyConsentModal({
          email: user.email,
          reason: "후기를 작성하시려면 개인정보 수집·이용 동의가 필요합니다.",
          onAgree: () => renderReviews(container, preselectedEventId),
          onDecline: () => {
            GoogleAuthService.logout();
            alert("개인정보 수집·이용에 동의하지 않아 로그아웃되었습니다.");
            renderReviews(container, preselectedEventId);
          }
        });
        return;
      }

      const select = container.querySelector("#review-event-select");
      const text = container.querySelector("#review-text-input");
      const eventId = select ? select.value : "";
      const content = text ? text.value.trim() : "";

      if (!eventId || !content) return;

      const allEvents = getEvents();
      const eventObj = allEvents.find(ev => ev.id === eventId);
      const now = new Date();
      const timeStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      let maskedName = "서부 교원";
      let userEmail = "guest@senedu.kr";
      let isSenedu = false;
      let password = "";

      if (user) {
        maskedName = (user.name || "서부 교원").replace(/\s*(교사|실무사|선생님)$/, "").trim();
        userEmail = user.email;
        isSenedu = true;
      } else {
        const authorInput = container.querySelector("#review-author-input");
        const pwInput = container.querySelector("#review-password-input");
        const rawName = authorInput ? authorInput.value.trim() : "";
        password = pwInput ? pwInput.value.trim() : "";

        if (!password) {
          alert("⚠️ 후기 수정 및 삭제에 사용할 비밀번호를 입력해주세요.");
          if (pwInput) pwInput.focus();
          return;
        }

        if (rawName) {
          maskedName = rawName.replace(/\s*(교사|실무사|선생님)$/, "").trim();
        }
      }

      const newReview = {
        id: "rev-" + Date.now(),
        eventId: eventId,
        eventTitle: eventObj ? `${eventObj.title} ${eventObj.subtitle ? `(${eventObj.subtitle})` : ''}` : "서부 교육 프로그램",
        userName: maskedName,
        userEmail: userEmail,
        isSenedu: isSenedu,
        rating: selectedRating,
        content: content,
        likes: 0,
        createdAt: timeStr,
        status: "pending", // 관리자 승인 대기 상태로 등록
        password: password || ""
      };

      addMyReviewId(newReview.id);

      const currentReviews = getStoredReviews();
      const updated = [newReview, ...currentReviews];
      saveReviews(updated);

      // 클라우드 Firestore 동기화 (비동기)
      FirestoreReviewService.saveReview(newReview);

      alert("✅ 참여 후기가 성공적으로 등록되었습니다!\n관리자의 승인을 기다리는 중이며, 승인 완료 후 모든 교원에게 공개됩니다.");
      renderReviews(container, null);
    });
  }

  // 관리자 승인 버튼 바인딩 (확인창 없이 1클릭 즉시 승인)
  container.querySelectorAll(".btn-review-mod-approve").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const revId = btn.dataset.reviewId;
      const currentList = getStoredReviews();
      const target = currentList.find(r => r.id === revId);
      if (target) {
        target.status = "approved";
        saveReviews(currentList);
        FirestoreReviewService.updateReviewStatus(revId, "approved");
        renderReviews(container, preselectedEventId);
      }
    });
  });

  // 관리자 승인 취소 버튼 바인딩 (확인창 없이 1클릭 즉시 취소)
  container.querySelectorAll(".btn-review-mod-unapprove").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const revId = btn.dataset.reviewId;
      const currentList = getStoredReviews();
      const target = currentList.find(r => r.id === revId);
      if (target) {
        target.status = "pending";
        saveReviews(currentList);
        FirestoreReviewService.updateReviewStatus(revId, "pending");
        renderReviews(container, preselectedEventId);
      }
    });
  });

  // 관리자 후기 삭제 버튼 바인딩 (영구 삭제이므로 확인 후 진행)
  container.querySelectorAll(".btn-review-mod-delete").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const revId = btn.dataset.reviewId;
      const currentList = getStoredReviews();
      const target = currentList.find(r => r.id === revId);
      if (!target) return;

      const preview = (target.content || "").slice(0, 40);
      if (!confirm(`이 후기를 영구 삭제하시겠습니까?\n\n작성자: ${target.userName || "서부 교원"}\n내용: ${preview}${(target.content || "").length > 40 ? "…" : ""}\n\n삭제하면 되돌릴 수 없습니다.`)) {
        return;
      }

      saveReviews(currentList.filter(r => r.id !== revId));
      FirestoreReviewService.deleteReview(revId);
      renderReviews(container, preselectedEventId);
    });
  });

  // 공감 클릭 (한 사람이 후기 하나에 한 번만, 다시 누르면 취소)
  container.querySelectorAll(".btn-like").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      const revId = btn.dataset.reviewId;
      const currentReviews = getStoredReviews();
      const target = currentReviews.find(r => r.id === revId);
      if (!target) return;

      const liked = getLikedReviewIds();
      const alreadyLiked = liked.includes(revId);

      if (alreadyLiked) {
        target.likes = Math.max(0, (target.likes || 0) - 1);
        setLikedReviewIds(liked.filter(id => id !== revId));
      } else {
        target.likes = (target.likes || 0) + 1;
        setLikedReviewIds([...liked, revId]);
      }

      saveReviews(currentReviews);
      FirestoreReviewService.updateReviewLikes(revId, target.likes);
      renderReviews(container, preselectedEventId, currentPage);
    });
  });
}

/**
 * 작성자 성함 + 비밀번호로 후기 조회 후 수정/삭제 모달
 */
function openReviewLookupModal(container, preselectedEventId) {
  const mount = document.getElementById("modal-mount");
  if (!mount) return;

  const renderLookupStep = () => {
    mount.innerHTML = `
      <div class="m3-modal-backdrop open" id="review-lookup-backdrop">
        <div class="m3-modal-dialog" style="max-width: 480px; width: 92%;">
          <div class="modal-header" style="padding-bottom: 12px; border-bottom: 1.5px solid #f1f5f9;">
            <h3 style="font-size: 18px; font-weight: 900; color: #0e3753; display: flex; align-items: center; gap: 8px; margin: 0;">
              <span>✏️ 후기 수정 / 삭제</span>
            </h3>
            <button class="modal-close-btn" id="btn-close-lookup" aria-label="닫기">✕</button>
          </div>

          <form id="review-lookup-form" style="display: flex; flex-direction: column; gap: 14px; margin-top: 14px;">
            <div id="lookup-error-msg" style="display: none; background: #fef2f2; border: 1.5px solid #fecdd3; border-radius: 10px; padding: 9px 12px; color: #dc2626; font-size: 13px; font-weight: 700;">
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 0;">
              <div class="form-group" style="margin-bottom: 0;">
                <label for="lookup-author-name" style="font-weight: 800; font-size: 13px; color: #0e3753; margin-bottom: 4px; display: block;">
                  작성자 성함
                </label>
                <input type="text" id="lookup-author-name" class="m3-input" required style="font-size: 13.5px; padding: 9px 12px; border: 1.5px solid #cbd5e1; border-radius: 10px; width: 100%; box-sizing: border-box; background: #ffffff;" />
              </div>

              <div class="form-group" style="margin-bottom: 0;">
                <label for="lookup-password" style="font-weight: 800; font-size: 13px; color: #0e3753; margin-bottom: 4px; display: block;">
                  비밀번호
                </label>
                <input type="password" id="lookup-password" class="m3-input" required style="font-size: 13.5px; padding: 9px 12px; border: 1.5px solid #cbd5e1; border-radius: 10px; width: 100%; box-sizing: border-box; background: #ffffff;" />
              </div>
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 6px;">
              <button type="button" id="btn-cancel-lookup" class="btn-m3-outlined" style="padding: 8px 18px; font-size: 13.5px; font-weight: 700; border-radius: 10px; cursor: pointer;">
                닫기
              </button>
              <button type="submit" class="btn-m3-filled" style="padding: 8px 22px; font-size: 13.5px; font-weight: 800; border-radius: 10px; cursor: pointer; background: #0e3753; color: #ffffff;">
                조회하기
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    const closeModal = () => { mount.innerHTML = ""; };
    mount.querySelector("#btn-close-lookup")?.addEventListener("click", closeModal);
    mount.querySelector("#btn-cancel-lookup")?.addEventListener("click", closeModal);
    mount.querySelector("#review-lookup-backdrop")?.addEventListener("click", (e) => {
      if (e.target.id === "review-lookup-backdrop") closeModal();
    });

    const form = mount.querySelector("#review-lookup-form");
    form?.addEventListener("submit", (e) => {
      e.preventDefault();
      const nameInput = mount.querySelector("#lookup-author-name");
      const pwInput = mount.querySelector("#lookup-password");
      const errBox = mount.querySelector("#lookup-error-msg");

      const rawName = nameInput ? nameInput.value.trim() : "";
      const rawPw = pwInput ? pwInput.value.trim() : "";

      if (!rawName || !rawPw) return;

      const allReviews = getStoredReviews();
      const matched = allReviews.filter(r => {
        const cleanRName = (r.userName || "").replace(/\s*(교사|실무사|선생님)$/, "").trim();
        return (cleanRName === rawName || cleanRName === rawName.replace(/\s*(교사|실무사|선생님)$/, "").trim()) && r.password === rawPw;
      });

      if (matched.length === 0) {
        if (errBox) {
          errBox.style.display = "block";
          errBox.textContent = "일치하는 후기를 찾을 수 없습니다.";
        }
        return;
      }

      // 후기가 1개인 경우 바로 수정 화면으로 이동
      if (matched.length === 1) {
        renderEditStep(matched[0]);
      } else {
        renderSelectionStep(matched);
      }
    });

    setTimeout(() => {
      mount.querySelector("#lookup-author-name")?.focus();
    }, 50);
  };

  const renderSelectionStep = (matchedList) => {
    mount.innerHTML = `
      <div class="m3-modal-backdrop open" id="review-lookup-backdrop">
        <div class="m3-modal-dialog" style="max-width: 520px; width: 92%; max-height: 90vh; overflow-y: auto;">
          <div class="modal-header" style="padding-bottom: 12px; border-bottom: 1.5px solid #f1f5f9;">
            <h3 style="font-size: 18px; font-weight: 900; color: #0e3753; display: flex; align-items: center; gap: 8px; margin: 0;">
              <span>후기 선택 (${matchedList.length}건)</span>
            </h3>
            <button class="modal-close-btn" id="btn-close-lookup" aria-label="닫기">✕</button>
          </div>

          <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 14px;">
            ${matchedList.map(r => `
              <div style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 12px 14px; display: flex; justify-content: space-between; align-items: center; gap: 10px;">
                <div style="flex: 1; overflow: hidden;">
                  <div style="font-size: 13.5px; font-weight: 800; color: #0e3753; margin-bottom: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    ${r.eventTitle || "서부 교육 프로그램"}
                  </div>
                  <div style="font-size: 12px; color: #64748b; margin-bottom: 4px;">
                    ${r.createdAt} · ${r.status === 'pending' ? '승인대기' : '승인됨'}
                  </div>
                  <div style="font-size: 13px; color: #334155; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    "${(r.content || "").replace(/\n/g, ' ')}"
                  </div>
                </div>
                <button class="btn-m3-filled btn-select-review" data-rev-id="${r.id}" style="padding: 7px 14px; font-size: 13px; font-weight: 800; border-radius: 8px; white-space: nowrap; background: #0e3753; color: #ffffff;">
                  선택
                </button>
              </div>
            `).join("")}
          </div>

          <div style="display: flex; justify-content: flex-end; margin-top: 14px;">
            <button type="button" id="btn-cancel-lookup" class="btn-m3-outlined" style="padding: 8px 18px; font-size: 13.5px; font-weight: 700; border-radius: 10px; cursor: pointer;">
              닫기
            </button>
          </div>
        </div>
      </div>
    `;

    const closeModal = () => { mount.innerHTML = ""; };
    mount.querySelector("#btn-close-lookup")?.addEventListener("click", closeModal);
    mount.querySelector("#btn-cancel-lookup")?.addEventListener("click", closeModal);

    mount.querySelectorAll(".btn-select-review").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.revId;
        const target = matchedList.find(r => r.id === id);
        if (target) renderEditStep(target);
      });
    });
  };

  const renderEditStep = (targetRev) => {
    mount.innerHTML = `
      <div class="m3-modal-backdrop open" id="review-lookup-backdrop">
        <div class="m3-modal-dialog" style="max-width: 540px; width: 92%; max-height: 90vh; overflow-y: auto;">
          <div class="modal-header" style="padding-bottom: 12px; border-bottom: 1.5px solid #f1f5f9;">
            <h3 style="font-size: 18px; font-weight: 900; color: #0e3753; display: flex; align-items: center; gap: 8px; margin: 0;">
              <span>✏️ 후기 수정</span>
            </h3>
            <button class="modal-close-btn" id="btn-close-lookup" aria-label="닫기">✕</button>
          </div>

          <form id="review-direct-edit-form" style="display: flex; flex-direction: column; gap: 14px; margin-top: 14px;">
            <div style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 10px 14px;">
              <div style="font-size: 12px; font-weight: 800; color: #0284c7; margin-bottom: 3px;">
                ${targetRev.eventTitle || "서부 교육 프로그램"}
              </div>
              <div style="font-size: 13.5px; font-weight: 700; color: #334155;">
                작성자: <span style="font-weight: 800; color: #0e3753;">${targetRev.userName || "서부 교원"}</span>
                <span style="font-size: 12px; color: #64748b; margin-left: 8px;">(${targetRev.createdAt})</span>
              </div>
            </div>

            <div class="form-group" style="margin-bottom: 0;">
              <label for="review-direct-content" style="font-weight: 800; font-size: 13px; color: #0e3753; margin-bottom: 4px; display: block;">
                후기 내용
              </label>
              <textarea id="review-direct-content" class="m3-textarea" rows="6" required style="resize: vertical; white-space: pre-wrap; line-height: 1.6; font-size: 14px; padding: 12px; width: 100%; box-sizing: border-box; border: 1.5px solid #cbd5e1; border-radius: 10px; background: #ffffff;"></textarea>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px;">
              <button type="button" id="btn-delete-direct" class="btn-m3-outlined" style="padding: 8px 16px; font-size: 13px; font-weight: 800; border-radius: 10px; color: #ef4444; border-color: #fecdd3; cursor: pointer;">
                후기 삭제
              </button>

              <div style="display: flex; gap: 8px;">
                <button type="button" id="btn-cancel-lookup" class="btn-m3-outlined" style="padding: 8px 18px; font-size: 13.5px; font-weight: 700; border-radius: 10px; cursor: pointer;">
                  취소
                </button>
                <button type="submit" class="btn-m3-filled" style="padding: 8px 22px; font-size: 13.5px; font-weight: 800; border-radius: 10px; cursor: pointer; background: #0e3753; color: #ffffff;">
                  수정 완료
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    `;

    const textarea = mount.querySelector("#review-direct-content");
    if (textarea) textarea.value = targetRev.content || "";

    const closeModal = () => { mount.innerHTML = ""; };
    mount.querySelector("#btn-close-lookup")?.addEventListener("click", closeModal);
    mount.querySelector("#btn-cancel-lookup")?.addEventListener("click", closeModal);

    const form = mount.querySelector("#review-direct-edit-form");
    form?.addEventListener("submit", (e) => {
      e.preventDefault();
      const newText = textarea ? textarea.value.trim() : "";
      if (!newText) {
        alert("수정할 내용을 입력해주세요.");
        if (textarea) textarea.focus();
        return;
      }

      const currentList = getStoredReviews();
      const item = currentList.find(r => r.id === targetRev.id);
      if (item) {
        item.content = newText;
        // 작성자가 수정하면 관리자가 다시 승인하도록 pending 상태로 전환
        item.status = "pending";
        saveReviews(currentList);
        FirestoreReviewService.updateReviewContent(targetRev.id, item.content, "pending");
      }

      addMyReviewId(targetRev.id);
      closeModal();
      alert("후기가 수정되었습니다. 관리자의 재승인 후 공개됩니다.");
      renderReviews(container, preselectedEventId);
    });

    // 삭제 버튼
    mount.querySelector("#btn-delete-direct")?.addEventListener("click", () => {
      if (confirm("정말 이 참여 후기를 삭제하시겠습니까?")) {
        const currentList = getStoredReviews();
        const filtered = currentList.filter(r => r.id !== targetRev.id);
        saveReviews(filtered);
        FirestoreReviewService.deleteReview(targetRev.id);
        closeModal();
        alert("후기가 삭제되었습니다.");
        renderReviews(container, preselectedEventId);
      }
    });

    // Ctrl+Enter 빠른 저장
    textarea?.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        form?.dispatchEvent(new Event("submit"));
      }
    });

    setTimeout(() => {
      if (textarea) {
        textarea.focus();
        textarea.selectionStart = textarea.selectionEnd = textarea.value.length;
      }
    }, 50);
  };

  renderLookupStep();
}



