exports.handler = async function (event) {
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
    const JAR_URL = "https://send.monobank.ua/jar/4hBqDMCoeA";

    // Используем современный fetch с имитацией реального браузера
    const response = await fetch(JAR_URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "uk-UA,uk;q=0.9,en-US;q=0.8,en;q=0.7",
        "Cache-Control": "no-cache",
      },
    });

    const html = await response.text();
    const stateMatch =
      html.match(/window\.state\s*=\s*(\{[\s\S]*?\});/) ||
      html.match(/window\["state"\]\s*=\s*(\{[\s\S]*?\})/);

    // Если данные не найдены, выводим кусок HTML в логи Netlify для диагностики
    if (!stateMatch) {
      console.log(
        "Полученный HTML (первые 300 символов):",
        html.substring(0, 300),
      );
      throw new Error(
        "window.state не найден. Скорее всего, Монобанк заблокировал запрос (Cloudflare).",
      );
    }

    const state = JSON.parse(stateMatch[1]);
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
