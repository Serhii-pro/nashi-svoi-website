const $ = (s, root = document) => root.querySelector(s);
const icon = (name) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ICONS.heart}</svg>`;
const progress = (value, label = "Прогрес збору") =>
  `<div class="progress" role="progressbar" aria-label="${label}" aria-valuenow="${value}" aria-valuemin="0" aria-valuemax="100"><span style="width:${value}%"></span></div>`;
const people = [
  { name: "Віктор, протез", p: 40, tone: "featured", key: "viktor" },
  { name: "Олег, операція", p: 85, tone: "tone-yellow" },
  { name: "Андрій, реабілітація", p: 22, tone: "tone-blue" },
  { name: "Максим, лікування опіків", p: 58, tone: "tone-peach" },
  { name: "Ігор, операція на хребет", p: 15, tone: "" },
  { name: "Сергій, протезування ноги", p: 70, tone: "tone-blue" },
  { name: "Роман, повторна операція", p: 33, tone: "tone-yellow" },
];
const funds =
  () => `<div class="page-intro"><h1>Збори <span class="count">7</span></h1></div>
<div class="fund-grid">${people.map((p) => `<${p.key ? 'a href="#viktor"' : 'button type="button" data-demo="person"'} class="fund-card ${p.tone}"><div class="card-top"><span class="avatar">${icon("person")}</span><span class="card-arrow">${icon("arrow")}</span></div><h2>${p.name}</h2>${progress(p.p, p.name)}</${p.key ? "a" : "button"}>`).join("")}</div>
<div class="support-grid"><section class="panel"><h2 class="eyebrow">ДЛЯ ВІЙСЬКОВИХ: ПОДАТИ СВІЙ ЗБІР</h2><div class="contact-row"><button class="contact" data-demo="contact">${icon("whatsapp")}<span>+380 XX XXX XX XX</span></button><button class="contact telegram" data-demo="contact">${icon("telegram")}<span>@Argus_bot</span></button><a href="https://www.tiktok.com/@bronyasvoih_offic" target="_blank" rel="noopener noreferrer" class="contact tiktok">${icon("tiktok")}<span>TikTok</span></a></div></section>
<section class="panel volunteers"><h2 class="eyebrow">ВОЛОНТЕРИ, ЯКІ НАС ПІДТРИМУЮТЬ</h2>${[0, 1].map((_, i) => `<div class="volunteer ${i ? "tone-yellow" : ""}"><span class="avatar">${icon("person")}</span><div><strong>${i === 0 ? "bronyasvoih_official" : "help.for.orphans"}</strong><p>напрям допомоги</p></div><a href="${i === 0 ? "https://www.instagram.com/bronyasvoih_official" : "https://www.instagram.com/help.for.orphans"}" target="_blank" rel="noopener noreferrer" class="icon-button" aria-label="Instagram волонтера ${i + 1}">${icon("instagram")}</a></div>`).join("")}</section></div>`;
const back = () =>
  `<a class="back" href="#funds">${icon("back")}<span>Збори</span></a>`;
const donation = (label) =>
  `<div class="donation"><a href="https://send.monobank.ua/jar/4hBqDMCoeA" target="_blank" rel="noopener noreferrer" class="primary">${icon("heart")}${label}</a></div>`;
const viktor =
  () => `${back()}<div class="detail-hero"><div class="portrait" role="img" aria-label="Ініціал Віктора — місце для його фотографії"><div class="portrait-inner"><span class="initial" aria-hidden="true">В</span></div><span class="portrait-badge">${icon("heart")}</span></div><section class="detail-info"><h1>Віктор, протезування ноги</h1><p class="detail-subtitle">Поранення отримане під Бахмутом</p>${donation("Задонатити")}</section></div>
<div class="detail-lower"><section class="panel"><h2 class="eyebrow">ІСТОРІЯ</h2><p class="story">Коротка розповідь про пораненого, обставини, чому потрібне саме протезування, і як це вплине на його життя.</p></section><section class="panel"><h2 class="eyebrow">ДОКУМЕНТАЦІЯ</h2><button class="document-row" data-demo="document">${icon("file")}<span>Довідка про поранення</span>${icon("external")}</button><button class="document-row" data-demo="document">${icon("file")}<span>Кошторис на лікування</span>${icon("external")}</button></section></div>`;
const needs = [
  ["shirt", "Одяг та речі першої потреби", "tone-yellow"],
  ["laptop", "Гаджети для навчання", "tone-blue"],
  ["medical", "Лікування дітей", "tone-peach"],
  ["home", "Забезпечення та утримання центру", ""],
  ["gift", "Солодощі та подарунки на свята", "tone-yellow"],
];
const children = () =>
  `${back()}<div class="children-layout"><section class="children-story"><span class="children-icon">${icon("heart")}</span><h1 class="quote">Це діти, які вже втратили більше, ніж мали б у своєму віці. Наша мета — щоб вони мали тепло, турботу і відчуття, що про них не забули.</h1></section><section class="children-fund" aria-label="Збір на допомогу дітям">${donation("Підтримати дітей")}<div class="statistics"><div class="stat"><strong>47</strong><span>дітей у центрі</span></div><div class="stat"><strong>3</strong><span>закриті потреби</span></div></div></section></div><section class="panel needs"><h2 class="eyebrow">НА ЩО ЙДУТЬ КОШТИ</h2><div class="needs-list">${needs.map(([type, text, tone]) => `<div class="need ${tone}"><span class="small-icon">${icon(type)}</span><span>${text}</span></div>`).join("")}</div></section>`;
const templates = { funds, viktor, children };

const notices = {
  person: [
    "Сторінка збору",
    "Для цього збору надано лише картку. Повний макет сторінки доступний для Віктора.",
  ],
  contact: [
    "Контакт із макета",
    "У вихідному макеті вказано приклад контакту. Справжнього номера чи посилання ще немає.",
  ],
  document: [
    "Документ із макета",
    "Назву збережено з наданого зображення. Сам файл документа не був доданий.",
  ],
};
function notice(kind) {
  const [title, text] = notices[kind];
  $("#notice-title").textContent = title;
  $("#notice-description").textContent = text;
  $("#notice").showModal();
}
function render() {
  const key = location.hash.slice(1) || "funds";
  const page = templates[key] ? key : "funds";
  $("#main").innerHTML = templates[page]();
  document.querySelectorAll("[data-page]").forEach((a) => {
    if (a.dataset.page === page) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
  document.title =
    {
      funds: "Збори",
      viktor: "Віктор, протезування ноги",
      children: "Підтримати дітей",
    }[page] + " — Наші свої";
  window.scrollTo(0, 0);
}
document
  .querySelectorAll("[data-icon]")
  .forEach((el) => (el.innerHTML = icon(el.dataset.icon)));
document.addEventListener("click", (e) => {
  const demo = e.target.closest("[data-demo]");
  if (demo) notice(demo.dataset.demo);
  if (e.target.closest("[data-close]")) $("#notice").close();
});
$("#notice").addEventListener("click", (e) => {
  if (e.target === $("#notice")) {
    const r = e.target.getBoundingClientRect();
    if (
      e.clientX < r.left ||
      e.clientX > r.right ||
      e.clientY < r.top ||
      e.clientY > r.bottom
    )
      e.target.close();
  }
});
window.addEventListener("hashchange", () => {
  render();
  $("#main").focus({ preventScroll: true });
});
render();
