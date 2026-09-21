import { getStories, saveStories, resetStories } from "../data/stories.js";
import { getEvents, isEventPastOrToday } from "../data/events.js";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function escapeHtml(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function multiline(text) {
  return escapeHtml(text).replace(/\n/g, "<br />");
}

function formatDate(story) {
  const { year, month, day } = story;
  if (!month || !day) return "";
  const d = new Date(year || 2026, month - 1, day);
  return `${year || 2026}. ${month}. ${day}.(${WEEKDAYS[d.getDay()] || "월"})`;
}

function getBadgeClass(badge) {
  if (!badge) return "cat-sudabox";
  if (badge.includes("수다박스")) return "cat-sudabox";
  if (badge.includes("연수") || badge.includes("워크숍")) return "cat-workshop";
  if (badge.includes("특강")) return "cat-lecture";
  if (badge.includes("나눔") || badge.includes("콘서트")) return "cat-sharing";
  if (badge.includes("멘토링")) return "cat-mentoring";
  if (badge.includes("한마당") || badge.includes("성과") || badge.includes("보고")) return "cat-festival";
  return "cat-sudabox";
}

/**
 * 기본 빈 참여 이야기 객체 생성
 */
function createDefaultStory() {
  const now = new Date();
  const year = 2026;
  const month = now.getMonth() + 1 || 9;
  const day = now.getDate() || 4;

  return {
    id: `story-${year}-${String(month).padStart(2, "0")}${String(day).padStart(2, "0")}-${Date.now().toString().slice(-4)}`,
    badge: "연수·워크숍",
    badgeClass: "cat-workshop",
    year: year,
    month: month,
    day: day,
    kicker: `${year}학년도 2학기 수다박스`,
    title: "",
    subtitle: "",
    meta: "서부교육지원청 · 관내 교원",
    description: "",
    highlight: "",
    liked: [],
    wanted: []
  };
}

/**
 * 캘린더/프로그램 행사 객체(Event)로부터 참여 이야기 카드 기본 구조 생성
 */
function createStoryFromEvent(ev) {
  if (!ev) return createDefaultStory();

  const year = ev.year || 2026;
  const month = ev.month || 9;
  const day = ev.day || 1;

  const title = ev.title ? ev.title.replace(/\n/g, " ").trim() : "서부 교육 프로그램";
  const subtitle = ev.subtitle ? ev.subtitle.replace(/\n/g, " ").trim() : "";
  
  const location = ev.location ? ev.location.trim() : "";
  const target = ev.target ? ev.target.trim() : "";
  const meta = [location, target].filter(Boolean).join(" · ") || "서부교육지원청 · 관내 교원";

  const badge = ev.categoryLabel || "수다박스";
  const badgeClass = ev.categoryClass || getBadgeClass(badge);

  return {
    id: `story-${year}-${String(month).padStart(2, "0")}${String(day).padStart(2, "0")}-${Date.now().toString().slice(-4)}`,
    eventId: ev.id,
    badge: badge,
    badgeClass: badgeClass,
    year: year,
    month: month,
    day: day,
    kicker: `${year}학년도 2학기 수다박스`,
    title: title,
    subtitle: subtitle,
    meta: meta,
    description: ev.description || "",
    highlight: "",
    liked: [],
    wanted: []
  };
}

let currentParsedStory = null;
let selectedEventId = "";

/**
 * 참여 이야기 직접 등록 관리자 모달 열기 (처음부터 바로 작성 및 실시간 미리보기 화면 표시)
 */
export function openAdminHwpxModal(onUpdated) {
  const mount = document.getElementById("modal-mount");
  if (!mount) return;

  const allEvents = getEvents().sort((a, b) => {
    const ay = a.year || 2026, by = b.year || 2026;
    if (ay !== by) return ay - by;
    const am = a.month || 0, bm = b.month || 0;
    if (am !== bm) return am - bm;
    return (a.day || 0) - (b.day || 0);
  });

  // 처음 모달이 열릴 때 첫 번째 행사 또는 기본 스토리로 초기화
  if (!currentParsedStory) {
    if (allEvents.length > 0) {
      selectedEventId = allEvents[0].id;
      currentParsedStory = createStoryFromEvent(allEvents[0]);
    } else {
      selectedEventId = "";
      currentParsedStory = createDefaultStory();
    }
  }

  const renderModal = () => {
    const existingStories = getStories();

    mount.innerHTML = `
      <div class="m3-modal-backdrop open" id="admin-hwpx-backdrop">
        <div class="m3-modal-dialog" style="max-width: 960px; width: 95%; max-height: 92vh; display: flex; flex-direction: column;">
          
          <!-- 모달 헤더 -->
          <div class="modal-header" style="padding-bottom: 12px; border-bottom: 1.5px solid #e2e8f0; flex-shrink: 0;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="background: #0e3753; color: #fff; font-size: 12px; font-weight: 800; padding: 4px 10px; border-radius: 9999px;">
                ADMIN ONLY
              </span>
              <h2 style="font-size: 18.5px; font-weight: 900; color: #0e3753; margin: 0;">
                ✨ 참여 이야기 등록 및 관리 (실시간 미리보기)
              </h2>
            </div>
            <button class="modal-close-btn" id="btn-close-hwpx-modal" aria-label="닫기">✕</button>
          </div>

          <!-- 모달 본문 (스크롤 영역) -->
          <div style="overflow-y: auto; padding: 16px 4px; flex: 1;">
            
            <!-- 1단계: 행사 선택 드롭다운 (선택 시 캘린더 행사 정보 자동 연동) -->
            <div style="background: #f8fafc; border: 1.5px solid #0e3753; border-radius: 12px; padding: 12px 16px; margin-bottom: 18px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; flex-wrap: wrap; gap: 6px;">
                <label for="select-event-for-hwpx" style="font-size: 14px; font-weight: 900; color: #0e3753; display: flex; align-items: center; gap: 6px;">
                  <span>🎯 캘린더 행사 선택 (선택 시 행사 정보가 자동 입력됩니다)</span>
                </label>
                <span style="font-size: 12px; color: #0369a1; font-weight: 700;">
                  ✓ 선택 후 아래 입력창에서 자유롭게 수정할 수 있습니다.
                </span>
              </div>

              <select id="select-event-for-hwpx" class="m3-select" style="font-size: 13.5px; font-weight: 700; height: 42px; border-color: #0e3753; background: #ffffff;">
                <option value="">-- 직접 입력하기 (행사 선택 안 함) --</option>
                ${allEvents.map(ev => `
                  <option value="${ev.id}" ${selectedEventId === ev.id ? 'selected' : ''}>
                    [${ev.month}월 ${ev.day}일] [${ev.categoryLabel}] ${ev.title} ${ev.subtitle ? `(${ev.subtitle})` : ''} - ${ev.location || ''}
                  </option>
                `).join("")}
              </select>
            </div>

            <!-- 2단계: 내용 입력/수정 폼 & 실시간 카드 미리보기 (좌우 2열 배치) -->
            <div style="margin-bottom: 24px;">
              <div style="display: grid; grid-template-columns: 1.05fr 0.95fr; gap: 18px; align-items: start;">
                
                <!-- 좌측: 입력/수정 폼 -->
                <div style="background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 12px;">
                  
                  <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 10px;">
                    <div>
                      <label style="font-size: 12.5px; font-weight: 800; color: #0e3753; display: block; margin-bottom: 4px;">구분(뱃지)</label>
                      <input type="text" id="edit-story-badge" class="m3-input" style="height: 38px; font-size: 13px;" value="${escapeHtml(currentParsedStory?.badge || '수다박스')}" />
                    </div>
                    <div>
                      <label style="font-size: 12.5px; font-weight: 800; color: #0e3753; display: block; margin-bottom: 4px;">행사 일시 (연/월/일)</label>
                      <div style="display: flex; gap: 6px;">
                        <input type="number" id="edit-story-year" class="m3-input" style="height: 38px; font-size: 13px; width: 68px;" value="${currentParsedStory?.year || 2026}" />
                        <input type="number" id="edit-story-month" class="m3-input" style="height: 38px; font-size: 13px; width: 52px;" value="${currentParsedStory?.month || 9}" min="1" max="12" />
                        <input type="number" id="edit-story-day" class="m3-input" style="height: 38px; font-size: 13px; width: 52px;" value="${currentParsedStory?.day || 1}" min="1" max="31" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label style="font-size: 12.5px; font-weight: 800; color: #0e3753; display: block; margin-bottom: 4px;">상단 키커</label>
                    <input type="text" id="edit-story-kicker" class="m3-input" style="height: 38px; font-size: 13px;" value="${escapeHtml(currentParsedStory?.kicker || '2026학년도 2학기 수다박스')}" />
                  </div>

                  <div>
                    <label style="font-size: 12.5px; font-weight: 800; color: #0e3753; display: block; margin-bottom: 4px;">행사 제목 (한 줄로 표시)</label>
                    <input type="text" id="edit-story-title" class="m3-input" style="height: 38px; font-size: 13.5px; font-weight: 800;" value="${escapeHtml(currentParsedStory?.title || '')}" placeholder="예: 과학실무사" />
                  </div>

                  <div>
                    <label style="font-size: 12.5px; font-weight: 800; color: #0e3753; display: block; margin-bottom: 4px;">부제목 / 핵심 슬로건</label>
                    <input type="text" id="edit-story-subtitle" class="m3-input" style="height: 38px; font-size: 13px;" value="${escapeHtml(currentParsedStory?.subtitle || '')}" placeholder="예: 실험역량 강화 연수" />
                  </div>

                  <div>
                    <label style="font-size: 12.5px; font-weight: 800; color: #0e3753; display: block; margin-bottom: 4px;">장소 및 참여 대상/인원</label>
                    <input type="text" id="edit-story-meta" class="m3-input" style="height: 38px; font-size: 13px;" value="${escapeHtml(currentParsedStory?.meta || '')}" placeholder="예: 서부교육지원청 · 관내 초등 과학실무사" />
                  </div>

                  <div>
                    <label style="font-size: 12.5px; font-weight: 800; color: #0e3753; display: block; margin-bottom: 4px;">행사 요약 / 운영 내용</label>
                    <textarea id="edit-story-desc" class="m3-textarea" rows="3" style="font-size: 13px;" placeholder="행사의 주요 운영 내용 및 개요를 입력하세요.">${escapeHtml(currentParsedStory?.description || '')}</textarea>
                  </div>

                  <div>
                    <label style="font-size: 12.5px; font-weight: 800; color: #0e3753; display: block; margin-bottom: 4px;">참여 이야기 한눈에 (하이라이트 문구)</label>
                    <textarea id="edit-story-highlight" class="m3-textarea" rows="2" style="font-size: 13px;" placeholder="핵심 소감이나 한 줄 요약 (선택 사항)">${escapeHtml(currentParsedStory?.highlight || '')}</textarea>
                  </div>

                  <div>
                    <label style="font-size: 12.5px; font-weight: 800; color: #166534; display: block; margin-bottom: 4px;">💬 이런 점이 좋았어요 (줄바꿈으로 항목 구분)</label>
                    <textarea id="edit-story-liked" class="m3-textarea" rows="3" style="font-size: 12.5px;" placeholder="참여자들이 만족한 점이나 긍정적인 소감을 줄바꿈으로 나누어 입력하세요.">${escapeHtml((currentParsedStory?.liked || []).join("\n"))}</textarea>
                  </div>

                  <div>
                    <label style="font-size: 12.5px; font-weight: 800; color: #0284c7; display: block; margin-bottom: 4px;">🌱 이런 지원을 바랐어요 (줄바꿈으로 항목 구분)</label>
                    <textarea id="edit-story-wanted" class="m3-textarea" rows="3" style="font-size: 12.5px;" placeholder="향후 바라는 지원이나 건의사항을 줄바꿈으로 나누어 입력하세요.">${escapeHtml((currentParsedStory?.wanted || []).join("\n"))}</textarea>
                  </div>

                  <button type="button" id="btn-save-parsed-story" class="btn-m3-filled" style="height: 44px; font-size: 14.5px; font-weight: 800; justify-content: center; background: #15803d; border-radius: 10px; margin-top: 4px;">
                    🌟 이 내용으로 참여 이야기 즉시 게시
                  </button>
                </div>

                <!-- 우측: 실시간 카드 미리보기 -->
                <div style="position: sticky; top: 10px;">
                  <div style="font-size: 13.5px; font-weight: 800; color: #475569; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
                    <span>📱 홈페이지에 표시될 카드 미리보기</span>
                  </div>
                  <div id="hwpx-card-preview-container">
                    ${currentParsedStory ? renderPreviewCardHtml(currentParsedStory) : ''}
                  </div>
                </div>

              </div>
            </div>

            <!-- 현재 등록된 참여 이야기 목록 관리 섹션 -->
            <div style="border-top: 1.5px solid #e2e8f0; padding-top: 18px; margin-top: 10px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
                <h3 style="font-size: 15.5px; font-weight: 900; color: #0e3753; margin: 0;">
                  📚 현재 게시 중인 참여 이야기 (${existingStories.length}건)
                </h3>
                <button type="button" id="btn-reset-stories-default" class="btn-admin-action danger" style="padding: 4px 10px; font-size: 12px;">
                  기본 2건으로 되돌리기
                </button>
              </div>

              <div style="display: flex; flex-direction: column; gap: 10px;">
                ${existingStories.map((st) => `
                  <div style="background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 12px 14px; display: flex; align-items: center; justify-content: space-between; gap: 12px;">
                    <div>
                      <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                        <span class="prog-category-badge ${escapeHtml(st.badgeClass || 'cat-sudabox')}" style="font-size: 11px; padding: 2px 6px;">
                          ${escapeHtml(st.badge || '수다박스')}
                        </span>
                        <span style="font-size: 12px; font-weight: 700; color: #64748b;">${formatDate(st)}</span>
                      </div>
                      <div style="font-size: 14px; font-weight: 800; color: #0e3753;">
                        ${escapeHtml(st.title?.replace(/\n/g, " "))}
                      </div>
                      <div style="font-size: 12px; color: #64748b; margin-top: 2px;">
                        ${escapeHtml(st.meta || '')}
                      </div>
                    </div>
                    <button type="button" class="btn-delete-story btn-admin-action" data-story-id="${escapeHtml(st.id)}" style="color: #dc2626; border-color: #fecdd3; padding: 4px 10px; font-size: 12px; flex-shrink: 0;">
                      삭제
                    </button>
                  </div>
                `).join("")}
              </div>
            </div>

          </div>

          <!-- 모달 푸터 -->
          <div class="modal-footer" style="padding-top: 12px; border-top: 1.5px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 8px; flex-shrink: 0;">
            <button type="button" class="btn-m3-outlined" id="btn-bottom-close-hwpx">
              닫기
            </button>
          </div>

        </div>
      </div>
    `;

    bindModalEvents();
  };

  function renderPreviewCardHtml(story) {
    return `
      <article class="story-card" style="box-shadow: 0 4px 14px rgba(14, 55, 83, 0.08); border-radius: 16px; border: 1.5px solid #cbd5e1; background: #ffffff;">
        <div class="story-card-body" style="padding: 18px 16px;">
          <div class="story-card-top">
            <span class="prog-category-badge ${escapeHtml(story.badgeClass || 'cat-sudabox')}">
              ${escapeHtml(story.badge || '수다박스')}
            </span>
            <span class="story-date">${formatDate(story)}</span>
          </div>

          ${story.kicker ? `<p class="story-kicker">${escapeHtml(story.kicker)}</p>` : ''}

          <h3 class="story-title" style="font-size: 18px; margin: 4px 0 6px 0;">${escapeHtml(story.title?.replace(/\n/g, " ")) || '행사 제목'}</h3>
          ${story.subtitle ? `<p class="story-subtitle" style="font-size: 13px; font-weight: 700; color: #15803d; margin: 0 0 4px 0;">${escapeHtml(story.subtitle)}</p>` : ''}
          ${story.meta ? `<p class="story-meta" style="font-size: 12px; color: #64748b; margin: 0 0 10px 0;">${escapeHtml(story.meta)}</p>` : ''}
          ${story.description ? `<p class="story-desc" style="font-size: 13px; color: #334155; line-height: 1.5;">${escapeHtml(story.description)}</p>` : ''}
        </div>

        ${story.highlight ? `
          <div class="story-highlight" style="padding: 12px 16px; background: #f0fdf4; border-top: 1px solid #dcfce7; border-bottom: 1px solid #dcfce7;">
            <p class="story-highlight-label" style="font-size: 11.5px; font-weight: 800; color: #15803d; margin: 0 0 2px 0;">참여 이야기 한눈에</p>
            <p class="story-highlight-text" style="font-size: 13.5px; font-weight: 800; color: #0e3753; margin: 0; line-height: 1.4;">${multiline(story.highlight)}</p>
          </div>
        ` : ''}

        <div style="padding: 14px 16px; background: #fafafa; border-bottom-left-radius: 16px; border-bottom-right-radius: 16px;">
          ${(story.liked && story.liked.length) ? `
            <div style="margin-bottom: 10px;">
              <p style="font-size: 12.5px; font-weight: 800; color: #166534; margin: 0 0 4px 0;">💬 이런 점이 좋았어요</p>
              <ul style="margin: 0; padding-left: 18px; font-size: 12px; color: #334155; line-height: 1.5;">
                ${story.liked.map(s => `<li>${escapeHtml(s)}</li>`).join("")}
              </ul>
            </div>
          ` : ''}

          ${(story.wanted && story.wanted.length) ? `
            <div>
              <p style="font-size: 12.5px; font-weight: 800; color: #0284c7; margin: 0 0 4px 0;">🌱 이런 지원을 바랐어요</p>
              <ul style="margin: 0; padding-left: 18px; font-size: 12px; color: #334155; line-height: 1.5;">
                ${story.wanted.map(s => `<li>${escapeHtml(s)}</li>`).join("")}
              </ul>
            </div>
          ` : ''}
        </div>
      </article>
    `;
  }

  function bindModalEvents() {
    const backdrop = mount.querySelector("#admin-hwpx-backdrop");
    const btnClose = mount.querySelector("#btn-close-hwpx-modal");
    const btnBottomClose = mount.querySelector("#btn-bottom-close-hwpx");
    const selectEvent = mount.querySelector("#select-event-for-hwpx");

    const closeModal = () => {
      if (mount) mount.innerHTML = "";
    };

    if (btnClose) btnClose.addEventListener("click", closeModal);
    if (btnBottomClose) btnBottomClose.addEventListener("click", closeModal);
    if (backdrop) {
      backdrop.addEventListener("click", (e) => {
        if (e.target === backdrop) closeModal();
      });
    }

    // 행사 선택 시 행사 정보(제목, 일시, 장소, 대상, 구분/뱃지 등)를 바로 입력 폼에 채우기
    if (selectEvent) {
      selectEvent.addEventListener("change", (e) => {
        selectedEventId = e.target.value;
        if (!selectedEventId) {
          currentParsedStory = createDefaultStory();
          renderModal();
          return;
        }

        const ev = allEvents.find(item => item.id === selectedEventId);
        if (!ev) return;

        currentParsedStory = createStoryFromEvent(ev);
        renderModal();
      });
    }

    // 폼 입력 시 실시간 미리보기 갱신
    const formInputs = [
      "edit-story-badge", "edit-story-year", "edit-story-month", "edit-story-day",
      "edit-story-kicker", "edit-story-title", "edit-story-subtitle", "edit-story-meta",
      "edit-story-desc", "edit-story-highlight", "edit-story-liked", "edit-story-wanted"
    ];

    function updatePreviewFromInputs() {
      if (!currentParsedStory) return;

      const badgeVal = mount.querySelector("#edit-story-badge")?.value.trim() || "수다박스";
      currentParsedStory.badge = badgeVal;
      currentParsedStory.badgeClass = getBadgeClass(badgeVal);
      currentParsedStory.year = parseInt(mount.querySelector("#edit-story-year")?.value, 10) || 2026;
      currentParsedStory.month = parseInt(mount.querySelector("#edit-story-month")?.value, 10) || 9;
      currentParsedStory.day = parseInt(mount.querySelector("#edit-story-day")?.value, 10) || 1;
      currentParsedStory.kicker = mount.querySelector("#edit-story-kicker")?.value.trim() || "";
      currentParsedStory.title = (mount.querySelector("#edit-story-title")?.value || "").replace(/\n/g, " ").trim();
      currentParsedStory.subtitle = (mount.querySelector("#edit-story-subtitle")?.value || "").replace(/\n/g, " ").trim();
      currentParsedStory.meta = mount.querySelector("#edit-story-meta")?.value.trim() || "";
      currentParsedStory.description = mount.querySelector("#edit-story-desc")?.value.trim() || "";
      currentParsedStory.highlight = mount.querySelector("#edit-story-highlight")?.value.trim() || "";
      
      const likedRaw = mount.querySelector("#edit-story-liked")?.value || "";
      currentParsedStory.liked = likedRaw.split("\n").map(s => s.trim()).filter(Boolean);

      const wantedRaw = mount.querySelector("#edit-story-wanted")?.value || "";
      currentParsedStory.wanted = wantedRaw.split("\n").map(s => s.trim()).filter(Boolean);

      const previewContainer = mount.querySelector("#hwpx-card-preview-container");
      if (previewContainer) {
        previewContainer.innerHTML = renderPreviewCardHtml(currentParsedStory);
      }
    }

    formInputs.forEach(id => {
      const el = mount.querySelector(`#${id}`);
      if (el) {
        el.addEventListener("input", updatePreviewFromInputs);
      }
    });

    // 저장 및 게시 버튼
    const btnSave = mount.querySelector("#btn-save-parsed-story");
    if (btnSave) {
      btnSave.addEventListener("click", () => {
        updatePreviewFromInputs();
        if (!currentParsedStory || !currentParsedStory.title) {
          alert("⚠️ 행사 제목을 입력해주세요.");
          const titleInput = mount.querySelector("#edit-story-title");
          if (titleInput) titleInput.focus();
          return;
        }

        const stories = getStories();
        const updated = [currentParsedStory, ...stories];
        saveStories(updated);

        alert("✅ 새로운 '수다박스 참여 이야기'가 성공적으로 게시되었습니다!");
        currentParsedStory = null;
        selectedEventId = "";
        renderModal();
        if (onUpdated) onUpdated();
      });
    }

    // 기존 후기 삭제 버튼
    mount.querySelectorAll(".btn-delete-story").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.storyId;
        if (confirm("정말 이 참여 이야기를 삭제하시겠습니까?")) {
          const stories = getStories();
          const filtered = stories.filter(s => s.id !== id);
          saveStories(filtered);
          renderModal();
          if (onUpdated) onUpdated();
        }
      });
    });

    // 기본값 되돌리기
    const btnReset = mount.querySelector("#btn-reset-stories-default");
    if (btnReset) {
      btnReset.addEventListener("click", () => {
        if (confirm("참여 이야기를 초기 기본값(2건)으로 되돌리시겠습니까?")) {
          resetStories();
          renderModal();
          if (onUpdated) onUpdated();
        }
      });
    }
  }

  renderModal();
}
