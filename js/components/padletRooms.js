import { getPadletRooms, reorderPadletRooms, resetPadletRooms } from "../data/rooms.js";
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
          <div style="display: flex; flex-direction: column; align-items: center; gap: 8px; margin-top: 14px;">
            <div style="display: flex; justify-content: center; gap: 8px; flex-wrap: wrap;">
              <button id="btn-add-new-room" class="btn-admin-action" title="새로운 수업나눔방 카드를 추가합니다">
                ➕ 새 수업나눔방 추가
              </button>
              <button id="btn-reset-rooms-order" class="btn-admin-action" style="background: #f8fafc; color: #64748b; border-color: #cbd5e1;" title="수업나눔방 순서 및 목록을 초기 기본값으로 복원합니다">
                ↺ 기본 순서 복원
              </button>
            </div>
            <div style="font-size: 12.5px; color: #0e3753; font-weight: 700; background: #f0fdf4; border: 1px solid #bbf7d0; padding: 4px 12px; border-radius: 9999px; display: inline-flex; align-items: center; gap: 4px;">
              <span>💡</span> <span>카드를 마우스로 <strong>드래그 앤 드롭</strong>하여 위치를 자유롭게 변경할 수 있습니다.</span>
            </div>
          </div>
        ` : ''}
      </div>

      <!-- 8개 카드 4열 x 2행 그리드 (카드 전체가 링크 버튼 및 수정 기능 포함) -->
      <div class="padlet-cards-grid ${isAdmin ? 'admin-reorder-enabled' : ''}" id="padlet-cards-container">
        ${rooms.map((room, idx) => {
          return `
            <div 
              class="padlet-card-wrapper ${isAdmin ? 'admin-card-draggable' : ''}" 
              data-room-id="${room.id}" 
              data-index="${idx}"
              ${isAdmin ? 'draggable="true"' : ''}
              style="position: relative;"
            >
              <a href="${room.padletUrl}" target="_blank" rel="noopener noreferrer" class="padlet-card-item" title="${room.title} 바로가기" ${isAdmin ? 'draggable="false"' : ''}>
                <div class="padlet-icon-box" style="background-color: ${room.iconBg || '#f0fdf4'};">
                  <span class="padlet-icon-emoji">${room.icon || '📚'}</span>
                </div>
                ${(room.badge && room.badge !== '링크 준비중') ? `<span class="padlet-status-badge">${room.badge}</span>` : ''}
                <h3 class="padlet-room-title">${room.title}</h3>
                <p class="padlet-room-desc">${room.desc}</p>
              </a>
              
              ${isAdmin ? `
                <!-- 관리자 컨트롤 바 (드래그 핸들 & 수정 버튼) -->
                <div class="padlet-admin-card-controls">
                  <span class="padlet-drag-handle" title="카드를 끌어서 순서 변경">⠿ 이동</span>
                  <button type="button" class="btn-edit-padlet-room btn-admin-action" data-room-id="${room.id}" title="수업나눔방 정보 수정">
                    수정
                  </button>
                </div>
              ` : ''}
            </div>
          `;
        }).join("")}
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

  // 기본 순서 복원 이벤트
  const btnReset = container.querySelector("#btn-reset-rooms-order");
  if (btnReset) {
    btnReset.addEventListener("click", () => {
      if (confirm("수업나눔방의 위치와 목록을 초기 기본값으로 복원하시겠습니까?")) {
        resetPadletRooms();
        renderPadletRooms(container);
      }
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

  // 관리자 드래그 앤 드롭 순서 변경 바인딩
  if (isAdmin) {
    initDragAndDropReorder(container, () => {
      renderPadletRooms(container);
    });
  }
}

/**
 * 드래그 앤 드롭 위치 변경 이벤트 리스너 설정
 */
function initDragAndDropReorder(container, onReordered) {
  const cardWrappers = container.querySelectorAll(".admin-card-draggable");
  let draggedCard = null;
  let sourceIndex = -1;

  cardWrappers.forEach(card => {
    card.addEventListener("dragstart", (e) => {
      draggedCard = card;
      sourceIndex = parseInt(card.dataset.index, 10);
      card.classList.add("is-dragging");
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", sourceIndex.toString());
    });

    card.addEventListener("dragend", () => {
      card.classList.remove("is-dragging");
      cardWrappers.forEach(c => c.classList.remove("drag-over"));
      draggedCard = null;
      sourceIndex = -1;
    });

    card.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      if (draggedCard && card !== draggedCard) {
        card.classList.add("drag-over");
      }
    });

    card.addEventListener("dragleave", () => {
      card.classList.remove("drag-over");
    });

    card.addEventListener("drop", (e) => {
      e.preventDefault();
      e.stopPropagation();
      card.classList.remove("drag-over");
      
      const targetIndex = parseInt(card.dataset.index, 10);
      if (sourceIndex !== -1 && targetIndex !== -1 && sourceIndex !== targetIndex) {
        if (reorderPadletRooms(sourceIndex, targetIndex)) {
          if (onReordered) onReordered();
        }
      }
    });
  });
}
