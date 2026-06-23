<script lang="ts">

    export let nickname = "";
    export let level = 1;
    export let currentExperience = 0;
    export let maxExperience = 100;
    export let portraitSrc = "/assets/beans/bean_1.png";

    $: safeMaxExperience = Math.max(1, maxExperience);
    $: safeCurrentExperience = Math.min(
        safeMaxExperience,
        Math.max(0, currentExperience)
    );
    $: experiencePercent = (safeCurrentExperience / safeMaxExperience) * 100;

</script>

<section class="profile-hud" aria-label="내 계정 정보">
    <div class="profile-portrait-frame" aria-hidden="true">
        <img class="profile-portrait" src={portraitSrc} alt="" draggable="false" />
    </div>

    <div class="profile-info">
        <div class="profile-name-row">
            <span class="profile-nickname" title={nickname}>{nickname}</span>
            <span class="profile-level">Lv.{level}</span>
        </div>

        <div class="profile-exp-track" aria-label={`경험치 ${safeCurrentExperience} / ${safeMaxExperience}`}>
            <div class="profile-exp-fill" style={`width: ${experiencePercent}%;`}></div>
            <span class="profile-exp-label">EXP {safeCurrentExperience}/{safeMaxExperience}</span>
        </div>
    </div>
</section>

<style>
    .profile-hud {
        position: absolute;
        left: calc(var(--dom-frame-left, 0px) + var(--dom-safe-left, 0px) + 32px);
        top: calc(var(--dom-frame-top, 0px) + var(--dom-safe-top, 0px) + 32px);
        z-index: 3;
        display: flex;
        align-items: center;
        box-sizing: border-box;
        width: 560px;
        min-height: 154px;
        padding: 16px 24px 16px 16px;
        border: 6px solid rgba(126, 82, 12, 0.96);
        border-radius: 34px;
        background: rgba(255, 248, 226, 0.94);
        box-shadow: 0 12px 22px rgba(0, 0, 0, 0.2);
        color: #4a2b17;
        font-family: "MabinogiClassic", sans-serif;
        pointer-events: none;
    }

    .profile-portrait-frame {
        display: flex;
        flex: 0 0 auto;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
        width: 112px;
        height: 112px;
        border: 6px solid #8e5c04;
        border-radius: 28px;
        background: #fff7d8;
        box-shadow: 0 6px 0 rgba(91, 57, 0, 0.26);
        overflow: hidden;
    }

    .profile-portrait {
        display: block;
        width: 88%;
        height: 88%;
        object-fit: contain;
        user-select: none;
        -webkit-user-drag: none;
    }

    .profile-info {
        display: flex;
        min-width: 0;
        flex: 1 1 auto;
        flex-direction: column;
        margin-left: 20px;
    }

    .profile-name-row {
        display: flex;
        align-items: center;
        min-width: 0;
        gap: 16px;
    }

    .profile-nickname {
        display: block;
        min-width: 0;
        overflow: hidden;
        color: #4a2b17;
        font-size: 32px;
        font-weight: 800;
        line-height: 1.16;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .profile-level {
        display: block;
        flex: 0 0 auto;
        padding: 8px 14px 7px;
        border-radius: 999px;
        background: #8e5c04;
        color: #fff7d8;
        font-size: 28px;
        font-weight: 800;
        line-height: 1;
    }

    .profile-exp-track {
        position: relative;
        box-sizing: border-box;
        height: 36px;
        margin-top: 20px;
        overflow: hidden;
        border: 5px solid #8e5c04;
        border-radius: 999px;
        background: rgba(74, 43, 23, 0.26);
    }

    .profile-exp-fill {
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(90deg, #ffdf3d 0%, #ff9f2f 100%);
    }

    .profile-exp-label {
        position: relative;
        z-index: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: #ffffff;
        paint-order: stroke fill;
        -webkit-text-stroke: 4px rgba(74, 43, 23, 0.9);
        font-size: 20px;
        font-weight: 800;
        line-height: 1;
    }
</style>