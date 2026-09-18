import { getEvents, isEventPastOrToday } from "../data/events.js";
import { GoogleAuthService } from "../auth/googleAuth.js";

const REVIEWS_STORAGE_KEY = "seobu_user_reviews";

const INITIAL_REVIEWS = [
  {
    id: "rev-1",
    eventId: "ev-0910",
    eventTitle: "수다박스 연수 (학적업무 첫걸음)",
    userName: "이*진",
    userEmail: "lee@senedu.kr",
    isSenedu: true,
    rating: 5,
    content: "2학기 전출입 처리가 막막했는데 나이스 화면을 하나하나 짚어주셔서 정말 큰 도움이 되었습니다! 실무 팁 감사합니다.",
    likes: 12,
    createdAt: "2026-09-11 10:24",
    status: "approved"
  },
  {
    id: "rev-2",
    eventId: "ev-0918",
    eventTitle: "김태호 작가와 함께하는 독서교육 특강",
    userName: "박*현",
    userEmail: "park@senedu.kr",
    isSenedu: true,
    rating: 5,
    content: "작가의 눈으로 바라본 독서 수업의 매력을 느낄 수 있었습니다. 교실에서 아이들과 함께 질문 중심 수업을 실천해보고 싶어요.",
    likes: 8,
    createdAt: "2026-09-19 14:10",
    status: "approved"
  },
  {
    id: "rev-3",
    eventId: "ev-0904",
    eventTitle: "과학실무사 연수 (실험역량 강화)",
    userName: "정*우",
    userEmail: "jung@senedu.kr",
    isSenedu: true,
    rating: 4,
    content: "MBL 센서 연결 방법과 안전관리 체크리스트가 명확해서 2학기 실험 준비에 큰 도움이 될 것 같습니다.",
    likes: 5,
    createdAt: "2026-09-05 16:30",
    status: "approved"
  }
];

function getStoredReviews() {
  const data = localStorage.getItem(REVIEWS_STORAGE_KEY);
  if (!data) {
    localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(INITIAL_REVIEWS));
    return INITIAL_REVIEWS;
  }
  try {
    const list = JSON.parse(data);
    return list.map(r => ({
      ...r,
      userName: (r.userName || "").replace(/\s*(교사|실무사|선생님)$/, "").trim(),
      status: r.status || "approved"
    }));
  } catch (e) {
    return INITIAL_REVIEWS;
  }
}

function saveReviews(reviews) {
  localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(reviews));
}

let selectedRating = 5;
let currentAdminFilter = "all"; // "all" | "approved" | "pending"

export function renderReviews(container, preselectedEventId = null) {
  const user = GoogleAuthService.getCurrentUser();
  const isAdmin = !!(user && user.isAdmin);
  const allReviews = getStoredReviews();

  // 필터링 적용
  let displayedReviews = [];
  const approvedCount = allReviews.filter(r => r.status === "approved").length;
  const pendingCount = allReviews.filter(r => r.status === "pending").length;

  if (isAdmin) {
    if (currentAdminFilter === "approved") {
      displayedReviews = allReviews.filter(r => r.status === "approved");
    } else if (currentAdminFilter === "pending") {
      displayedReviews = allReviews.filter(r => r.status === "pending");
    } else {
      displayedReviews = allReviews;
    }
  } else {
    // 일반 사용자/교원: 관리자가 승인한 후기만 노출
    displayedReviews = allReviews.filter(r => r.status === "approved");
  }

  container.innerHTML = `
    <div class="reviews-view-wrapper">
      <div class="tab-header-single-line" style="margin-bottom: 24px;">
        <h2 class="tab-header-title">참여후기</h2>
        <p class="tab-header-desc">행사에 참여하신 선생님들의 생생한 후기와 교실 수업 적용 사례를 자유롭게 공유해주세요.</p>
      </div>

      <div class="review-layout">
        <!-- 후기 작성 영역 (@senedu.kr 전용 로그인) -->
        <div class="review-form-card">
          <div style="position: relative; margin-bottom: 18px; text-align: center;">
            <h3 style="font-size: 19px; font-weight: 900; color: #0e3753; margin: 0; text-align: center;">
              참여 후기 등록
            </h3>
            ${user ? `<button id="btn-review-logout" class="footer-link-btn" style="position: absolute; right: 0; top: 2px; font-size: 12px; font-weight: 600; color: #64748b;">[로그아웃]</button>` : ''}
          </div>

          ${!user ? `
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 24px 18px; text-align: center;">
              <p style="font-size: 15px; font-weight: 800; color: #0e3753; margin-bottom: 6px; line-height: 1.5;">
                후기 작성은 로그인 후 가능합니다.
              </p>
              <p style="font-size: 13.5px; color: #0284c7; font-weight: 700; margin-bottom: 20px;">
                (센스쿨 구글 계정 @senedu.kr)
              </p>

              <!-- 센스쿨 구글 계정 전용 단일 로그인 버튼 -->
              <button id="btn-custom-google-login" class="btn-m3-filled" style="width: 100%; padding: 12px 18px; font-size: 14.5px; font-weight: 800; border-radius: var(--shape-pill); justify-content: center; box-shadow: 0 4px 12px rgba(14, 55, 83, 0.2);">
                로그인 (센스쿨 구글 계정)
              </button>
            </div>
          ` : `
            <form id="review-submit-form">
              <div class="form-group">
                <label style="font-weight: 800; font-size: 13px; color: #0e3753;">작성 교원</label>
                <div style="display: flex; align-items: center; justify-content: space-between; background: #f0fdf4; border: 1px solid #bbf7d0; padding: 8px 12px; border-radius: 10px;">
                  <div style="display: flex; align-items: center; gap: 8px; font-size: 13.5px; font-weight: 700; color: #166534;">
                    <span>👤 ${user.name}</span>
                    <span style="font-size: 11px; font-weight: 800; background: ${isAdmin ? '#0e3753' : '#0284c7'}; color: #ffffff; padding: 2px 8px; border-radius: 9999px;">
                      ${isAdmin ? '관리자' : '@senedu.kr 인증'}
                    </span>
                  </div>
                  <span style="font-size: 11px; color: #15803d; font-weight: 600;">${user.email}</span>
                </div>
              </div>

              <div class="form-group">
                <label for="review-event-select" style="font-weight: 800; font-size: 13px; color: #0e3753;">참여한 행사 선택 *</label>
                <select id="review-event-select" class="m3-select" required>
                  <option value="">행사를 선택하세요 (오늘 및 이전 행사)</option>
                  ${getEvents().filter(isEventPastOrToday).map(ev => `
                    <option value="${ev.id}" ${preselectedEventId === ev.id ? 'selected' : ''}>
                      [${ev.month}월 ${ev.day}일] ${ev.title} ${ev.subtitle ? `(${ev.subtitle})` : ''}
                    </option>
                  `).join("")}
                </select>
                <div style="font-size: 11.5px; color: #64748b; margin-top: 4px;">
                  * 후기 작성은 행사 진행 당일부터 가능합니다.
                </div>
              </div>

              <div class="form-group">
                <label style="font-weight: 800; font-size: 13px; color: #0e3753;">만족도 별점</label>
                <div class="star-rating-select" id="star-rating-box">
                  ${[1, 2, 3, 4, 5].map(star => `
                    <span class="star-item" data-val="${star}" style="color: ${star <= selectedRating ? '#f59e0b' : '#cbd5e1'}; font-size: 22px; cursor: pointer;">★</span>
                  `).join("")}
                </div>
              </div>

              <div class="form-group">
                <label for="review-text-input" style="font-weight: 800; font-size: 13px; color: #0e3753;">소감 및 수업 적용 나눔 *</label>
                <textarea id="review-text-input" class="m3-textarea" rows="4" placeholder="연수/행사에서 얻은 인사이트나 교실 실천 계획을 자유롭게 적어주세요." required></textarea>
              </div>

              <button type="submit" class="btn-m3-filled" style="width: 100%; padding: 12px; font-size: 14px; font-weight: 800;">
                후기 등록하기
              </button>
              ${!isAdmin ? `
                <p style="font-size: 11.5px; color: #64748b; margin-top: 8px; text-align: center;">
                  ℹ️ 등록된 후기는 관리자 승인 후 홈페이지에 노출됩니다.
                </p>
              ` : ''}
            </form>
          `}
        </div>

        <!-- 등록된 후기 목록 -->
        <div class="review-feed-list" id="review-feed-container">
          ${isAdmin ? `
            <!-- 관리자 모더레이션 제어 바 -->
            <div class="review-admin-filter-bar">
              <div class="review-admin-filter-title">
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span style="font-size: 16px;">🛡️</span>
                  <strong style="color: #0e3753; font-size: 14px;">후기 승인 관리 모드</strong>
                </div>
                ${pendingCount > 0 ? `
                  <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                    <span class="review-pending-notice-pill">
                      🔔 승인 대기 <strong>${pendingCount}</strong>건
                    </span>
                    <button id="btn-review-approve-all" class="btn-review-batch-approve" title="승인 대기 중인 모든 후기를 한 번에 승인합니다">
                      ⚡ 일괄 승인 (${pendingCount}건)
                    </button>
                  </div>
                ` : `
                  <span style="font-size: 11.5px; color: #16a34a; font-weight: 700;">모든 후기 승인 완료됨</span>
                `}
              </div>
              <div class="review-admin-tab-group">
                <button class="review-admin-tab-btn ${currentAdminFilter === 'all' ? 'active' : ''}" data-filter="all">
                  전체 (${allReviews.length})
                </button>
                <button class="review-admin-tab-btn ${currentAdminFilter === 'approved' ? 'active' : ''}" data-filter="approved">
                  ✅ 승인 완료 (${approvedCount})
                </button>
                <button class="review-admin-tab-btn ${currentAdminFilter === 'pending' ? 'active' : ''}" data-filter="pending">
                  ⏳ 승인 대기 (${pendingCount})
                </button>
              </div>
            </div>
          ` : `
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; padding: 0 4px;">
              <span style="font-size: 14px; font-weight: 800; color: #0e3753;">
                공개된 참여후기 <span style="color: #008080;">${displayedReviews.length}</span>개
              </span>
            </div>
          `}

          ${displayedReviews.length === 0 ? `
            <div style="background: #ffffff; border: 1.5px dashed #cbd5e1; border-radius: 18px; padding: 48px 20px; text-align: center; color: #64748b;">
              <div style="font-size: 36px; margin-bottom: 10px;">💬</div>
              <p style="font-size: 15px; font-weight: 700; color: #334155; margin-bottom: 6px;">
                ${isAdmin && currentAdminFilter === 'pending' ? '승인 대기 중인 후기가 없습니다.' : '등록되어 승인된 참여 후기가 없습니다.'}
              </p>
              <p style="font-size: 13px; color: #94a3b8;">
                ${!user ? '센스쿨 구글 계정으로 로그인 후 첫 후기를 남겨보세요!' : '새로운 후기를 작성해보세요.'}
              </p>
            </div>
          ` : displayedReviews.map(rev => {
            const cleanName = (rev.userName || "").replace(/\s*(교사|실무사|선생님)$/, "").trim();
            return `
            <div class="review-feed-card ${rev.status === 'pending' ? 'is-pending' : ''}" data-review-id="${rev.id}">
              <!-- 상단 바: 연수 종류 태그(먼저) + 작성자 이름 + 작성일시 + 승인 배지(관리자) | 별점 & 공감 버튼 -->
              <div class="review-card-top-row">
                <div class="review-user-name">
                  <span class="review-event-tag">🎯 ${rev.eventTitle}</span>
                  <span class="user-display-name">${cleanName}</span>
                  <span class="review-date-text">${rev.createdAt}</span>
                  ${isAdmin ? (rev.status === 'pending' 
                    ? `<span class="badge-review-status pending">⏳ 승인 대기 (미노출)</span>` 
                    : `<span class="badge-review-status approved">✅ 승인 완료</span>`) 
                    : ''}
                </div>

                <div class="review-top-actions-group">
                  <div class="review-star-rating">
                    ${'★'.repeat(rev.rating)}${'☆'.repeat(5 - rev.rating)}
                  </div>
                  <button class="btn-like-pill btn-like" data-review-id="${rev.id}" title="공감하기">
                    ❤️ <span>공감</span> <strong>${rev.likes || 0}</strong>
                  </button>
                </div>
              </div>

              <p class="review-content-body">${rev.content}</p>

              <!-- 관리자 승인/반려/삭제 액션 바 -->
              ${isAdmin ? `
                <div class="review-admin-card-actions">
                  ${rev.status === 'pending' ? `
                    <button class="btn-review-mod-approve" data-review-id="${rev.id}">
                      ✓ 승인하기 (홈페이지 노출)
                    </button>
                  ` : `
                    <button class="btn-review-mod-unapprove" data-review-id="${rev.id}">
                      ↩️ 승인 취소 (대기로 변경)
                    </button>
                  `}
                  <button class="btn-review-mod-delete" data-review-id="${rev.id}">
                    🗑️ 삭제
                  </button>
                </div>
              ` : ''}
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

    // 별점 클릭
    const stars = container.querySelectorAll(".star-item");
    stars.forEach(s => {
      s.addEventListener("click", () => {
        selectedRating = parseInt(s.dataset.val, 10);
        stars.forEach(st => {
          const val = parseInt(st.dataset.val, 10);
          st.style.color = val <= selectedRating ? "#f59e0b" : "#cbd5e1";
        });
      });
    });

    // 후기 등록 폼
    const form = container.querySelector("#review-submit-form");
    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
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
          status: isAdmin ? "approved" : "pending" // 관리자 작성 시 즉시 승인, 일반 교원은 승인 대기
        };

        const currentReviews = getStoredReviews();
        const updated = [newReview, ...currentReviews];
        saveReviews(updated);

        if (isAdmin) {
          alert("✅ 관리자 권한으로 참여 후기가 즉시 등록 및 승인되었습니다.");
        } else {
          alert("✅ 참여 후기가 등록되었습니다!\n관리자의 검토 및 승인 완료 후 홈페이지에 노출됩니다.");
        }

        renderReviews(container, null);
      });
    }
  }

  // 관리자 모드 이벤트 리스너 바인딩
  if (isAdmin) {
    // 탭 필터
    container.querySelectorAll(".review-admin-tab-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        currentAdminFilter = btn.dataset.filter;
        renderReviews(container, preselectedEventId);
      });
    });

    // 일괄 승인 버튼 (확인창 없이 1클릭 즉시 전체 승인)
    const btnApproveAll = container.querySelector("#btn-review-approve-all");
    if (btnApproveAll) {
      btnApproveAll.addEventListener("click", () => {
        const currentList = getStoredReviews();
        let updated = false;
        currentList.forEach(r => {
          if (r.status === "pending") {
            r.status = "approved";
            updated = true;
          }
        });
        if (updated) {
          saveReviews(currentList);
          renderReviews(container, preselectedEventId);
        }
      });
    }

    // 승인 버튼 (확인창 없이 1클릭 즉시 승인)
    container.querySelectorAll(".btn-review-mod-approve").forEach(btn => {
      btn.addEventListener("click", () => {
        const revId = btn.dataset.reviewId;
        const currentList = getStoredReviews();
        const target = currentList.find(r => r.id === revId);
        if (target) {
          target.status = "approved";
          saveReviews(currentList);
          renderReviews(container, preselectedEventId);
        }
      });
    });

    // 승인 취소 버튼 (확인창 없이 1클릭 즉시 대기 전환)
    container.querySelectorAll(".btn-review-mod-unapprove").forEach(btn => {
      btn.addEventListener("click", () => {
        const revId = btn.dataset.reviewId;
        const currentList = getStoredReviews();
        const target = currentList.find(r => r.id === revId);
        if (target) {
          target.status = "pending";
          saveReviews(currentList);
          renderReviews(container, preselectedEventId);
        }
      });
    });

    // 삭제 버튼
    container.querySelectorAll(".btn-review-mod-delete").forEach(btn => {
      btn.addEventListener("click", () => {
        const revId = btn.dataset.reviewId;
        if (confirm("정말 이 참여 후기를 삭제하시겠습니까? (삭제 후 복구 불가)")) {
          const currentList = getStoredReviews();
          const filtered = currentList.filter(r => r.id !== revId);
          saveReviews(filtered);
          renderReviews(container, preselectedEventId);
        }
      });
    });
  }

  // 공감 클릭
  container.querySelectorAll(".btn-like").forEach(btn => {
    btn.addEventListener("click", () => {
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

