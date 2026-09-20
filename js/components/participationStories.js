// 승인된 참여 후기를 행사별로 묶어 '참여 이야기' 카드로 보여준다.
// 후기 문장을 '좋았던 점'과 '바라는 지원'으로 나누어 정리한다.

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

// 지원·개선 요청으로 읽히는 표현
const REQUEST_HINTS = [
  "바라", "바랍", "필요", "요청", "했으면", "해주", "하면 좋겠", "되면 좋겠",
  "원합", "아쉬", "부족", "더 많", "개선", "건의", "제공해", "늘려", "이어졌으면",
  "계속되었으면", "지속적", "추가로", "다양하게"
];

// 만족·배움으로 읽히는 표현
const POSITIVE_HINTS = [
  "좋았", "좋습", "유익", "도움", "감사", "만족", "인상", "배웠", "알게",
  "유용", "의미", "즐거", "편안", "공감", "새로웠", "명확", "이해"
];

function hasHint(text, hints) {
  return hints.some(h => text.includes(h));
}

// 후기 본문을 문장 단위로 자른다.
function splitSentences(content) {
  return String(content || "")
    .split(/(?<=[.!?。])\s+|\n+/)
    .map(s => s.trim().replace(/^[-·•]\s*/, ""))
    .filter(s => s.length >= 5);
}

// 문장들을 '좋았던 점' / '바라는 지원'으로 분류한다.
function classifySentences(reviews) {
  const liked = [];
  const wanted = [];

  reviews.forEach(rev => {
    splitSentences(rev.content).forEach(sentence => {
      if (hasHint(sentence, REQUEST_HINTS)) {
        wanted.push(sentence);
      } else if (hasHint(sentence, POSITIVE_HINTS)) {
        liked.push(sentence);
      } else {
        liked.push(sentence);
      }
    });
  });

  return {
    liked: dedupe(liked).slice(0, 5),
    wanted: dedupe(wanted).slice(0, 5)
  };
}

function dedupe(list) {
  return Array.from(new Set(list));
}

function formatEventDate(ev) {
  const year = ev.year || 2026;
  const month = parseInt(ev.month, 10);
  const day = parseInt(String(ev.day).replace(/\D/g, ""), 10);
  if (!month || !day) return `${year}년`;
  const d = new Date(year, month - 1, day);
  return `${year}. ${month}. ${day}.(${WEEKDAYS[d.getDay()]})`;
}

function escapeHtml(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * 참여 이야기 섹션 HTML 생성
 * @param {Array} reviews 전체 후기 목록
 * @param {Array} events 전체 행사 목록
 */
export function renderParticipationStories(reviews, events) {
  const approved = (reviews || []).filter(r => r.status !== "pending");
  if (approved.length === 0) return "";

  const byEvent = new Map();
  approved.forEach(rev => {
    if (!rev.eventId) return;
    if (!byEvent.has(rev.eventId)) byEvent.set(rev.eventId, []);
    byEvent.get(rev.eventId).push(rev);
  });
  if (byEvent.size === 0) return "";

  const eventMap = {};
  (events || []).forEach(ev => { eventMap[ev.id] = ev; });

  const cards = Array.from(byEvent.entries())
    .map(([eventId, list]) => ({ ev: eventMap[eventId], list }))
    .filter(item => !!item.ev)
    .sort((a, b) => {
      const am = parseInt(a.ev.month, 10) || 0;
      const bm = parseInt(b.ev.month, 10) || 0;
      if (am !== bm) return am - bm;
      const ad = parseInt(String(a.ev.day).replace(/\D/g, ""), 10) || 0;
      const bd = parseInt(String(b.ev.day).replace(/\D/g, ""), 10) || 0;
      return ad - bd;
    });

  if (cards.length === 0) return "";

  return `
    <section class="stories-section">
      <div class="stories-head">
        <p class="stories-eyebrow">함께 배우고 · 서로 나누고</p>
        <h2 class="stories-title">참여 이야기</h2>
        <p class="stories-desc">
          만남에서 얻은 배움, 현장에서 바라는 지원.<br />
          협의회와 연수에 함께한 선생님들의 이야기를 전합니다.
        </p>
      </div>

      <div class="stories-grid">
        ${cards.map(({ ev, list }) => {
          const { liked, wanted } = classifySentences(list);
          const headline = liked[0] || wanted[0] || "";

          return `
            <article class="story-card" data-story-id="${ev.id}">
              <div class="story-card-body">
                <div class="story-card-top">
                  <span class="prog-category-badge ${ev.categoryClass || 'cat-workshop'}">
                    ${escapeHtml(ev.categoryLabel || '연수·워크숍')}
                  </span>
                  <span class="story-date">${formatEventDate(ev)}</span>
                </div>

                <h3 class="story-title">${escapeHtml(ev.title || '프로그램')}</h3>
                ${ev.subtitle ? `<p class="story-subtitle">${escapeHtml(ev.subtitle)}</p>` : ''}

                <p class="story-meta">
                  ${escapeHtml(ev.location || '서부교육지원청')} · ${escapeHtml(ev.target || '관내 교원')}
                  <strong>${list.length}건</strong>
                </p>

                ${ev.description ? `
                  <p class="story-desc">${escapeHtml(ev.description)}</p>
                ` : ''}
              </div>

              ${headline ? `
                <div class="story-highlight">
                  <p class="story-highlight-label">참여 이야기 한눈에</p>
                  <p class="story-highlight-text">${escapeHtml(headline)}</p>
                </div>
              ` : ''}

              <button type="button" class="story-toggle" aria-expanded="false" data-story-toggle="${ev.id}">
                <span>참여 이야기 자세히 보기</span>
                <span class="story-toggle-icon" aria-hidden="true">+</span>
              </button>

              <div class="story-detail" id="story-detail-${ev.id}" hidden>
                ${liked.length ? `
                  <div class="story-detail-block">
                    <p class="story-detail-head">💬 이런 점이 좋았어요</p>
                    <ul class="story-detail-list">
                      ${liked.map(s => `<li>${escapeHtml(s)}</li>`).join("")}
                    </ul>
                  </div>
                ` : ''}

                ${wanted.length ? `
                  <div class="story-detail-block">
                    <p class="story-detail-head">🌱 이런 지원을 바랐어요</p>
                    <ul class="story-detail-list">
                      ${wanted.map(s => `<li>${escapeHtml(s)}</li>`).join("")}
                    </ul>
                  </div>
                ` : ''}
              </div>
            </article>
          `;
        }).join("")}
      </div>

      <p class="stories-footnote">
        참여 이야기는 선생님들이 등록해 주신 참여 후기를 바탕으로 정리했습니다.
      </p>
    </section>
  `;
}

// '+' 버튼 펼침/접기 동작 연결
export function bindParticipationStories(container) {
  container.querySelectorAll("[data-story-toggle]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.storyToggle;
      const detail = container.querySelector(`#story-detail-${CSS.escape(id)}`);
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
