# 프로젝트 설명

-   웹으로 먼저 출시하고(데스크탑 브라우저, 모바일 브라우저) 이후 Capacitor 같은 wrapper로 래핑해 스토어에 앱으로 출시 예정임(추후)

# 커맨드 룰

-   작업 완료 후 브라우저 테스트는 진행하지마.
-   git 커맨드는 확인 용도만 가능하고, 실제 git 상태가 바뀌거나 동작하는 커맨드는 절대 실행하지 말 것.

# Phaser 좌표 시스템

-   Phaser 씬의 공통 기준 좌표는 green safe area이다.
-   green safe area의 좌상단을 `(0, 0)`, 우하단을 `(1080, 1920)`으로 사용한다.
-   green safe area의 중앙 좌표는 `(540, 960)`이다.
-   브라우저 리사이즈/비율 변화로 Phaser 캔버스의 논리 크기가 바뀌어도 gameplay/UI 오브젝트 좌표는 이 safe area 기준을 유지해야 한다.
-   Phaser 씬에서는 `src/game/SafeArea.ts`의 `useSafeAreaCamera(this)`와 `SAFE_AREA_*` 상수를 사용한다.
-   일반 gameplay/UI 오브젝트 배치에는 `this.scale.width`, `this.scale.height`를 직접 기준으로 쓰지 말고 safe area 좌표계를 우선 사용한다.
-   green 밖의 파란/노란 확장 영역은 safe area 기준으로 음수 좌표 또는 `SAFE_AREA_WIDTH/HEIGHT`보다 큰 좌표 영역이다.
-   논리 캔버스는 safe area `1080 x 1920`을 기준으로 현재 화면비를 맞추는 데 필요한 축만 확장한다.
-   화면이 safe area보다 넓으면 세로 `1920`은 유지하고 가로만 확장해 파란 좌우 영역만 생기게 한다.
-   화면이 safe area보다 길면 가로 `1080`은 유지하고 세로만 확장해 노란 상하 영역만 생기게 한다.
-   safe area와 같은 비율에서는 확장 영역 없이 green 영역만 보이게 한다.
-   green 밖 확장 영역에는 배경 연장, 장식, 디버그/시스템 UI처럼 게임 밸런스에 직접 영향이 적은 요소를 우선 배치한다.
-   디버그용 full area 모드는 safe area 좌표계 자체는 바꾸지 않되, 게임 프레임/논리 캔버스를 full area 크기 `1440 x 2520`(비율 `4:7`)로 전환해 `9:21 ~ 3:4`에서 보일 수 있는 전체 확장 영역을 한 화면에 확인한다.
-   full area 모드에서도 gameplay/UI 오브젝트의 기준 좌표는 계속 green safe area 기준 `(0, 0) ~ (1080, 1920)`이다.
-   full area 모드는 색상 오버레이를 자동으로 켜지 않는다. 색상 영역 표시는 별도의 `safe area 보기` 디버그 옵션에서만 처리한다.

# DOM UI 좌표 시스템

-   Svelte/DOM UI도 Phaser와 동일하게 green safe area 기준 좌표계를 사용한다.
-   `src/routes/+page.svelte`의 `.dom-coordinate-layer`는 논리 크기 `1080px x 1920px`로 만들고, green safe area 중앙에 맞춘 뒤 `--dom-coordinate-scale`로 게임 프레임에 맞춰 스케일한다.
-   DOM UI 요소는 `.dom-coordinate-layer` 안에 배치하고, CSS의 `left`, `top`, `width`, `height`, `font-size`, `padding` 등은 safe area 논리 좌표/크기 기준 px 값으로 작성한다.
-   예: safe area 좌상단은 `left: 0; top: 0;`, 중앙은 `left: 540px; top: 960px;`, 우하단은 `left: 1080px; top: 1920px;` 기준이다.
-   DOM UI 요소는 브라우저 실제 픽셀에 직접 맞추기보다 `.dom-coordinate-layer`의 좌표계를 우선 사용해야 화면 크기가 바뀌어도 Phaser safe area와 같은 비율을 유지한다.
-   UI를 green safe area가 아니라 캔버스/화면 전체 가장자리에 붙여야 할 때는 `--dom-frame-left`, `--dom-frame-top`, `--dom-frame-right`, `--dom-frame-bottom`, `--dom-frame-width`, `--dom-frame-height` CSS 변수를 사용한다.
-   예: 화면 좌측에 붙일 때는 `left: var(--dom-frame-left);`, 화면 대부분을 채우는 팝업은 `left: calc(var(--dom-frame-left) + 60px); width: calc(var(--dom-frame-width) - 120px);`처럼 작성한다.
-   `--dom-frame-*` 값은 safe area 기준 좌표계 안에서 캔버스 전체 영역을 표현하므로, wide/tall 확장 영역에서는 음수 좌표 또는 `1080/1920`을 초과하는 좌표가 될 수 있다.
-   클릭 가능한 DOM UI는 coordinate layer가 `pointer-events: none`인 것을 고려해 해당 요소에 `pointer-events: auto`를 지정한다.
