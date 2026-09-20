import { getEvents, isEventPastOrToday } from "../data/events.js";
import { GoogleAuthService } from "../auth/googleAuth.js";
import { FirestoreReviewService } from "../data/firestoreService.js";

const REVIEWS_STORAGE_KEY = "seobu_user_reviews_v8";
const EXCLUDED_IDS = new Set(["rev-1", "rev-2", "rev-3", "rev-4"]);

const INITIAL_REVIEWS = [];

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
          userName: (r.userName || "").replace(/\s*(교사|실무사|선생님)$/, "").trim(),
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
            userName: (r.userName || "").replace(/\s*(교사|실무사|선생님)$/, "").trim(),
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

export function renderReviews(container, preselectedEventId = null) {
  const user = GoogleAuthService.getCurrentUser();
  const isAdmin = !!(user && user.isAdmin);
  const authMode = FirestoreReviewService.getReviewAuthMode(); // 'login_required' | 'anonymous_allowed'
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
              <div style="display: flex; justify-content: center;">
                <button id="btn-custom-google-login" class="btn-m3-filled" style="padding: 8px 24px; font-size: 13.5px; font-weight: 800; border-radius: 10px; justify-content: center; box-shadow: 0 2px 8px rgba(14, 55, 83, 0.15);">
                  교원 로그인
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
                  <label for="review-author-input" style="font-weight: 800; font-size: 13px; color: #0e3753; margin-bottom: 2px;">
                    작성자 성함
                  </label>
                  <input type="text" id="review-author-input" class="m3-input" style="font-size: 13.5px; padding: 9px 12px; border: 1.5px solid #cbd5e1; border-radius: 10px; width: 100%; box-sizing: border-box; background: #ffffff; outline: none;" />
                </div>

                <div class="form-group" style="margin-bottom: 12px;">
                  <label for="review-password-input" style="font-weight: 800; font-size: 13px; color: #0e3753; margin-bottom: 2px;">
                    비밀번호 (수정/삭제용)
                  </label>
                  <input type="password" id="review-password-input" class="m3-input" required maxlength="20" style="font-size: 13.5px; padding: 9px 12px; border: 1.5px solid #cbd5e1; border-radius: 10px; width: 100%; box-sizing: border-box; background: #ffffff; outline: none;" />
                </div>
              `}

              <div class="form-group" style="margin-bottom: 12px;">
                <label for="review-event-select" style="font-weight: 800; font-size: 13px; color: #0e3753; margin-bottom: 2px;">
                  후기를 작성할 행사 선택
                </label>
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
            </form>
          `}
        </div>

        <!-- 등록된 후기 목록 -->
        <div class="review-feed-list" id="review-feed-container">

          ${displayedReviews.length === 0 ? `
            <div style="background: #ffffff; border: 1.5px dashed #cbd5e1; border-radius: 18px; padding: 48px 20px; text-align: center; color: #64748b;">
              <div style="font-size: 36px; margin-bottom: 10px;">💬</div>
              <p style="font-size: 15px; font-weight: 700; color: #334155; margin: 0;">
                등록된 참여 후기가 없습니다.
              </p>
            </div>
          ` : displayedReviews.map(rev => {
            const cleanName = (rev.userEmail === "gogh9@senedu.kr" || rev.userName === "김*찬")
              ? "김형찬"
              : (rev.userName || "").replace(/\s*(교사|실무사|선생님)$/, "").trim();
            const cleanTitle = (rev.eventTitle || "").replace(/^🎯\s*/, "");
            const isAuthor = user && user.email && rev.userEmail && (user.email.toLowerCase() === rev.userEmail.toLowerCase());
            const isApproved = rev.status !== "pending";
            const isAnonymousReview = !rev.isSenedu || !!rev.password;

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

                  ${(isAdmin || isAuthor || isAnonymousReview) ? `
                    <button class="btn-review-mod-edit btn-admin-action" data-review-id="${rev.id}" style="padding: 3px 8px; font-size: 11.5px; color: #0284c7; border-color: #bae6fd;" title="후기 수정">
                      수정
                    </button>
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
      GoogleAuthService.triggerGoogleLogin((user) => {
        renderReviews(container, preselectedEventId);
      });
    });
  }

  // 후기 등록 폼 바인딩
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
        maskedName = user.name;
        // 일반 교원 계정일 때만 가운데 글자 마스킹(*) 처리, 관리자 계정은 이름 전체 표시
        if (!user.isAdmin && user.name.length >= 2 && !user.name.includes("*")) {
          maskedName = user.name[0] + "*" + (user.name.length > 2 ? user.name.slice(2) : "");
        }
        maskedName = maskedName.replace(/\s*(교사|실무사|선생님)$/, "").trim();
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
          if (maskedName.length >= 2 && !maskedName.includes("*")) {
            maskedName = maskedName[0] + "*" + (maskedName.length > 2 ? maskedName.slice(2) : "");
          }
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
        status: "approved",
        password: password || ""
      };

      const currentReviews = getStoredReviews();
      const updated = [newReview, ...currentReviews];
      saveReviews(updated);

      // 클라우드 Firestore 동기화 (비동기)
      FirestoreReviewService.saveReview(newReview);

      alert("✅ 참여 후기가 성공적으로 등록되었습니다!");
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

  // 수정 버튼 바인딩 (관리자, 센스쿨 본인, 비밀번호 검증 비로그인 작성자)
  container.querySelectorAll(".btn-review-mod-edit").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const revId = btn.dataset.reviewId;
      const currentList = getStoredReviews();
      const target = currentList.find(r => r.id === revId);
      if (!target) return;

      if (!isAdmin) {
        if (target.password) {
          const inputPw = prompt("후기 등록 시 설정한 비밀번호를 입력해주세요:");
          if (inputPw === null) return;
          if (inputPw !== target.password) {
            alert("❌ 비밀번호가 일치하지 않습니다.");
            return;
          }
        } else if (user && target.userEmail && user.email.toLowerCase() === target.userEmail.toLowerCase()) {
          // 본인 작성 후기 통과
        } else {
          alert("⚠️ 수정 권한이 없습니다.");
          return;
        }
      }

      const newContent = prompt("수정할 후기 내용을 입력해주세요:", target.content);
      if (newContent !== null && newContent.trim()) {
        target.content = newContent.trim();
        saveReviews(currentList);
        FirestoreReviewService.updateReviewContent(revId, target.content);
        alert("✅ 후기가 성공적으로 수정되었습니다.");
        renderReviews(container, preselectedEventId);
      }
    });
  });

  // 삭제 버튼 바인딩 (관리자, 센스쿨 본인, 비밀번호 검증 비로그인 작성자)
  container.querySelectorAll(".btn-review-mod-delete").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const revId = btn.dataset.reviewId;
      const currentList = getStoredReviews();
      const target = currentList.find(r => r.id === revId);
      if (!target) return;

      if (!isAdmin) {
        if (target.password) {
          const inputPw = prompt("후기 등록 시 설정한 비밀번호를 입력해주세요:");
          if (inputPw === null) return;
          if (inputPw !== target.password) {
            alert("❌ 비밀번호가 일치하지 않습니다.");
            return;
          }
        } else if (user && target.userEmail && user.email.toLowerCase() === target.userEmail.toLowerCase()) {
          // 본인 작성 후기 통과
        } else {
          alert("⚠️ 삭제 권한이 없습니다.");
          return;
        }
      }

      if (confirm("정말 이 참여 후기를 삭제하시겠습니까?\n(삭제 후 복구할 수 없습니다.)")) {
        const filtered = currentList.filter(r => r.id !== revId);
        saveReviews(filtered);
        FirestoreReviewService.deleteReview(revId);
        alert("🗑️ 후기가 완전히 삭제되었습니다.");
        renderReviews(container, preselectedEventId);
      }
    });
  });

  // 공감 클릭
  container.querySelectorAll(".btn-like").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const revId = btn.dataset.reviewId;
      const currentReviews = getStoredReviews();
      const target = currentReviews.find(r => r.id === revId);
      if (target) {
        target.likes = (target.likes || 0) + 1;
        saveReviews(currentReviews);
        FirestoreReviewService.updateReviewLikes(revId, target.likes);
        renderReviews(container, preselectedEventId);
      }
    });
  });
}

