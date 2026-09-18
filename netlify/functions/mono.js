const https = require("https");

// ВАЖНО: Замени ссылку на ту, что дал заказчик (для банки Діти-сироти)
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
        if (
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location
        ) {
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

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders, body: "" };
  }

  try {
    const html = await fetchUrl(JAR_URL);
    const stateMatch = html.match(/window\.state\s*=\s*(\{[\s\S]*?\});/);

    if (!stateMatch) {
      const altMatch = html.match(/window\["state"\]\s*=\s*(\{[\s\S]*?\})/);
      if (!altMatch) {
        const amountMatch = html.match(/"amount"\s*:\s*(\d+)/);
        const goalMatch = html.match(/"goal"\s*:\s*(\d+)/);

        if (amountMatch) {
          const amount = parseInt(amountMatch[1], 10);
          const goal = goalMatch ? parseInt(goalMatch[1], 10) : 0;
          const percent =
            goal > 0 ? Math.min(100, Math.round((amount / goal) * 100)) : 0;

          return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({
              amount,
              goal,
              percent,
              amountFormatted: formatUAH(amount),
              goalFormatted: goal > 0 ? formatUAH(goal) : "",
            }),
          };
        }
        throw new Error("window.state не найден в HTML");
      }
    }

    const raw = stateMatch ? stateMatch[1] : null;

    let state;
    try {
      state = JSON.parse(raw);
    } catch {
      const amountMatch = raw.match(/"amount"\s*:\s*(\d+)/);
      const goalMatch = raw.match(/"goal"\s*:\s*(\d+)/);

      if (!amountMatch) {
        throw new Error("Не удалось найти сумму в state");
      }

      const amount = parseInt(amountMatch[1], 10);
      const goal = goalMatch ? parseInt(goalMatch[1], 10) : 0;
      const percent =
        goal > 0 ? Math.min(100, Math.round((amount / goal) * 100)) : 0;

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          amount,
          goal,
          percent,
          amountFormatted: formatUAH(amount),
          goalFormatted: goal > 0 ? formatUAH(goal) : "",
        }),
      };
    }

    const rawAmount = state.jar?.amount ?? state.amount ?? 0;
    const rawGoal = state.jar?.goal ?? state.goal ?? 0;

    const amount = Math.round(rawAmount / 100);
    const goal = Math.round(rawGoal / 100);
    const percent =
      goal > 0 ? Math.min(100, Math.round((amount / goal) * 100)) : 0;

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        amount,
        goal,
        percent,
        amountFormatted: formatUAH(amount),
        goalFormatted: goal > 0 ? formatUAH(goal) : "",
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
    return amount.toLocaleString("uk-UA", { maximumFractionDigits: 0 }) + " ₴";
  }
  return amount + " ₴";
}
