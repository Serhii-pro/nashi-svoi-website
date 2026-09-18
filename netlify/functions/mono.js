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

  const JAR_ID = "4hBqDMCoeA";

  try {
    // ── Запрос 1: основные данные банки через handler API ──────────────────
    const handlerRes = await fetch("https://send.monobank.ua/api/handler", {
      method: "POST",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Content-Type": "application/json",
        Accept: "application/json",
        Origin: "https://send.monobank.ua",
        Referer: `https://send.monobank.ua/jar/${JAR_ID}`,
      },
      body: JSON.stringify({ c: "hello", clientId: JAR_ID, referer: "" }),
    });

    if (!handlerRes.ok) {
      const txt = await handlerRes.text();
      console.error(`handler API error ${handlerRes.status}:`, txt);
      throw new Error(`Monobank handler returned ${handlerRes.status}`);
    }

    const data = await handlerRes.json();
    console.log("handler response keys:", Object.keys(data));
    console.log("handler response:", JSON.stringify(data).slice(0, 600));

    // ── Пробуємо всі можливі поля в яких Monobank зберігає суму ──────────
    const rawAmount =
      data.jarAmount ??
      data.amount ??
      data.jar?.amount ??
      data.data?.jarAmount ??
      data.data?.amount ??
      0;

    const rawGoal =
      data.jarGoal ??
      data.goal ??
      data.jar?.goal ??
      data.data?.jarGoal ??
      data.data?.goal ??
      0;

    // Monobank зберігає суми в копійках (1 грн = 100 коп)
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
        name: data.name ?? data.jar?.name ?? "",
        ownerName: data.ownerName ?? data.jar?.ownerName ?? "",
        // debug: відправляємо сирі дані щоб побачити структуру
        _raw: {
          jarAmount: data.jarAmount,
          jarGoal: data.jarGoal,
          amount: data.amount,
          goal: data.goal,
          keys: Object.keys(data),
        },
      }),
    };
  } catch (err) {
    console.error("mono.js error:", err.message);

    // ── Fallback: спробуємо публічний REST API Monobank ───────────────────
    try {
      const publicRes = await fetch(
        `https://api.monobank.ua/bank/jar/${JAR_ID}`,
        {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
        }
      );
      if (publicRes.ok) {
        const pub = await publicRes.json();
        console.log("public API response:", JSON.stringify(pub).slice(0, 400));

        const amount = Math.round((pub.amount ?? 0) / 100);
        const goal = Math.round((pub.goal ?? 0) / 100);
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
            name: pub.title ?? "",
            ownerName: pub.ownerName ?? "",
          }),
        };
      }
    } catch (fallbackErr) {
      console.error("Fallback also failed:", fallbackErr.message);
    }

    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: err.message }),
    };
  }
};

function formatUAH(amount) {
  if (amount >= 1_000_000) {
    return (amount / 1_000_000).toFixed(2).replace(".", ",") + " млн ₴";
  }
  if (amount >= 1000) {
    return amount.toLocaleString("uk-UA", { maximumFractionDigits: 0 }) + " ₴";
  }
  return amount + " ₴";
}
