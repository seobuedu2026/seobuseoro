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
        <!-- 후기 작성 영역 (구글 / @senedu.kr 로그인) -->
        <div class="review-form-card">
          <h3 style="font-size: 18px; font-weight: 900; margin-bottom: 16px; color: #0e3753;">
            ✍️ 참여 후기 등록
          </h3>

          ${!user ? `
            <div style="background-color: #f1f5f9; border-radius: 14px; padding: 20px; text-align: center;">
              <p style="font-size: 14px; color: #475569; margin-bottom: 14px; line-height: 1.5;">
                후기 작성은 <strong>Google 계정</strong> 또는 <strong>@senedu.kr</strong> 교육청 계정 로그인이 필요합니다.
              </p>
              <button id="btn-review-login" class="btn-m3-filled" style="width: 100%;">
                Google 로그인하기
              </button>
            </div>
          ` : `
            <form id="review-submit-form">
              <div class="form-group">
                <label>작성자</label>
                <div style="display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 700; color: #1e293b;">
                  <span>${user.name}</span>
                  <span style="font-size: 11px; font-weight: 800; background: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 9999px;">
                    ${user.isSenedu ? '@senedu.kr 인증교원' : 'Google 계정'}
                  </span>
                </div>
              </div>

              <div class="form-group">
                <label for="review-event-select">참여한 행사 선택 *</label>
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
                <label>만족도 별점</label>
                <div class="star-rating-select" id="star-rating-box">
                  ${[1, 2, 3, 4, 5].map(star => `
                    <span class="star-item" data-val="${star}" style="color: ${star <= selectedRating ? '#f59e0b' : '#cbd5e1'};">★</span>
                  `).join("")}
                </div>
              </div>

              <div class="form-group">
                <label for="review-text-input">소감 및 수업 적용 나눔 *</label>
                <textarea id="review-text-input" class="m3-textarea" rows="4" placeholder="연수/행사에서 얻은 인사이트나 교실 실천 계획을 자유롭게 적어주세요." required></textarea>
              </div>

              <button type="submit" class="btn-m3-filled" style="width: 100%; padding: 12px; font-size: 14px;">
                후기 등록하기
              </button>
            </form>
          `}
        </div>

        <!-- 등록된 후기 목록 -->
        <div class="review-feed-list" id="review-feed-container">
          ${reviews.map(rev => `
            <div class="review-feed-card" data-review-id="${rev.id}">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                  <div style="width: 32px; height: 32px; border-radius: 50%; background: #008080; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 13px;">
                    ${rev.userName[0]}
                  </div>
                  <div>
                    <div style="font-size: 14px; font-weight: 800; color: #1e293b;">
                      ${rev.userName}
                      ${rev.isSenedu ? `<span style="font-size: 11px; color: #008080; margin-left: 4px;">@senedu.kr</span>` : ''}
                    </div>
                    <div style="font-size: 11px; color: #94a3b8;">${rev.createdAt}</div>
                  </div>
                </div>

                <div style="color: #f59e0b; font-size: 16px; letter-spacing: 1px;">
                  ${'★'.repeat(rev.rating)}${'☆'.repeat(5 - rev.rating)}
                </div>
              </div>

              <div style="display: inline-block; font-size: 12px; font-weight: 800; background: #f1f5f9; color: #334155; padding: 4px 10px; border-radius: 9999px; margin-bottom: 10px;">
                🎯 ${rev.eventTitle}
              </div>

              <p style="font-size: 14px; color: #334155; line-height: 1.6;">${rev.content}</p>

              <div style="margin-top: 14px; display: flex; justify-content: flex-end;">
                <button class="btn-m3-outlined btn-like" data-review-id="${rev.id}" style="padding: 4px 12px; font-size: 12px;">
                  ❤️ 공감 <span>${rev.likes || 0}</span>
                </button>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    </div>
  `;

  // 로그인 버튼
  const btnLogin = container.querySelector("#btn-review-login");
  if (btnLogin) {
    btnLogin.addEventListener("click", () => {
      GoogleAuthService.showLoginPrompt(() => {
        renderReviews(container, preselectedEventId);
      });
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
      if (user.name.length >= 2) {
        maskedName = user.name[0] + "*" + (user.name.length > 2 ? user.name.slice(2) : "");
      }

      const newReview = {
        id: "rev-" + Date.now(),
        eventId: eventId,
        eventTitle: `${eventObj.title} ${eventObj.subtitle ? `(${eventObj.subtitle})` : ''}`,
        userName: maskedName + (user.isSenedu ? " 교사" : ""),
        userEmail: user.email,
        isSenedu: user.isSenedu,
        rating: selectedRating,
        content: content,
        likes: 0,
        createdAt: timeStr
      };

      const updated = [newReview, ...reviews];
      saveReviews(updated);
      renderReviews(container, null);
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
