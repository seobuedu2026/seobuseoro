export function renderHeader(container) {
  container.innerHTML = `
    <header class="hero-header">
      <div class="hero-header-inner">
        <!-- 메인 타이틀 (인쇄물 공식 그래픽 배너) -->
        <div class="main-title-wrap">
          <img 
            src="assets/images/title-logo.png?v=20260918_v7" 
            alt="2026학년도 2학기 서부서로 수업성장 캘린더 - 혼자가 아닌 함께 하는 서부, 서부가 서로에게 길(路)이 되어 줍니다." 
            class="header-official-logo-img" 
          />
        </div>
      </div>
    </header>
  `;
}
