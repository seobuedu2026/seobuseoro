/**
 * 수업 나눔(이음) 교육콘서트 참여 안내문 팝업
 * - 안내문 PDF를 쪽별 이미지로 보여주고 원본 PDF 내려받기를 제공
 * - 오늘 하루 열지 않기 지원, SHOW_UNTIL 이후에는 자동으로 열지 않음
 */
const STORAGE_KEY_HIDE_UNTIL = "seobu_concert_guide_hide_until";
const SHOW_UNTIL = new Date("2026-11-19T00:00:00+09:00").getTime();

const GUIDE = {
  title: "수업 나눔(이음) 교육콘서트 참여 안내",
  subtitle: "2026. 11. 18.(수) 14:30~16:40 · 서울창서초등학교 4층",
  pdfUrl: "/assets/docs/concert-guide-2026-2.pdf",
  pdfName: "2026학년도 2학기 서부서로 수업 나눔(이음) 교육콘서트 안내문.pdf",
  pages: [
    { src: "/assets/images/concert-guide/guide-1.jpg", alt: "교육콘서트 참여 안내 (1/2쪽): 일시, 장소, 신청 방법과 교육콘서트에서 얻어 가는 좋은 점" },
    { src: "/assets/images/concert-guide/guide-2.jpg", alt: "교육콘서트 함께 나눌 이야기 (2/2쪽): 섹션별 1부·2부 발표 교사와 주제" }
  ]
};

function isHiddenToday() {
  try {
    const hideUntil = localStorage.getItem(STORAGE_KEY_HIDE_UNTIL);
    if (!hideUntil) return false;
    if (Date.now() < parseInt(hideUntil, 10)) return true;
    localStorage.removeItem(STORAGE_KEY_HIDE_UNTIL);
  } catch (e) {
    // localStorage를 쓸 수 없는 환경에서는 항상 보여준다
  }
  return false;
}

function setHiddenToday() {
  try {
    const tomorrowMidnight = new Date();
    tomorrowMidnight.setHours(24, 0, 0, 0);
    localStorage.setItem(STORAGE_KEY_HIDE_UNTIL, tomorrowMidnight.getTime().toString());
  } catch (e) {
    // 저장에 실패해도 팝업 동작에는 영향이 없다
  }
}

/**
 * 안내문 팝업을 띄운다. 띄우지 않은 경우 false를 반환한다.
 * onClosed: 팝업이 닫힌 뒤(또는 처음부터 열지 않는 경우 즉시) 호출된다.
 */
export function checkAndOpenConcertGuidePopup(onClosed) {
  if (Date.now() >= SHOW_UNTIL || isHiddenToday()) {
    if (onClosed) onClosed();
    return false;
  }
  openConcertGuidePopup(onClosed);
  return true;
}

export function openConcertGuidePopup(onClosed) {
  let mount = document.getElementById("concert-guide-mount");
  if (!mount) {
    mount = document.createElement("div");
    mount.id = "concert-guide-mount";
    document.body.appendChild(mount);
  }

  mount.innerHTML = `
    <div class="m3-modal-backdrop open" id="concert-guide-backdrop" role="dialog" aria-modal="true" aria-labelledby="concert-guide-title">
      <div class="m3-modal-dialog notice-popup-dialog concert-guide-dialog">
        <div class="notice-popup-header">
          <div class="notice-header-badge-wrap">
            <span class="notice-main-badge">참여 안내</span>
            <span class="notice-sub-tag">2026 서부서로 캘린더</span>
          </div>
          <div class="notice-header-actions">
            <button type="button" class="notice-close-btn" id="btn-concert-guide-close" aria-label="팝업 닫기">✕</button>
          </div>
        </div>

        <div class="notice-title-area">
          <h2 id="concert-guide-title" class="notice-title-heading">${GUIDE.title}</h2>
          <p class="notice-subtitle-desc">${GUIDE.subtitle}</p>
        </div>

        <div class="notice-body-scrollable">
          ${GUIDE.pages.map((page, idx) => `
            <img class="concert-guide-page-img" src="${page.src}" alt="${page.alt}" width="1313" height="1856" ${idx === 0 ? "" : 'loading="lazy"'} />
          `).join("")}
        </div>

        <div class="notice-popup-footer">
          <label class="notice-hide-today-label" for="chk-concert-guide-hide-today">
            <input type="checkbox" id="chk-concert-guide-hide-today" class="notice-checkbox" />
            <span>오늘 하루 동안 열지 않기</span>
          </label>
          <div class="notice-footer-btns">
            <a class="btn-notice-main-action concert-guide-pdf-btn" href="${GUIDE.pdfUrl}" download="${GUIDE.pdfName}" target="_blank" rel="noopener noreferrer">PDF 내려받기</a>
            <button type="button" id="btn-concert-guide-dismiss" class="btn-notice-close-action">닫기</button>
          </div>
        </div>
      </div>
    </div>
  `;

  const backdrop = mount.querySelector("#concert-guide-backdrop");
  const chkHideToday = mount.querySelector("#chk-concert-guide-hide-today");
  let closed = false;

  const onKeydown = (e) => {
    if (e.key === "Escape") closePopup();
  };

  const closePopup = () => {
    if (closed) return;
    closed = true;
    document.removeEventListener("keydown", onKeydown);
    if (chkHideToday && chkHideToday.checked) setHiddenToday();
    backdrop.classList.remove("open");
    setTimeout(() => {
      mount.innerHTML = "";
      if (onClosed) onClosed();
    }, 250);
  };

  mount.querySelector("#btn-concert-guide-close").addEventListener("click", closePopup);
  mount.querySelector("#btn-concert-guide-dismiss").addEventListener("click", closePopup);
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) closePopup();
  });
  document.addEventListener("keydown", onKeydown);
  mount.querySelector("#btn-concert-guide-close").focus();
}
