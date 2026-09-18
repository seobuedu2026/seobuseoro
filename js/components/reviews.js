import { getEvents } from "../data/events.js";
import { GoogleAuthService } from "../auth/googleAuth.js";

const REVIEWS_STORAGE_KEY = "seobu_user_reviews";

const INITIAL_REVIEWS = [
  {
    id: "rev-1",
    eventId: "ev-0910",
    eventTitle: "수다박스 연수 (학적업무 첫걸음)",
    userName: "이*진 교사",
    userEmail: "lee@senedu.kr",
    isSenedu: true,
    rating: 5,
    content: "2학기 전출입 처리가 막막했는데 나이스 화면을 하나하나 짚어주셔서 정말 큰 도움이 되었습니다! 실무 팁 감사합니다.",
    likes: 12,
    createdAt: "2026-09-11 10:24"
  },
  {
    id: "rev-2",
    eventId: "ev-0918",
    eventTitle: "김태호 작가와 함께하는 독서교육 특강",
    userName: "박*현 교사",
    userEmail: "park@senedu.kr",
    isSenedu: true,
    rating: 5,
    content: "작가의 눈으로 바라본 독서 수업의 매력을 느낄 수 있었습니다. 교실에서 아이들과 함께 질문 중심 수업을 실천해보고 싶어요.",
    likes: 8,
    createdAt: "2026-09-19 14:10"
  },
  {
    id: "rev-3",
    eventId: "ev-0904",
    eventTitle: "과학실무사 연수 (실험역량 강화)",
    userName: "정*우 실무사",
    userEmail: "jung@senedu.kr",
    isSenedu: true,
    rating: 4,
    content: "MBL 센서 연결 방법과 안전관리 체크리스트가 명확해서 2학기 실험 준비에 큰 도움이 될 것 같습니다.",
    likes: 5,
    createdAt: "2026-09-05 16:30"
  }
];

function getStoredReviews() {
  const data = localStorage.getItem(REVIEWS_STORAGE_KEY);
  if (!data) {
    localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(INITIAL_REVIEWS));
    return INITIAL_REVIEWS;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    return INITIAL_REVIEWS;
  }
}

function saveReviews(reviews) {
  localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(reviews));
}

let selectedRating = 5;

export function renderReviews(container, preselectedEventId = null) {
  const user = GoogleAuthService.getCurrentUser();
  const reviews = getStoredReviews();

  container.innerHTML = `
    <div class="reviews-view-wrapper">
      <div style="margin-bottom: 28px; text-align: center;">
        <h2 style="font-size: 32px; font-weight: 900; color: #0e3753; letter-spacing: -0.5px;">
          참여후기 및 수업나눔
        </h2>
        <p style="font-size: 15px; color: #64748b; margin-top: 6px;">
          행사에 참여하신 선생님들의 생생한 후기와 교실 수업 적용 사례를 자유롭게 공유해주세요.
        </p>
      </div>

      <div class="review-layout">
        <!-- 후기 작성 영역 (@senedu.kr 전용 로그인) -->
        <div class="review-form-card">
          <h3 style="font-size: 18px; font-weight: 900; margin-bottom: 16px; color: #0e3753; display: flex; align-items: center; justify-content: space-between;">
            <span>✍️ 참여 후기 등록</span>
            ${user ? `<button id="btn-review-logout" class="footer-link-btn" style="font-size: 12px; font-weight: 600; color: #64748b;">[로그아웃]</button>` : ''}
          </h3>

          ${!user ? `
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 22px 18px; text-align: center;">
              <div style="font-size: 32px; margin-bottom: 10px;">🔒</div>
              <h4 style="font-size: 15px; font-weight: 800; color: #0e3753; margin-bottom: 6px;">
                서울시교육청 구글 계정 로그인
              </h4>
              <p style="font-size: 13px; color: #64748b; margin-bottom: 16px; line-height: 1.5;">
                후기 작성은 <strong style="color: #0284c7;">@senedu.kr</strong> 전용 계정으로만 가능합니다.<br>
                (일반 구글/타 도메인 계정은 제한됩니다)
              </p>

              <!-- Google Identity Services 버튼 렌더링 컨테이너 -->
              <div id="google-signin-btn-container" style="display: flex; justify-content: center; margin-top: 8px; min-height: 44px;"></div>
            </div>
          ` : `
            <form id="review-submit-form">
              <div class="form-group">
                <label style="font-weight: 800; font-size: 13px; color: #0e3753;">작성 교원</label>
                <div style="display: flex; align-items: center; justify-content: space-between; background: #f0fdf4; border: 1px solid #bbf7d0; padding: 8px 12px; border-radius: 10px;">
                  <div style="display: flex; align-items: center; gap: 8px; font-size: 13.5px; font-weight: 700; color: #166534;">
                    <span>👤 ${user.name}</span>
                    <span style="font-size: 11px; font-weight: 800; background: #0284c7; color: #ffffff; padding: 2px 8px; border-radius: 9999px;">
                      @senedu.kr 인증
                    </span>
                  </div>
                  <span style="font-size: 11px; color: #15803d; font-weight: 600;">${user.email}</span>
                </div>
              </div>

              <div class="form-group">
                <label for="review-event-select" style="font-weight: 800; font-size: 13px; color: #0e3753;">참여한 행사 선택 *</label>
                <select id="review-event-select" class="m3-select" required>
                  <option value="">행사를 선택하세요</option>
                  ${getEvents().map(ev => `
                    <option value="${ev.id}" ${preselectedEventId === ev.id ? 'selected' : ''}>
                      [${ev.month}월 ${ev.day}일] ${ev.title} ${ev.subtitle ? `(${ev.subtitle})` : ''}
                    </option>
                  `).join("")}
                </select>
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
            </form>
          `}
        </div>

        <!-- 등록된 후기 목록 -->
        <div class="review-feed-list" id="review-feed-container">
          ${reviews.map(rev => `
            <div class="review-feed-card" data-review-id="${rev.id}">
              <!-- 상단 바: 작성자 정보 + 별점 & 공감 버튼 -->
              <div class="review-card-top-row">
                <div class="review-user-info-group">
                  <div class="review-user-avatar">
                    ${rev.userName ? rev.userName[0] : '교'}
                  </div>
                  <div>
                    <div class="review-user-name">
                      ${rev.userName}
                      ${rev.isSenedu ? `<span class="review-senedu-badge">@senedu.kr</span>` : ''}
                    </div>
                    <div class="review-date-text">${rev.createdAt}</div>
                  </div>
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

              <div class="review-event-tag">
                🎯 ${rev.eventTitle}
              </div>

              <p class="review-content-body">${rev.content}</p>
            </div>
          `).join("")}
        </div>
      </div>
    </div>
  `;

  // 미로그인 상태일 때 Google 버튼 바인딩
  if (!user) {
    // Google Identity Services 렌더링 시도
    setTimeout(() => {
      GoogleAuthService.renderGoogleButton("google-signin-btn-container", () => {
        renderReviews(container, preselectedEventId);
      });
    }, 100);
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
        if (user.name.length >= 2 && !user.name.includes("*")) {
          maskedName = user.name[0] + "*" + (user.name.length > 2 ? user.name.slice(2) : "");
        }

        const newReview = {
          id: "rev-" + Date.now(),
          eventId: eventId,
          eventTitle: eventObj ? `${eventObj.title} ${eventObj.subtitle ? `(${eventObj.subtitle})` : ''}` : "서부 교육 프로그램",
          userName: maskedName + (user.name.includes("교사") || user.name.includes("선생님") ? "" : " 교사"),
          userEmail: user.email,
          isSenedu: true,
          rating: selectedRating,
          content: content,
          likes: 0,
          createdAt: timeStr
        };

        const updated = [newReview, ...reviews];
        saveReviews(updated);
        alert("✅ 참여 후기가 성공적으로 등록되었습니다!");
        renderReviews(container, null);
      });
    }
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
