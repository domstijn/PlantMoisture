<script>
    import "../app.css";
    import { gitCommitHash } from '$lib/version';

    let { children } = $props();

</script>

{@render children()}

<div class="version-container">
    <span>v:{gitCommitHash}</span>
</div>

<style>
    div.version-container {
        position: absolute;
        top: 10px;
        right: 10px;
        z-index: 1000;
    }

    div.version-container span {
        background-color: var(--bg-color-gray-inv);
        color: var(--text-info-color);
        padding: 4px 8px;
        border-radius: 6px;
        font-size: 8px;
        font-family: sans-serif;
    }
</style>
