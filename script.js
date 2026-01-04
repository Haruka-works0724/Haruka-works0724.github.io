// theme switch
document.querySelectorAll("[data-set-theme]").forEach(btn => {
    btn.addEventListener("click", () => {
        document.documentElement.setAttribute("data-theme", btn.dataset.setTheme);
    });
});

// active dot nav
const navItems = [...document.querySelectorAll(".dotnav__item")];
const targets = navItems
    .map(a => document.querySelector(a.getAttribute("href")))
    .filter(Boolean);

const io = new IntersectionObserver((entries) => {
    const visible = entries
        .filter(e => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;

    navItems.forEach(a => a.classList.remove("is-active"));
    const id = "#" + visible.target.id;
    const active = navItems.find(a => a.getAttribute("href") === id);
    if (active) active.classList.add("is-active");
}, { rootMargin: "-35% 0px -55% 0px", threshold: [0.1, 0.2, 0.4, 0.6] });

targets.forEach(t => io.observe(t));

// ===== reveal: on load / on scroll / on nav click =====
const REVEAL_SELECTOR = ".reveal";

const revealObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
        if (!entry.isIntersecting) continue;

        const el = entry.target;
        const delay = Number(el.dataset.delay || 0);

        // ちょい遅延（なくてもOK）
        if (delay > 0) {
            setTimeout(() => el.classList.add("is-visible"), delay);
        } else {
            el.classList.add("is-visible");
        }
    }
}, {
    threshold: 0.12,
    rootMargin: "0px 0px -10% 0px",
});

function observeAllReveals(root = document) {
    root.querySelectorAll(REVEAL_SELECTOR).forEach((el) => {
        revealObserver.observe(el);
    });
}

function resetReveals(root) {
    const els = root.querySelectorAll(REVEAL_SELECTOR);
    els.forEach((el) => {
        el.classList.remove("is-visible");
        // もう一回 observer にかけ直す（再発火させる）
        revealObserver.observe(el);
    });
}

// 初回/更新時：まず隠して、次フレームで監視開始
window.addEventListener("DOMContentLoaded", () => {
    // ふわっと出したい要素を監視
    observeAllReveals();

    // もし「読み込み直後に一斉にふわっ」を強めたいなら：
    // requestAnimationFrame(() => observeAllReveals());
});

// ===== nav click: smooth scroll + replay reveal =====
document.querySelectorAll(".dotnav__item").forEach((a) => {
    a.addEventListener("click", (e) => {
        const href = a.getAttribute("href");
        if (!href || !href.startsWith("#")) return;

        const target = document.querySelector(href);
        if (!target) return;

        e.preventDefault();

        // クリックしたセクションのrevealをいったんリセットして、再発火させる
        resetReveals(target);

        // 既に画面内なら「その場で」再アニメ（scrollが起きない場合）
        const r = target.getBoundingClientRect();
        const inView = r.top < window.innerHeight * 0.6 && r.bottom > window.innerHeight * 0.2;

        if (inView) {
            // ちょい待ってから visible を付け直すと“ふわっ”が見える
            requestAnimationFrame(() => {
                target.querySelectorAll(REVEAL_SELECTOR).forEach((el, i) => {
                    setTimeout(() => el.classList.add("is-visible"), i * 55);
                });
            });
            return;
        }

        // 画面外ならスムーススクロール → observerが入ってきた瞬間に表示
        target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
});
