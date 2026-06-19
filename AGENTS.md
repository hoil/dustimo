# 프로젝트 설명

-   웹으로 먼저 출시하고(데스크탑 브라우저, 모바일 브라우저) 이후 Capacitor 같은 wrapper로 래핑해 스토어에 앱으로 출시 예정임(추후)

# 커맨드 룰

-   작업 완료 후 브라우저 테스트는 진행하지마.
-   git 커맨드는 확인 용도만 가능하고, 실제 git 상태가 바뀌거나 동작하는 커맨드는 절대 실행하지 말 것.

# 좌표/영역 용어

-   **디폴트 영역(default area)**: 브라우저 화면비 변화와 상하/좌우 추가 여백 여부와 상관없이 항상 보여야 하는 기본 게임 영역이다.
-   디폴트 영역은 기존 green 영역을 의미하며, 좌상단을 `(0, 0)`, 우하단을 `(1080, 1920)`으로 사용한다.
-   디폴트 영역의 중앙 좌표는 `(540, 960)`이다.
-   **추가 여백 영역(extra area)**: 화면비 대응을 위해 디폴트 영역 밖에 추가로 생기는 상하 또는 좌우 공간이다. 기존 파란/노란 확장 영역을 의미한다.
-   **safe area**: iOS 노치, 홈 인디케이터, 모바일 기기 하단 방해 요소처럼 OS/기기 UI와 겹치지 않도록 제외한 실제 안전 영역이다.
-   앞으로 `safe area`라는 용어는 OS/기기 방해 요소를 제외한 영역에만 사용하고, `(0, 0) ~ (1080, 1920)` 기준 영역은 `디폴트 영역`이라고 부른다.
-   현재 코드의 `SAFE_AREA_*`, `useSafeAreaCamera`, `--dom-safe-*` 등 기존 이름은 과거 용어가 남아있는 것이다. 새 작업에서는 의미를 구분해서 문서/주석/새 변수명을 작성한다.

# Phaser 좌표 시스템

-   Phaser 씬의 공통 기준 좌표는 디폴트 영역이다.
-   브라우저 리사이즈/비율 변화로 Phaser 캔버스의 논리 크기가 바뀌어도 gameplay/UI 오브젝트 좌표는 디폴트 영역 기준을 유지해야 한다.
-   Phaser 씬에서는 `src/game/SafeArea.ts`의 `useSafeAreaCamera(this)`와 `SAFE_AREA_*` 상수를 사용하되, 이 값들은 의미상 디폴트 영역 크기/좌표를 나타낸다.
-   일반 gameplay/UI 오브젝트 배치에는 `this.scale.width`, `this.scale.height`를 직접 기준으로 쓰지 말고 디폴트 영역 좌표계를 우선 사용한다.
-   디폴트 영역 밖의 추가 여백 영역은 디폴트 영역 기준으로 음수 좌표 또는 `1080/1920`보다 큰 좌표 영역이다.
-   논리 캔버스는 디폴트 영역 `1080 x 1920`을 기준으로 현재 화면비를 맞추는 데 필요한 축만 확장한다.
-   화면이 디폴트 영역보다 넓으면 세로 `1920`은 유지하고 가로만 확장해 좌우 추가 여백 영역만 생기게 한다.
-   화면이 디폴트 영역보다 길면 가로 `1080`은 유지하고 세로만 확장해 상하 추가 여백 영역만 생기게 한다.
-   디폴트 영역과 같은 비율에서는 추가 여백 영역 없이 디폴트 영역만 보이게 한다.
-   추가 여백 영역에는 배경 연장, 장식, 디버그/시스템 UI처럼 게임 밸런스에 직접 영향이 적은 요소를 우선 배치한다.
-   디버그용 full area 모드는 디폴트 영역 좌표계 자체는 바꾸지 않되, 게임 프레임/논리 캔버스를 full area 크기 `1440 x 2520`(비율 `4:7`)로 전환해 `9:21 ~ 3:4`에서 보일 수 있는 전체 추가 여백 영역을 한 화면에 확인한다.
-   full area 모드에서도 gameplay/UI 오브젝트의 기준 좌표는 계속 디폴트 영역 기준 `(0, 0) ~ (1080, 1920)`이다.
-   full area 모드는 색상 오버레이를 자동으로 켜지 않는다. 색상 영역 표시는 별도의 `safe area 보기` 디버그 옵션에서만 처리한다.

# DOM UI 좌표 시스템

-   Svelte/DOM UI도 Phaser와 동일하게 디폴트 영역 기준 좌표계를 사용한다.
-   `src/routes/+page.svelte`의 `.dom-coordinate-layer`는 논리 크기 `1080px x 1920px`로 만들고, 디폴트 영역 중앙에 맞춘 뒤 `--dom-coordinate-scale`로 게임 프레임에 맞춰 스케일한다.
-   DOM UI 요소는 `.dom-coordinate-layer` 안에 배치하고, CSS의 `left`, `top`, `width`, `height`, `font-size`, `padding` 등은 디폴트 영역 논리 좌표/크기 기준 px 값으로 작성한다.
-   예: 디폴트 영역 좌상단은 `left: 0; top: 0;`, 중앙은 `left: 540px; top: 960px;`, 우하단은 `left: 1080px; top: 1920px;` 기준이다.
-   DOM UI 요소는 브라우저 실제 픽셀에 직접 맞추기보다 `.dom-coordinate-layer`의 좌표계를 우선 사용해야 화면 크기가 바뀌어도 Phaser 디폴트 영역과 같은 비율을 유지한다.
-   UI를 디폴트 영역이 아니라 캔버스/화면 전체 가장자리에 붙여야 할 때는 `--dom-frame-left`, `--dom-frame-top`, `--dom-frame-right`, `--dom-frame-bottom`, `--dom-frame-width`, `--dom-frame-height` CSS 변수를 사용한다.
-   예: 화면 좌측에 붙일 때는 `left: var(--dom-frame-left);`, 화면 대부분을 채우는 팝업은 `left: calc(var(--dom-frame-left) + 60px); width: calc(var(--dom-frame-width) - 120px);`처럼 작성한다.
-   `--dom-frame-*` 값은 디폴트 영역 기준 좌표계 안에서 캔버스 전체 영역을 표현하므로, wide/tall 추가 여백 영역에서는 음수 좌표 또는 `1080/1920`을 초과하는 좌표가 될 수 있다.
-   iOS 노치/홈 인디케이터 같은 OS/기기 방해 요소를 피해야 하는 DOM UI는 safe area 값인 `--dom-safe-top`, `--dom-safe-right`, `--dom-safe-bottom`, `--dom-safe-left`를 함께 사용한다.
-   예: 화면 상단에 붙는 UI는 `top: calc(var(--dom-frame-top) + var(--dom-safe-top) + 32px);`, 화면 대부분을 채우는 팝업은 `height: calc(var(--dom-frame-height) - var(--dom-safe-top) - var(--dom-safe-bottom) - 120px);`처럼 작성한다.
-   클릭 가능한 DOM UI는 coordinate layer가 `pointer-events: none`인 것을 고려해 해당 요소에 `pointer-events: auto`를 지정한다.
