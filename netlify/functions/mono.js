const https = require("https");

const JAR_URL = "https://send.monobank.ua/jar/4hBqDMCoeA";

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "uk,en;q=0.9",
        "Cache-Control": "no-cache",
      },
    };
    https
      .get(url, options, (res) => {
        // Follow redirect
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return fetchUrl(res.headers.location).then(resolve).catch(reject);
        }
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve(data));
      })
      .on("error", reject);
  });
}

exports.handler = async function (event, context) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders, body: "" };
  }

  try {
    const html = await fetchUrl(JAR_URL);

    // Extract window.state = {...} from the HTML
    // Monobank embeds it as: window.state = {...};
    const stateMatch = html.match(/window\.state\s*=\s*(\{[\s\S]*?\});/);

    if (!stateMatch) {
      // Try alternative pattern — sometimes it's without semicolon or inside script
      const altMatch = html.match(/window\["state"\]\s*=\s*(\{[\s\S]*?\})/);
      if (!altMatch) {
        // Fallback: try to find amount/goal via meta tags or specific data patterns
        const amountMatch = html.match(/"amount"\s*:\s*(\d+)/);
        const goalMatch = html.match(/"goal"\s*:\s*(\d+)/);

        if (amountMatch && goalMatch) {
          const amount = parseInt(amountMatch[1], 10);
          const goal = parseInt(goalMatch[1], 10);
          const percent = goal > 0 ? Math.min(100, Math.round((amount / goal) * 100)) : 0;
          return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({
              amount,
              goal,
              percent,
              amountFormatted: formatUAH(amount),
              goalFormatted: formatUAH(goal),
            }),
          };
        }

        throw new Error("window.state not found in page HTML");
      }
    }

    const raw = stateMatch ? stateMatch[1] : null;

    // Parse the extracted object safely
    // Monobank uses standard JSON-like state object
    let state;
    try {
      state = JSON.parse(raw);
    } catch {
      // Sometimes it contains JS expressions — use a safer extraction
      const amountMatch = raw.match(/"amount"\s*:\s*(\d+)/);
      const goalMatch = raw.match(/"goal"\s*:\s*(\d+)/);

      if (!amountMatch || !goalMatch) {
        throw new Error("Could not parse amount/goal from state");
      }

      const amount = parseInt(amountMatch[1], 10);
      const goal = parseInt(goalMatch[1], 10);
      const percent = goal > 0 ? Math.min(100, Math.round((amount / goal) * 100)) : 0;

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          amount,
          goal,
          percent,
          amountFormatted: formatUAH(amount),
          goalFormatted: formatUAH(goal),
        }),
      };
    }

    // Monobank stores amounts in kopiiky (1/100 of hryvnia)
    // amount is in hundredths of UAH
    const rawAmount = state.jar?.amount ?? state.amount ?? 0;
    const rawGoal = state.jar?.goal ?? state.goal ?? 0;

    // Convert from kopiiky to hryvnias
    const amount = Math.round(rawAmount / 100);
    const goal = Math.round(rawGoal / 100);
    const percent = goal > 0 ? Math.min(100, Math.round((amount / goal) * 100)) : 0;

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        amount,
        goal,
        percent,
        amountFormatted: formatUAH(amount),
        goalFormatted: formatUAH(goal),
        jarTitle: state.jar?.title ?? state.title ?? "",
        ownerName: state.jar?.ownerName ?? state.ownerName ?? "",
      }),
    };
  } catch (err) {
    console.error("mono.js error:", err.message);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: err.message }),
    };
  }
};

function formatUAH(amount) {
  if (amount >= 1000) {
    return (
      amount.toLocaleString("uk-UA", { maximumFractionDigits: 0 }) + " ₴"
    );
  }
  return amount + " ₴";
}
