import { getPadletRooms } from "../data/rooms.js";
import { openRoomEditModal } from "./roomEditModal.js";
import { GoogleAuthService } from "../auth/googleAuth.js";

export function renderPadletRooms(container) {
  const user = GoogleAuthService.getCurrentUser();
  const isAdmin = !!(user && user.isAdmin);
  const rooms = getPadletRooms();

  container.innerHTML = `
    <div class="padlet-view-wrapper">
      <!-- 상단 타이틀 헤더 (한줄 정리) -->
      <div class="padlet-header-box">
        <div class="tab-header-single-line" style="margin-bottom: 0;">
          <h2 class="padlet-main-title">수업나눔방(자료실)</h2>
          <p class="padlet-sub-title">교과군별 패들렛에서 선생님들의 수업 사례를 자유롭게 나눠보세요.</p>
        </div>

        ${isAdmin ? `
          <div style="display: flex; justify-content: center; gap: 8px; margin-top: 14px;">
            <button id="btn-add-new-room" class="btn-admin-action">
              새 수업나눔방 추가
            </button>
          </div>
        ` : ''}
      </div>

      <!-- 8개 카드 4열 x 2행 그리드 (카드 전체가 링크 버튼 및 수정 기능 포함) -->
      <div class="padlet-cards-grid">
        ${rooms.map(room => `
          <div class="padlet-card-wrapper" style="position: relative;">
            <a href="${room.padletUrl}" target="_blank" rel="noopener noreferrer" class="padlet-card-item" title="${room.title} 바로가기">
              <div class="padlet-icon-box" style="background-color: ${room.iconBg || '#f0fdf4'};">
                <span class="padlet-icon-emoji">${room.icon || '📚'}</span>
              </div>
              ${(room.badge && room.badge !== '링크 준비중') ? `<span class="padlet-status-badge">${room.badge}</span>` : ''}
              <h3 class="padlet-room-title">${room.title}</h3>
              <p class="padlet-room-desc">${room.desc}</p>
            </a>
            
            ${isAdmin ? `
              <button class="btn-edit-padlet-room btn-admin-action" data-room-id="${room.id}" title="수업나눔방 정보 수정" style="position: absolute; top: 12px; right: 12px; z-index: 2;">
                수정
              </button>
            ` : ''}
          </div>
        `).join("")}
      </div>
    </div>
  `;

  // 새 수업나눔방 추가 이벤트
  const btnAdd = container.querySelector("#btn-add-new-room");
  if (btnAdd) {
    btnAdd.addEventListener("click", () => {
      openRoomEditModal(null, () => {
        renderPadletRooms(container);
      });
    });
  }

  // 각 룸별 수정 버튼 이벤트
  container.querySelectorAll(".btn-edit-padlet-room").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const roomId = btn.dataset.roomId;
      const targetRoom = rooms.find(r => r.id === roomId);
      if (targetRoom) {
        openRoomEditModal(targetRoom, () => {
          renderPadletRooms(container);
        });
      }
    });
  });
}
