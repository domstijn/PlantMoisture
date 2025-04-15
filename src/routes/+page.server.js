import { supabase } from "$lib/supabaseClient";

export async function load() {
    try {
        // 1. Fetch data with error handling
        const { data, error } = await supabase
            .from("MoistureLevel")
            .select("values, datetime")
            .order("datetime", { ascending: false })
            .limit(5);

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

        // 4. Return formatted data
        return {
            props: {
                mean: Number(mean.toFixed(2)), // Rounds to 2 decimal places
                lastDatetime: new Date(lastDatetime).toISOString(),
            },
        };
    } catch (err) {
        return {
            status: 500,
            error: new Error(err.message),
        };
    }
}
