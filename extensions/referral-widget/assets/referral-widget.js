document.addEventListener("DOMContentLoaded", () => {
  const widget = document.querySelector("[data-referral-widget]");
  if (!widget) return;

  const input = widget.querySelector("[data-referral-url]");
  const status = widget.querySelector("[data-referral-status]");
  const copyButton = widget.querySelector("[data-referral-copy]");
  const proxyPath = widget.dataset.proxyPath;

  fetch(proxyPath, { headers: { Accept: "application/json" } })
    .then((response) => {
      if (!response.ok) throw new Error("Could not load referral link");
      return response.json();
    })
    .then((data) => {
      input.value = data.url;
    })
    .catch(() => {
      status.hidden = false;
      status.textContent = "We couldn't load your referral link. Please refresh the page.";
    });

  copyButton?.addEventListener("click", async () => {
    if (!input.value) return;
    try {
      await navigator.clipboard.writeText(input.value);
      status.hidden = false;
      status.textContent = "Link copied!";
    } catch {
      input.select();
      status.hidden = false;
      status.textContent = "Select and copy the link above.";
    }
  });
});
