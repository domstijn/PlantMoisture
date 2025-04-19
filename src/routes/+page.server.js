import { supabase } from "$lib/supabaseClient";

// depends is a function and needs to be passed into the load function
// load is automatically called by SvelteKit when the page is loaded
export async function load({ depends }) {
    // this allows us to invalidate based on the key passed in
    // see +page.svelte
    depends("app:moisture-data");

    try {
        // 1. Fetch data with error handling
        const { data, error } = await supabase
            .from("MoistureLevel")
            .select("values, datetime")
            .order("datetime", { ascending: false })
            .limit(10);

        if (error) throw error;
        if (!data || data.length === 0) {
            return {
                status: 404,
                error: new Error("No data found"),
            };
        }

        // 2. Calculate mean (with type safety)
        const values = data.map((item) => Number(item.values));
        const sum = values.reduce((acc, val) => acc + val, 0);
        const mean = sum / values.length;

        // 3. Get most recent datetime (already ordered)
        const lastDatetime = data[0].datetime;

        const { data: oldData, error: errorOld } = await supabase
            .from("MoistureLevel")
            .select("values, datetime")
            .lte(
                "datetime",
                new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString() // six hour ago
            )
            .order("datetime", { ascending: false })
            .limit(10);

        if (errorOld) throw errorOld;
        if (!oldData || oldData.length === 0) {
            return {
                status: 404,
                error: new Error("No older data found"),
            };
        }

        const oldValues = oldData.map((item) => Number(item.values));
        const sumOld = oldValues.reduce((acc, val) => acc + val, 0);
        const meanHourAgo = sumOld / oldValues.length;

        // Return formatted data
        return {
            mean: Number(mean.toFixed(2)), // Rounds to 2 decimal places
            lastDatetime: new Date(lastDatetime).toISOString(),
            meanHourAgo: Number(meanHourAgo.toFixed(2)), // Rounds to 2 decimal places
        };
    } catch (err) {
        return {
            status: 500,
            error: new Error(err.message),
        };
    }
}
