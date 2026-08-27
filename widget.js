(function () {
  const currentScript = document.currentScript;
  if (!currentScript) return;

  const scriptUrl = new URL(currentScript.src);
  const params = scriptUrl.searchParams;

  const feedUrl = params.get("feed");
  const count = Math.min(parseInt(params.get("count") || "5", 10), 15);
  const showTitle = params.get("title") !== "0";
  const showDate = params.get("date") !== "0";
  const newTab = params.get("newtab") !== "0";

  if (!feedUrl) {
    console.error("RSS Widget: Kein Feed angegeben.");
    return;
  }

  const container = document.createElement("div");
  container.className = "seo-rss-widget";

  currentScript.parentNode.insertBefore(container, currentScript.nextSibling);

  const style = document.createElement("style");
  style.textContent = `
    .seo-rss-widget {
      font-family: Arial, Helvetica, sans-serif;
      line-height: 1.5;
      max-width: 100%;
    }

    .seo-rss-widget-title {
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 14px;
    }

    .seo-rss-widget-item {
      padding: 12px 0;
      border-bottom: 1px solid #e5e5e5;
    }

    .seo-rss-widget-item:last-child {
      border-bottom: 0;
    }

    .seo-rss-widget-item a {
      color: #111;
      text-decoration: none;
      font-weight: 700;
    }

    .seo-rss-widget-item a:hover {
      text-decoration: underline;
    }

    .seo-rss-widget-date {
      display: block;
      margin-top: 4px;
      font-size: 13px;
      color: #777;
    }

    .seo-rss-widget-message {
      padding: 12px;
      background: #f5f5f5;
      border-radius: 6px;
      color: #555;
    }
  `;

  document.head.appendChild(style);

  container.innerHTML =
    '<div class="seo-rss-widget-message">RSS Feed wird geladen...</div>';

  const apiUrl =
    "https://api.rss2json.com/v1/api.json?rss_url=" +
    encodeURIComponent(feedUrl);

  fetch(apiUrl)
    .then(function (response) {
      if (!response.ok) {
        throw new Error("Feed konnte nicht geladen werden.");
      }

      return response.json();
    })
    .then(function (data) {
      if (!data || data.status !== "ok" || !Array.isArray(data.items)) {
        throw new Error("Ungültiger RSS Feed.");
      }

      container.innerHTML = "";

      if (showTitle && data.feed && data.feed.title) {
        const title = document.createElement("div");
        title.className = "seo-rss-widget-title";
        title.textContent = data.feed.title;
        container.appendChild(title);
      }

      data.items.slice(0, count).forEach(function (item) {
        const article = document.createElement("div");
        article.className = "seo-rss-widget-item";

        const link = document.createElement("a");
        link.href = item.link || "#";
        link.textContent = item.title || "Artikel";

        if (newTab) {
          link.target = "_blank";
          link.rel = "noopener noreferrer";
        }

        article.appendChild(link);

        if (showDate && item.pubDate) {
          const date = document.createElement("span");
          date.className = "seo-rss-widget-date";

          const parsedDate = new Date(item.pubDate);

          if (!isNaN(parsedDate.getTime())) {
            date.textContent = parsedDate.toLocaleDateString("de-DE");
          }

          article.appendChild(date);
        }

        container.appendChild(article);
      });

      if (!data.items.length) {
        container.innerHTML =
          '<div class="seo-rss-widget-message">Keine Beiträge gefunden.</div>';
      }
    })
    .catch(function (error) {
      console.error("RSS Widget Fehler:", error);

      container.innerHTML =
        '<div class="seo-rss-widget-message">RSS Feed konnte nicht geladen werden.</div>';
    });
})();
