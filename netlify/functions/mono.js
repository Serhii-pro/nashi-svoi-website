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

    const response = await fetch(JAR_URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "uk-UA,uk;q=0.9",
        "Cache-Control": "no-cache",
      },
    });

    const html = await response.text();

    // Ищем значения суммы и цели напрямую в сыром коде всей страницы
    const amountMatch = html.match(/"amount"\s*:\s*(\d+)/);
    const goalMatch = html.match(/"goal"\s*:\s*(\d+)/);

    if (!amountMatch) {
      // Если даже так не нашло, выводим весь код в логи, чтобы найти, как они теперь это прячут
      console.log("Полный HTML страницы:", html);
      throw new Error("Не удалось найти 'amount' в коде страницы.");
    }

    // Монобанк хранит данные в копейках
    const rawAmount = parseInt(amountMatch[1], 10);
    const rawGoal = goalMatch ? parseInt(goalMatch[1], 10) : 0;

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
