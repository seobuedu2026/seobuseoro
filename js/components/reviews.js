import { getEvents, isEventPastOrToday } from "../data/events.js";
import { GoogleAuthService } from "../auth/googleAuth.js";

const REVIEWS_STORAGE_KEY = "seobu_user_reviews_v7";

// 이전 레거시 저장소 키 정리
try {
  localStorage.removeItem("seobu_user_reviews");
  localStorage.removeItem("seobu_user_reviews_v5");
  localStorage.removeItem("seobu_user_reviews_v6");
} catch (e) {}

const INITIAL_REVIEWS = [
  {
    id: "rev-4",
    eventId: "ev-0904",
    eventTitle: "과학실무사 연수 (실험역량 강화)",
    userName: "김*찬",
    userEmail: "gogh9@senedu.kr",
    isSenedu: true,
    rating: 5,
    content: "연수를 준비하며 제가 새로 알게된 것이 많아 좋았습니다.",
    likes: 0,
    createdAt: "2026-09-18 13:09",
    status: "approved"
  }
];

function getStoredReviews() {
  const data = localStorage.getItem(REVIEWS_STORAGE_KEY);
  if (data === null) {
    localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(INITIAL_REVIEWS));
    return INITIAL_REVIEWS;
  }
  try {
    const list = JSON.parse(data);
    if (Array.isArray(list)) {
      return list.map(r => ({
        ...r,
        userName: (r.userName || "").replace(/\s*(교사|실무사|선생님)$/, "").trim(),
        status: r.status === "pending" ? "pending" : "approved"
      }));
    }
    return [];
  } catch (e) {
    return [];
  }
}

function saveReviews(reviews) {
  localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(reviews));
  window.dispatchEvent(new CustomEvent("reviews-updated", { detail: { reviews } }));
}

let selectedRating = 5;

export function renderReviews(container, preselectedEventId = null) {
  const user = GoogleAuthService.getCurrentUser();
  const isAdmin = !!(user && user.isAdmin);
  const allReviews = getStoredReviews();

  // 일반 사용자에게는 승인된 후기만 노출, 관리자에게는 전체 노출
  const displayedReviews = isAdmin ? allReviews : allReviews.filter(r => r.status === "approved");

  container.innerHTML = `
    <div class="reviews-view-wrapper">
      <div class="tab-header-single-line" style="margin-bottom: 24px;">
        <h2 class="tab-header-title">참여후기</h2>
        <p class="tab-header-desc">행사에 참여하신 선생님들의 생생한 후기와 교실 수업 적용 사례를 자유롭게 공유해주세요.</p>
      </div>

      <div class="review-layout">
        <!-- 후기 작성 영역 (@senedu.kr 전용 로그인) -->
        <div class="review-form-card">
          <div style="text-align: center; margin-bottom: 14px; padding-bottom: 8px; border-bottom: 1px solid #f1f5f9;">
            <h3 style="font-size: 16.5px; font-weight: 900; color: #0e3753; margin: 0; text-align: center;">
              참여 후기 등록
            </h3>
          </div>

          ${isAdmin ? `
            <div style="background-color: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 20px 14px; text-align: center;">
              <div style="font-size: 28px; margin-bottom: 8px;">🔒</div>
              <p style="font-size: 14.5px; font-weight: 800; color: #0e3753; margin-bottom: 6px;">
                관리자 계정 (작성 불가)
              </p>
              <p style="font-size: 12.5px; color: #64748b; line-height: 1.45; word-break: keep-all; margin-bottom: 12px;">
                참여 후기는 행사에 참여하신 <strong>현장 교원(@senedu.kr)</strong> 전용으로 작성됩니다.
              </p>
              <button type="button" id="btn-review-logout" class="btn-review-logout-inline" title="로그아웃">
                로그아웃
              </button>
            </div>
          ` : !user ? `
            <div style="background-color: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 18px 12px; text-align: center;">
              <p style="font-size: 14px; font-weight: 800; color: #0e3753; margin-bottom: 6px; line-height: 1.45;">
                후기 작성은 교원 로그인 후 가능합니다.
              </p>
              <p style="font-size: 12.5px; color: #0284c7; font-weight: 700; margin-bottom: 14px;">
                (센스쿨 구글 계정 @senedu.kr)
              </p>

              <!-- 센스쿨 구글 계정 로그인 버튼 (컴팩트 사이즈) -->
              <div style="display: flex; justify-content: center;">
                <button id="btn-custom-google-login" class="btn-m3-filled" style="padding: 8px 24px; font-size: 13.5px; font-weight: 800; border-radius: 10px; justify-content: center; box-shadow: 0 2px 8px rgba(14, 55, 83, 0.15);">
                  교원 로그인
                </button>
              </div>
            </div>
          ` : `
            <form id="review-submit-form">
              <div style="background: #f1f5f9; border: 1.5px solid #e2e8f0; padding: 9px 12px; border-radius: 10px; margin-bottom: 12px; display: flex; align-items: center; justify-content: center; gap: 6px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                <span style="font-weight: 800; color: #0e3753; font-size: 14.5px;">${user.name}</span>
                <span style="font-size: 13px; font-weight: 600; color: #64748b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">(${user.email})</span>
              </div>

              <div class="form-group" style="margin-bottom: 12px;">
                <select id="review-event-select" class="m3-select" required>
                  <option value="">참여한 행사를 선택하세요</option>
                  ${getEvents().filter(isEventPastOrToday).map(ev => `
                    <option value="${ev.id}" ${preselectedEventId === ev.id ? 'selected' : ''}>
                      [${ev.month}월 ${ev.day}일] ${ev.title} ${ev.subtitle ? `(${ev.subtitle})` : ''}
                    </option>
                  `).join("")}
                </select>
              </div>

              <div class="form-group" style="margin-bottom: 14px;">
                <label for="review-text-input" style="font-weight: 800; font-size: 13.5px; color: #0e3753; margin-bottom: 2px;">소감 및 수업 적용 나눔</label>
                <textarea id="review-text-input" class="m3-textarea" rows="4" placeholder="연수/행사에서 얻은 인사이트나 교실 실천 계획을 자유롭게 적어주세요." required style="resize: vertical;"></textarea>
              </div>

              <div style="display: flex; gap: 8px; align-items: center;">
                <button type="submit" class="btn-m3-filled" style="flex: 1; height: 42px; border-radius: 10px; font-size: 14px; font-weight: 800; justify-content: center; padding: 0 16px;">
                  후기 등록하기
                </button>
                <button type="button" id="btn-review-logout" class="btn-review-logout-inline" title="로그아웃">
                  로그아웃
                </button>
              </div>
            </form>
          `}
        </div>

        <!-- 등록된 후기 목록 -->
        <div class="review-feed-list" id="review-feed-container">

          ${displayedReviews.length === 0 ? `
            <div style="background: #ffffff; border: 1.5px dashed #cbd5e1; border-radius: 18px; padding: 48px 20px; text-align: center; color: #64748b;">
              <div style="font-size: 36px; margin-bottom: 10px;">💬</div>
              <p style="font-size: 15px; font-weight: 700; color: #334155; margin-bottom: 6px;">
                등록된 참여 후기가 없습니다.
              </p>
              <p style="font-size: 13px; color: #94a3b8;">
                ${!user ? '센스쿨 구글 계정으로 로그인 후 첫 후기를 남겨보세요!' : '새로운 후기를 작성해보세요.'}
              </p>
            </div>
          ` : displayedReviews.map(rev => {
            const cleanName = (rev.userName || "").replace(/\s*(교사|실무사|선생님)$/, "").trim();
            const cleanTitle = (rev.eventTitle || "").replace(/^🎯\s*/, "");
            const isAuthor = user && user.email && rev.userEmail && (user.email.toLowerCase() === rev.userEmail.toLowerCase());
            const isApproved = rev.status !== "pending";

            return `
            <div class="review-feed-card ${!isApproved ? 'is-pending' : ''}" data-review-id="${rev.id}">
              <!-- 상단 바: 연수 종류 태그 + 작성자 이름 + 작성일시 | 공감 및 관리 버튼 -->
              <div class="review-card-top-row">
                <div class="review-user-name">
                  <span class="review-event-tag">${cleanTitle}</span>
                  <span class="user-display-name">${cleanName}</span>
                  <span class="review-date-text">${rev.createdAt}</span>
                  ${isAdmin ? `
                    <span style="font-size: 11px; font-weight: 800; padding: 2px 7px; border-radius: 4px; ${isApproved ? 'background:#dcfce7; color:#166534;' : 'background:#fef3c7; color:#b45309;'}">
                      ${isApproved ? '승인됨' : '승인대기'}
                    </span>
                  ` : ''}
                </div>

                <div class="review-top-actions-group">
                  <button class="btn-like-pill btn-like" data-review-id="${rev.id}" title="공감하기">
                    ❤️ <span>공감</span> <strong>${rev.likes || 0}</strong>
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
                  ` : ''}

                  ${(isAdmin || isAuthor) ? `
                    <button class="btn-review-mod-delete btn-admin-action" data-review-id="${rev.id}" style="padding: 3px 8px; font-size: 11.5px; color: #ef4444; border-color: #fecdd3;" title="후기 삭제">
                      삭제
                    </button>
                  ` : ''}
                </div>
              </div>

              <p class="review-content-body">${rev.content}</p>
            </div>
          `;
          }).join("")}
        </div>
      </div>
    </div>
  `;

  // 미로그인 상태일 때 구글 로그인 버튼 바인딩
  if (!user) {
    const btnLogin = container.querySelector("#btn-custom-google-login");
    if (btnLogin) {
      btnLogin.addEventListener("click", () => {
        GoogleAuthService.triggerGoogleLogin((user) => {
          renderReviews(container, preselectedEventId);
        });
      });
    }
  } else {
    // 로그아웃 버튼
    const btnLogout = container.querySelector("#btn-review-logout");
    if (btnLogout) {
      btnLogout.addEventListener("click", () => {
        GoogleAuthService.logout();
        renderReviews(container, preselectedEventId);
      });
    }

    // 후기 등록 폼
    const form = container.querySelector("#review-submit-form");
    if (form && !isAdmin) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        if (isAdmin) {
          alert("⚠️ 관리자 계정은 후기 작성 대상이 아닙니다.");
          return;
        }
        const select = container.querySelector("#review-event-select");
        const text = container.querySelector("#review-text-input");
        const eventId = select.value;
        const content = text.value.trim();

        if (!eventId || !content) return;

        const allEvents = getEvents();
        const eventObj = allEvents.find(ev => ev.id === eventId);
        const now = new Date();
        const timeStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        let maskedName = user.name;
        if (user.name.length >= 2 && !user.name.includes("*") && !isAdmin) {
          maskedName = user.name[0] + "*" + (user.name.length > 2 ? user.name.slice(2) : "");
        }
        maskedName = maskedName.replace(/\s*(교사|실무사|선생님)$/, "").trim();

        const newReview = {
          id: "rev-" + Date.now(),
          eventId: eventId,
          eventTitle: eventObj ? `${eventObj.title} ${eventObj.subtitle ? `(${eventObj.subtitle})` : ''}` : "서부 교육 프로그램",
          userName: maskedName,
          userEmail: user.email,
          isSenedu: true,
          rating: selectedRating,
          content: content,
          likes: 0,
          createdAt: timeStr,
          status: "approved" // 기본 승인 상태로 즉시 등록
        };

        const currentReviews = getStoredReviews();
        const updated = [newReview, ...currentReviews];
        saveReviews(updated);

        alert("✅ 참여 후기가 성공적으로 등록되었습니다!");
        renderReviews(container, null);
      });
    }
  }

  // 관리자 승인 버튼 바인딩
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
        alert("✅ 후기가 정상적으로 승인(공개)되었습니다.");
        renderReviews(container, preselectedEventId);
      }
    });
  });

  // 관리자 승인 취소 버튼 바인딩
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
        alert("🔒 후기 승인이 취소되었습니다.\n(일반 교원 및 방문자 화면에서 숨김 처리됩니다.)");
        renderReviews(container, preselectedEventId);
      }
    });
  });

  // 삭제 버튼 바인딩 (관리자 또는 작성자)
  container.querySelectorAll(".btn-review-mod-delete").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const revId = btn.dataset.reviewId;
      if (confirm("정말 이 참여 후기를 삭제하시겠습니까?\n(삭제 후 복구할 수 없습니다.)")) {
        const currentList = getStoredReviews();
        const filtered = currentList.filter(r => r.id !== revId);
        saveReviews(filtered);
        alert("🗑️ 후기가 완전히 삭제되었습니다.");
        renderReviews(container, preselectedEventId);
      }
    });
  });

  // 공감 클릭
  container.querySelectorAll(".btn-like").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const revId = btn.dataset.reviewId;
      const currentReviews = getStoredReviews();
      const target = currentReviews.find(r => r.id === revId);
      if (target) {
        target.likes = (target.likes || 0) + 1;
        saveReviews(currentReviews);
        renderReviews(container, preselectedEventId);
      }
    });
  });
}

