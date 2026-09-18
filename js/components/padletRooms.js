import { PADLET_ROOMS } from "../data/rooms.js";

export function renderPadletRooms(container) {
  container.innerHTML = `
    <div class="padlet-view-wrapper">
      <div style="margin-bottom: 28px; text-align: center;">
        <h2 style="font-size: 32px; font-weight: 900; color: #0e3753; letter-spacing: -0.5px;">
          수업나눔방 (자료실)
        </h2>
        <p style="font-size: 15px; color: #64748b; margin-top: 6px;">
          교과 및 주제별 패들렛 나눔방에서 교실 수업 자료와 실천 아이디어를 확인하고 함께 나눠보세요.
        </p>
      </div>

      <!-- 8대 영역 패들렛 카드 그리드 -->
      <div class="padlet-cards-grid">
        ${PADLET_ROOMS.map(room => `
          <div class="padlet-card">
            <!-- 상단 일러스트 박스 -->
            <div class="padlet-illustration-box" style="background-color: ${room.bgColor};">
              ${room.illustration}
            </div>

            <div class="padlet-subject-tag">${room.subjectTag}</div>
            <h3 class="padlet-title">${room.title}</h3>
            <p class="padlet-desc">${room.desc}</p>

            <a href="${room.padletUrl}" target="_blank" rel="noopener noreferrer" class="padlet-action-link">
              <span>패들렛 바로가기</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
            </a>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}
