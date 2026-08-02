import {
  getSupabaseClientForCurrentPreference,
  setRememberMePreference,
} from "../../lib/supabase";
import Swal from "sweetalert2";

export function initSignInForm() {
  const form = document.getElementById("login-form") as HTMLFormElement | null;

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const rememberMe = (formData.get("remember-me") as string | null) === "on";

    setRememberMePreference(rememberMe);
    const authClient = getSupabaseClientForCurrentPreference();

    const { error } = await authClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      const message =
        error.message === "Invalid login credentials"
          ? "Invalid email or password. Please try again."
          : error.message;

      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: message,
        confirmButtonColor: "var(--btn-color)",
        background: "var(--filler-color)",
        color: "var(--text-color)",
        customClass: {
          popup: "border border-[var(--border-color)] rounded-3xl shadow-xl",
          confirmButton:
            "rounded-full px-6 py-2.5 font-semibold text-[var(--header-color)] tracking-wider !bg-[var(--btn-color)]",
        },
      });
      console.error("Login error:", error.message);
      return;
    }

    Swal.fire({
      icon: "success",
      title: "Welcome back!",
      text: "Login successful.",
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
}
