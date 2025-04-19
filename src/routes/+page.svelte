<script>
    import { invalidate } from "$app/navigation";
    import PlantInPot from "$lib/PlantInPot.svelte";

    let { data } = $props();

    // is used as callback function to force a reload of the page
    // invalidate is a SvelteKit function to invalidate the cache
    // it depends of the depends function in the +page.server.js file
    const rerunLoad = () => {
        invalidate('app:moisture-data');
    }

    // effect is a Svelte function to run a piece of code when the component is mounted
    // autorefreshes every 2 minutes, see information when hovering over effect
    $effect(() => {
        // setInterval calls callback every xxx milliseconds
		const interval = setInterval(rerunLoad, 120_000); 
		return () => clearInterval(interval); // cleanup when component unmounts
	});
</script>

<PlantInPot datetime={data.lastDatetime} meanValue={data.mean} meanValueHoursAgo={data.meanHourAgo}/>

<style>
    :global(html, body) {
        margin: 0;
        padding: 0;
        height: 100%;
        background-color: beige;
    }
    
</style>
