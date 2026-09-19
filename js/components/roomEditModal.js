import { updatePadletRoom, addPadletRoom, deletePadletRoom } from "../data/rooms.js";

/**
 * 수업나눔방(패들렛 룸) 수정/추가 모달
 * @param {Object|null} roomObj 수정할 룸 객체 (null이면 새 룸 추가)
 * @param {Function} onSaved 저장 후 콜백 함수
 */
export function openRoomEditModal(roomObj, onSaved) {
  const mount = document.getElementById("modal-mount");
  if (!mount) return;

  const isEdit = !!(roomObj && roomObj.id);
  const room = roomObj || {
    id: "",
    icon: "📚",
    iconBg: "#f0fdf4",
    title: "",
    desc: "",
    padletUrl: "https://padlet.com",
    badge: "링크 바로가기"
  };

  mount.innerHTML = `
    <div class="m3-modal-backdrop open" id="room-edit-backdrop">
      <div class="m3-modal-dialog" style="max-width: 480px;">
        <div class="modal-header">
          <h3 style="font-size: 19px; font-weight: 900; color: #0e3753; display: flex; align-items: center; gap: 8px;">
            <span>${isEdit ? '✏️ 수업나눔방 정보 수정' : '➕ 새 수업나눔방 추가'}</span>
          </h3>
          <button class="modal-close-btn" id="btn-close-room-modal" aria-label="닫기">✕</button>
        </div>

        <form id="room-edit-form">
          <div class="form-group" style="margin-bottom: 14px;">
            <label style="font-weight: 800; font-size: 14px; color: #0e3753;">수업나눔방 제목</label>
            <input type="text" id="room-title-input" class="m3-input" value="${room.title || ''}" placeholder="예: 국어·독서·도덕 수업나눔방" required style="padding: 10px 12px; font-size: 14.5px;" />
          </div>

          <div class="form-group" style="margin-bottom: 14px;">
            <label style="font-weight: 800; font-size: 14px; color: #0e3753;">패들렛 / 자료실 링크 URL</label>
            <input type="url" id="room-url-input" class="m3-input" value="${room.padletUrl || ''}" placeholder="https://padlet.com/..." required style="padding: 10px 12px; font-size: 14.5px;" />
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px;">
            <div class="form-group" style="margin-bottom: 0;">
              <label style="font-weight: 800; font-size: 14px; color: #0e3753;">아이콘 (이모지)</label>
              <input type="text" id="room-icon-input" class="m3-input" value="${room.icon || '📚'}" placeholder="예: 📖, 🎨, 🤖" style="padding: 10px 12px; font-size: 15px; text-align: center;" />
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label style="font-weight: 800; font-size: 14px; color: #0e3753;">상태 뱃지 문구 (선택)</label>
              <input type="text" id="room-badge-input" class="m3-input" value="${(room.badge && room.badge !== '링크 준비중') ? room.badge : ''}" placeholder="미입력 시 뱃지 미표시" style="padding: 10px 12px; font-size: 14px;" />
            </div>
          </div>

          <div class="form-group" style="margin-bottom: 20px;">
            <label style="font-weight: 800; font-size: 14px; color: #0e3753;">나눔방 세부 설명</label>
            <textarea id="room-desc-input" class="m3-textarea" rows="3" placeholder="수업나눔방에 대한 간단한 설명을 입력하세요." style="padding: 10px 12px; font-size: 14px; resize: vertical;">${room.desc || ''}</textarea>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px;">
            <div>
              ${isEdit ? `
                <button type="button" id="btn-delete-room" class="btn-admin-action danger">
                  삭제
                </button>
              ` : ''}
            </div>
            <div style="display: flex; gap: 8px;">
              <button type="button" id="btn-cancel-room" class="btn-admin-action">취소</button>
              <button type="submit" class="btn-admin-action filled">저장하기</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  `;

  const backdrop = mount.querySelector("#room-edit-backdrop");
  const closeBtn = mount.querySelector("#btn-close-room-modal");
  const cancelBtn = mount.querySelector("#btn-cancel-room");
  const deleteBtn = mount.querySelector("#btn-delete-room");
  const form = mount.querySelector("#room-edit-form");

  const closeModal = () => {
    backdrop.classList.remove("open");
    setTimeout(() => {
      if (mount.querySelector("#room-edit-backdrop") === backdrop) {
        mount.innerHTML = "";
      }
    }, 200);
  };

  closeBtn.addEventListener("click", (e) => { e.stopPropagation(); closeModal(); });
  cancelBtn.addEventListener("click", (e) => { e.stopPropagation(); closeModal(); });
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) closeModal();
  });

  if (deleteBtn) {
    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (confirm(`'${room.title}' 수업나눔방을 정말 삭제하시겠습니까?`)) {
        deletePadletRoom(room.id);
        closeModal();
        if (onSaved) onSaved();
      }
    });
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = mount.querySelector("#room-title-input").value.trim();
    const padletUrl = mount.querySelector("#room-url-input").value.trim();
    const icon = mount.querySelector("#room-icon-input").value.trim() || "📚";
    const badge = mount.querySelector("#room-badge-input").value.trim();
    const desc = mount.querySelector("#room-desc-input").value.trim();

    if (!title) {
      alert("나눔방 제목을 입력해주세요.");
      return;
    }

    if (isEdit) {
      updatePadletRoom({
        id: room.id,
        title,
        padletUrl,
        icon,
        iconBg: room.iconBg || "#f0fdf4",
        badge,
        desc
      });
    } else {
      addPadletRoom({
        title,
        padletUrl,
        icon,
        iconBg: "#f0fdf4",
        badge,
        desc
      });
    }

    closeModal();
    if (onSaved) onSaved();
  });
}
