const menu = document.querySelector("#site-menu");
const menuButton = document.querySelector(".menu-pill");
const closeButton = menu?.querySelector("[data-menu-close]");

if (menu && menuButton && closeButton) {
  menuButton.addEventListener("click", () => menu.showModal());
  closeButton.addEventListener("click", () => menu.close());

  menu.addEventListener("click", (event) => {
    if (event.target === menu) {
      menu.close();
    }
  });

  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => menu.close());
  });
}
