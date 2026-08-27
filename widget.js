(function () {
  "use strict";

  function getCurrentScript() {
    if (document.currentScript) {
      return document.currentScript;
    }

    const scripts = document.getElementsByTagName("script");

    for (let i = scripts.length - 1; i >= 0; i--) {
      const src = scripts[i].src || "";

      if (
        src.indexOf("widget.js") !== -1 &&
        src.indexOf("rss-widget-generator") !== -1
      ) {
        return scripts[i];
      }
    }

    return null;
  }

  function initWidget() {
    const script = getCurrentScript();

    if (!script) {
      console.error("RSS Widget: Script konnte nicht erkannt werden.");
      return;
    }

    let scriptUrl;

    try {
      scriptUrl = new URL(script.src, window.location.href);
    } catch (error) {
      console.error("RSS Widget: Ungültige Script-URL.");
      return;
    }

    const params = scriptUrl.searchParams;

    const feedUrl = params.get("feed");

    let count = parseInt(params.get("count") || "5", 10);

    if (isNaN(count)) {
      count = 5;
    }

    count = Math.max(1, Math.min(count, 15));

    const showTitle = params.get("title") !== "0";
    const showDate = params.get("date") !== "0";
    const newTab = params.get("newtab") !== "0";

    if (!feedUrl) {
      console.error("RSS Widget: Kein RSS Feed angegeben.");
      return;
    }

    const container = document.createElement("div");
    container.className = "seo-rss-widget";

    if (script.parentNode) {
      script.parentNode.insertBefore(container, script.nextSibling);
    } else {
      document.body.appendChild(container);
    }

    if (!document.getElementById("seo-rss-widget-style")) {
      const style = document.createElement("style");
      style.id = "seo-rss-widget-style";

      style.textContent = `
        .seo-rss-widget {
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
          font-family: Arial, Helvetica, sans-serif;
          line-height: 1.5;
          color: #111;
        }

        .seo-rss-widget-title {
          margin: 0 0 14px 0;
          font-size: 20px;
          line-height: 1.3;
          font-weight: 700;
        }

        .seo-rss-widget-item {
          padding: 11px 0;
          border-bottom: 1px solid #e5e5e5;
        }

        .seo-rss-widget-item:last-child {
          border-bottom: 0;
        }

        .seo-rss-widget-item a {
          color: #111;
          text-decoration: none;
          font-size: 16px;
          font-weight: 700;
        }

        .seo-rss-widget-item a:hover {
          text-decoration: underline;
        }

        .seo-rss-widget-date {
          display: block;
          margin-top: 4px;
          color: #777;
          font-size: 13px;
          font-weight: 400;
        }

        .seo-rss-widget-message {
          padding: 12px;
          border-radius: 6px;
          background: #f5f5f5;
          color: #555;
          font-size: 14px;
        }
      `;

      document.head.appendChild(style);
    }

    container.innerHTML =
      '<div class="seo-rss-widget-message">RSS Feed wird geladen...</div>';

    const apiUrl =
      "https://api.rss2json.com/v1/api.json?rss_url=" +
      encodeURIComponent(feedUrl);

    fetch(apiUrl, {
      method: "GET",
      mode: "cors",
      cache: "no-store"
    })
      .then(function (response) {
        if (!response.ok) {
          throw new Error(
            "HTTP Fehler beim Laden des Feeds: " + response.status
          );
        }

        return response.json();
      })
      .then(function (data) {
        if (!data) {
          throw new Error("Keine RSS-Daten empfangen.");
        }

        if (data.status && data.status !== "ok") {
          throw new Error(
            data.message || "RSS Feed konnte nicht gelesen werden."
          );
        }

        if (!Array.isArray(data.items)) {
          throw new Error("RSS Feed enthält keine gültigen Beiträge.");
        }

        container.innerHTML = "";

        if (
          showTitle &&
          data.feed &&
          typeof data.feed.title === "string" &&
          data.feed.title.trim()
        ) {
          const widgetTitle = document.createElement("div");
          widgetTitle.className = "seo-rss-widget-title";
          widgetTitle.textContent = data.feed.title;

          container.appendChild(widgetTitle);
        }

        const items = data.items.slice(0, count);

        if (items.length === 0) {
          container.innerHTML =
            '<div class="seo-rss-widget-message">Keine Beiträge gefunden.</div>';

          return;
        }

        items.forEach(function (item) {
          const article = document.createElement("div");
          article.className = "seo-rss-widget-item";

          const link = document.createElement("a");

          link.href = item.link || feedUrl;
          link.textContent = item.title || "Artikel";

          if (newTab) {
            link.target = "_blank";
            link.rel = "noopener noreferrer";
          }

          article.appendChild(link);

          if (showDate && item.pubDate) {
            const parsedDate = new Date(item.pubDate);

            if (!isNaN(parsedDate.getTime())) {
              const date = document.createElement("span");
              date.className = "seo-rss-widget-date";

              date.textContent = parsedDate.toLocaleDateString(
                document.documentElement.lang || "de-DE",
                {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit"
                }
              );

              article.appendChild(date);
            }
          }

          container.appendChild(article);
        });
      })
      .catch(function (error) {
        console.error("RSS Widget Fehler:", error);

        container.innerHTML =
          '<div class="seo-rss-widget-message">' +
          "RSS Feed konnte nicht geladen werden." +
          "</div>";
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      setTimeout(initWidget, 0);
    });
  } else {
    setTimeout(initWidget, 0);
  }
})();
