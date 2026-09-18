import { getPadletRooms } from "../data/rooms.js";
import { openRoomEditModal } from "./roomEditModal.js";

export function renderPadletRooms(container) {
  const rooms = getPadletRooms();

  container.innerHTML = `
    <div class="padlet-view-wrapper">
      <!-- 상단 타이틀 헤더 (가운데 정렬 및 추가 버튼) -->
      <div class="padlet-header-box">
        <h2 class="padlet-main-title">
          자료실 · 수업나눔방
        </h2>
        <p class="padlet-sub-title">
          교과군별 패들렛에서 선생님들의 수업 사례를 자유롭게 나눠보세요.
        </p>

        <div style="display: flex; justify-content: center; gap: 8px; margin-top: 16px;">
          <button id="btn-add-new-room" class="btn-m3-outlined" style="padding: 6px 16px; font-size: 13.5px; border-radius: 9999px; background: #ffffff;">
            <span>➕ 새 수업나눔방 추가</span>
          </button>
        </div>
      </div>

      <!-- 8개 카드 4열 x 2행 그리드 (카드 전체가 링크 버튼 및 수정 기능 포함) -->
      <div class="padlet-cards-grid">
        ${rooms.map(room => `
          <div class="padlet-card-wrapper" style="position: relative;">
            <a href="${room.padletUrl}" target="_blank" rel="noopener noreferrer" class="padlet-card-item" title="${room.title} 바로가기">
              <div class="padlet-icon-box" style="background-color: ${room.iconBg || '#f0fdf4'};">
                <span class="padlet-icon-emoji">${room.icon || '📚'}</span>
              </div>
              <span class="padlet-status-badge">${room.badge || '링크 바로가기'}</span>
              <h3 class="padlet-room-title">${room.title}</h3>
              <p class="padlet-room-desc">${room.desc}</p>
            </a>
            
            <button class="btn-edit-padlet-room btn-m3-outlined" data-room-id="${room.id}" title="수업나눔방 정보 수정" style="position: absolute; top: 12px; right: 12px; padding: 3px 8px; font-size: 11px; border-radius: 6px; font-weight: 800; background: rgba(255,255,255,0.9); z-index: 2;">
              ✏️ 수정
            </button>
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
