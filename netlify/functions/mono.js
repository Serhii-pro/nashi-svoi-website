exports.handler = async function (event) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders, body: "" };
  }

  try {
    const API_URL = "https://send.monobank.ua/api/handler";
    const JAR_ID = "4hBqDMCoeA";

    // Формируем тело POST-запроса, как в оригинальном API
    const requestBody = {
      c: "hello",
      clientId: JAR_ID,
      referer: "",
    };

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Content-Type": "application/json",
        Accept: "application/json",
        Origin: "https://send.monobank.ua",
        Referer: `https://send.monobank.ua/jar/${JAR_ID}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`Ошибка API (Статус ${response.status}):`, errorText);
      throw new Error(`API Монобанка вернул статус ${response.status}`);
    }

    const data = await response.json();

    // Берем данные напрямую из структуры JSON-ответа
    const rawAmount = data.jarAmount ?? 0;
    const rawGoal = data.jarGoal ?? data.goal ?? 0;

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
        name: data.name || "",
        ownerName: data.ownerName || "",
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
