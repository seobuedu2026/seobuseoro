// 협의회·연수 참여 이야기 카드 섹션
import { getStories } from "../data/stories.js";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function escapeHtml(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// 줄바꿈을 살려서 출력
function multiline(text) {
  return escapeHtml(text).replace(/\n/g, "<br />");
}

function formatDate(story) {
  const { year, month, day } = story;
  if (!month || !day) return "";
  const d = new Date(year || 2026, month - 1, day);
  return `${year || 2026}. ${month}. ${day}.(${WEEKDAYS[d.getDay()]})`;
}

/**
 * 참여 이야기 섹션 HTML 생성
 */
export function renderParticipationStories() {
  const stories = getStories();
  if (!Array.isArray(stories) || stories.length === 0) return "";

  const sorted = [...stories].sort((a, b) => {
    const ay = a.year || 0, by = b.year || 0;
    if (ay !== by) return ay - by;
    const am = a.month || 0, bm = b.month || 0;
    if (am !== bm) return am - bm;
    return (a.day || 0) - (b.day || 0);
  });

  return `
    <section class="stories-section">
      <div class="stories-head">
        <p class="stories-eyebrow">함께 배우고 · 서로 나누고</p>
        <h2 class="stories-title">수다박스 참여 이야기</h2>
        <p class="stories-desc">
          만남에서 얻은 배움, 현장에서 바라는 지원. 협의회와 연수에 함께한 선생님들의 이야기를 전합니다.
        </p>
      </div>

      <div class="stories-grid">
        ${sorted.map(story => `
          <article class="story-card" data-story-id="${escapeHtml(story.id)}">
            <div class="story-card-body">
              <div class="story-card-top">
                <span class="prog-category-badge ${escapeHtml(story.badgeClass || 'cat-mentoring')}">
                  ${escapeHtml(story.badge || '참여 이야기')}
                </span>
                <span class="story-date">${formatDate(story)}</span>
              </div>

              ${story.kicker ? `<p class="story-kicker">${escapeHtml(story.kicker)}</p>` : ''}

              <h3 class="story-title">${multiline(story.title)}</h3>
              ${story.subtitle ? `<p class="story-subtitle">${escapeHtml(story.subtitle)}</p>` : ''}
              ${story.meta ? `<p class="story-meta">${escapeHtml(story.meta)}</p>` : ''}
              ${story.description ? `<p class="story-desc">${escapeHtml(story.description)}</p>` : ''}
            </div>

            ${story.highlight ? `
              <div class="story-highlight">
                <p class="story-highlight-label">참여 이야기 한눈에</p>
                <p class="story-highlight-text">${multiline(story.highlight)}</p>
              </div>
            ` : ''}

            <button type="button" class="story-toggle" aria-expanded="false"
                    aria-controls="story-detail-${escapeHtml(story.id)}"
                    data-story-toggle="${escapeHtml(story.id)}">
              <span>참여 이야기 자세히 보기</span>
              <span class="story-toggle-icon" aria-hidden="true">+</span>
            </button>

            <div class="story-detail" id="story-detail-${escapeHtml(story.id)}" hidden>
              ${(story.liked && story.liked.length) ? `
                <div class="story-detail-block">
                  <p class="story-detail-head">💬 이런 점이 좋았어요</p>
                  <ul class="story-detail-list">
                    ${story.liked.map(s => `<li>${escapeHtml(s)}</li>`).join("")}
                  </ul>
                </div>
              ` : ''}

              ${(story.wanted && story.wanted.length) ? `
                <div class="story-detail-block">
                  <p class="story-detail-head">🌱 이런 지원을 바랐어요</p>
                  <ul class="story-detail-list">
                    ${story.wanted.map(s => `<li>${escapeHtml(s)}</li>`).join("")}
                  </ul>
                </div>
              ` : ''}
            </div>
          </article>
        `).join("")}
      </div>

      <p class="stories-footnote">
        참여 이야기는 협의회·연수 참여 후기 자료를 바탕으로 요약·정리했습니다. 개별 참여자가 직접 등록한 게시물은 아닙니다.
      </p>
    </section>
  `;
}

// '+' 버튼 펼침/접기 동작 연결
export function bindParticipationStories(container) {
  container.querySelectorAll("[data-story-toggle]").forEach(btn => {
    btn.addEventListener("click", () => {
      const detail = container.querySelector(`#${CSS.escape(btn.getAttribute("aria-controls"))}`);
      if (!detail) return;

      const willOpen = detail.hasAttribute("hidden");
      if (willOpen) {
        detail.removeAttribute("hidden");
      } else {
        detail.setAttribute("hidden", "");
      }
      btn.setAttribute("aria-expanded", String(willOpen));
      btn.classList.toggle("is-open", willOpen);
      const icon = btn.querySelector(".story-toggle-icon");
      if (icon) icon.textContent = willOpen ? "−" : "+";
    });
  });
}
