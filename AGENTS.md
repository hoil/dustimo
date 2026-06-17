# 프로젝트 설명

-   웹으로 먼저 출시하고(데스크탑 브라우저, 모바일 브라우저) 이후 Capacitor 같은 wrapper로 래핑해 스토어에 앱으로 출시 예정임(추후)

# 커맨드 룰

-   작업 완료 후 브라우저 테스트는 진행하지마.
-   git 커맨드는 확인 용도만 가능하고, 실제 git 상태가 바뀌거나 동작하는 커맨드는 절대 실행하지 말 것.

# 씬 별 구현내용을 아래에 정리하도록 해

-   {여기다가 리스트로 쭉쭉내려가면서}
    게임 프레임
-   width: 100%
-   height: 100dvh
-   max-width: 480px
-   max-height: 900px
-   화면 중앙 정렬

# Phaser 좌표 시스템

-   Phaser 씬의 공통 기준 좌표는 green safe area이다.
-   green safe area의 좌상단을 `(0, 0)`, 우하단을 `(1080, 1920)`으로 사용한다.
-   green safe area의 중앙 좌표는 `(540, 960)`이다.
-   브라우저 리사이즈/비율 변화로 Phaser 캔버스의 논리 크기가 바뀌어도 gameplay/UI 오브젝트 좌표는 이 safe area 기준을 유지해야 한다.
-   Phaser 씬에서는 `src/game/SafeArea.ts`의 `useSafeAreaCamera(this)`와 `SAFE_AREA_*` 상수를 사용한다.
-   일반 gameplay/UI 오브젝트 배치에는 `this.scale.width`, `this.scale.height`를 직접 기준으로 쓰지 말고 safe area 좌표계를 우선 사용한다.
-   green 밖의 파란/노란 확장 영역은 safe area 기준으로 음수 좌표 또는 `SAFE_AREA_WIDTH/HEIGHT`보다 큰 좌표 영역이다.
