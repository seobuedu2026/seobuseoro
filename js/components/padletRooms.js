import { PADLET_ROOMS } from "../data/rooms.js";

export function renderPadletRooms(container) {
  container.innerHTML = `
    <div class="padlet-view-wrapper">
      <!-- 상단 타이틀 헤더 (가운데 정렬) -->
      <div class="padlet-header-box" style="text-align: center; margin-bottom: 28px;">
        <h2 class="padlet-main-title" style="font-size: 32px; font-weight: 900; color: #0e3753; letter-spacing: -0.5px;">
          자료실 · 수업나눔방
        </h2>
        <p class="padlet-sub-title" style="font-size: 15px; color: #64748b; margin-top: 6px;">
          교과군별 패들렛에서 선생님들의 수업 사례를 자유롭게 나눠보세요.
        </p>
      </div>

      <!-- 8개 카드 4열 x 2행 그리드 -->
      <div class="padlet-cards-grid">
        ${PADLET_ROOMS.map(room => `
          <div class="padlet-card-item">
            <div class="padlet-card-top-bar">
              <div class="padlet-icon-box" style="background-color: ${room.iconBg};">
                <span class="padlet-icon-emoji">${room.icon}</span>
              </div>
              <span class="padlet-status-badge">${room.badge || '링크 준비중'}</span>
            </div>

            <h3 class="padlet-room-title">${room.title}</h3>
            <p class="padlet-room-desc">${room.desc}</p>

            <a href="${room.padletUrl}" target="_blank" rel="noopener noreferrer" class="padlet-direct-link">
              <span>패들렛 바로가기</span>
              <span class="link-arrow">→</span>
            </a>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}
