document.addEventListener("DOMContentLoaded", () => {
  const year = new Date().getFullYear();
  const footerText = document.querySelector(".site-footer p");

  if (footerText && !footerText.dataset.yearInjected) {
    footerText.dataset.yearInjected = "true";
    footerText.insertAdjacentText("beforeend", ` © ${year}`);
  }
});
