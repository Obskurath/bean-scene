import { supabase } from "../../lib/supabase";
import { cartStore } from "../../store/cartStore";
import Swal from "sweetalert2";

type UserLike =
  | {
      id?: string;
      user_metadata?: { full_name?: string } | undefined;
      email?: string | undefined;
    }
  | null
  | undefined;

type SessionLike = {
  user?: UserLike;
} | null;

export function initHeader() {
  const header = document.getElementById("site-header");
  const headerContainer = document.getElementById("header-container");
  const logo = document.getElementById("header-logo");
  const navLinks = document.querySelectorAll(".nav-link");
  const cartBtn = document.getElementById("open-cart-drawer-btn");
  const authContainer = document.getElementById("auth-container");
  const authActions = document.getElementById("auth-actions");
  const userMenuWrapper = document.getElementById("user-menu-wrapper");
  const userMenu = document.getElementById("user-menu");
  const userMenuButton = document.getElementById("user-menu-button");
  const userInitial = document.getElementById("user-initial");
  const signOutButton = document.getElementById("sign-out-button");
  const headerCartBadge = document.getElementById("header-cart-badge");
  const openCartBtn = document.getElementById("open-cart-drawer-btn");

  let isLoggingOut = false;
  let previousUserId: string | null = null;

  const resetCart = () => {
    if (typeof cartStore.set === "function") {
      cartStore.set([]);
    }
    localStorage.removeItem("cart");
  };

  const handleAuthChange = (user: UserLike) => {
    const currentUserId = user?.id || null;
    if (previousUserId !== currentUserId) {
      resetCart();
    }
    previousUserId = currentUserId;
  };

  const setLoggedOutUI = (user: UserLike) => {
    handleAuthChange(user);
    if (isLoggingOut) return;

    authActions?.classList.remove("hidden");
    userMenuWrapper?.classList.add("hidden");
    userMenu?.classList.add("hidden");
    authContainer?.classList.remove("opacity-0");

    if (openCartBtn) openCartBtn.style.display = "none";
    if (headerCartBadge) headerCartBadge.classList.add("hidden");
  };

  const setLoggedInUI = (user: UserLike) => {
    handleAuthChange(user);
    if (isLoggingOut) return;

    const fullName = user?.user_metadata?.full_name || user?.email || "User";
    const initial = fullName.charAt(0).toUpperCase();

    authActions?.classList.add("hidden");
    userMenuWrapper?.classList.remove("hidden");
    if (userInitial) {
      userInitial.textContent = initial;
    }
    authContainer?.classList.remove("opacity-0");

    if (openCartBtn) openCartBtn.style.display = "inline-flex";
  };

  const syncAuthUI = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.user) {
      setLoggedInUI(session.user);
    } else {
      setLoggedOutUI(session?.user);
    }
  };

  window.addEventListener("scroll", () => {
    if (window.scrollY > 20) {
      header?.classList.add(
        "bg-[#f3ece2]/95",
        "backdrop-blur-md",
        "shadow-[0_10px_30px_-5px_rgba(0,0,0,0.18)]",
      );
      headerContainer?.classList.remove("py-4");
      headerContainer?.classList.add("py-2.5");
      logo?.classList.remove("text-white", "text-[30px]");
      logo?.classList.add("text-[var(--header-color)]", "text-[26px]");
      cartBtn?.classList.remove("text-slate-300", "hover:text-white");
      cartBtn?.classList.add("text-[var(--header-color)]", "hover:opacity-75");
      navLinks.forEach((link) => {
        link.classList.remove("text-slate-300", "hover:text-white");
        link.classList.add("text-[var(--header-color)]", "hover:opacity-75");
      });
    } else {
      header?.classList.remove(
        "bg-[#f3ece2]/95",
        "backdrop-blur-md",
        "shadow-[0_10px_30px_-5px_rgba(0,0,0,0.18)]",
      );
      headerContainer?.classList.remove("py-2.5");
      headerContainer?.classList.add("py-4");
      logo?.classList.remove("text-[var(--header-color)]", "text-[26px]");
      logo?.classList.add("text-white", "text-[30px]");
      cartBtn?.classList.remove(
        "text-[var(--header-color)]",
        "hover:opacity-75",
      );
      cartBtn?.classList.add("text-slate-300", "hover:text-white");
      navLinks.forEach((link) => {
        link.classList.remove("text-[var(--header-color)]", "hover:opacity-75");
        link.classList.add("text-slate-300", "hover:text-white");
      });
    }
  });

  openCartBtn?.addEventListener("click", () => {
    if (typeof (window as any).openCartDrawer === "function") {
      (window as any).openCartDrawer();
    }
  });

  cartStore.subscribe((cart) => {
    if (!headerCartBadge) return;
    const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

    if (totalItems > 0 && openCartBtn?.style.display !== "none") {
      headerCartBadge.textContent = String(totalItems);
      headerCartBadge.classList.remove("hidden");
    } else {
      headerCartBadge.classList.add("hidden");
    }
  });

  userMenuButton?.addEventListener("click", () => {
    userMenu?.classList.toggle("hidden");
  });

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (
      target instanceof Node &&
      !userMenuButton?.contains(target) &&
      !userMenu?.contains(target)
    ) {
      userMenu?.classList.add("hidden");
    }
  });

  signOutButton?.addEventListener("click", async () => {
    userMenu?.classList.add("hidden");
    isLoggingOut = true;

    resetCart();

    const { error } = await supabase.auth.signOut();

    if (error) {
      isLoggingOut = false;
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: error.message,
        confirmButtonColor: "var(--btn-color)",
        background: "var(--filler-color)",
        color: "var(--text-color)",
        customClass: {
          popup: "border border-[var(--border-color)] rounded-3xl shadow-xl",
          confirmButton:
            "rounded-full px-6 py-2.5 font-semibold text-[var(--header-color)] tracking-wider !bg-[var(--btn-color)]",
        },
      });
      return;
    }

    Swal.fire({
      icon: "success",
      title: "See you soon!",
      text: "You have been logged out successfully.",
      timer: 2200,
      showConfirmButton: false,
      background: "var(--filler-color)",
      color: "var(--header-color)",
      customClass: {
        popup: "border border-[var(--border-color)] rounded-3xl shadow-xl",
      },
    }).then(() => {
      window.location.href = "/";
    });
  });

  supabase.auth.onAuthStateChange((_event: string, session: SessionLike) => {
    if (session?.user) {
      setLoggedInUI(session.user);
    } else {
      setLoggedOutUI(session?.user);
    }
  });

  syncAuthUI();
}
