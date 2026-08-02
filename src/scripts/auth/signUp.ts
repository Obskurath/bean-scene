import { supabase } from "../../lib/supabase";
import Swal from "sweetalert2";

export function initSignUpForm() {
  const form = document.getElementById("signup-form") as HTMLFormElement | null;

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const fullName = formData.get("full-name") as string;

    const redirectUrl = `${window.location.origin}/`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: redirectUrl,
      },
    });

    if (error) {
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
            "rounded-full px-6 py-2.5 font-semibold text-white tracking-wider",
        },
      });
      console.error("Sign up error:", error.message);
      return;
    }

    Swal.fire({
      icon: "success",
      title: "Account created!",
      text: "Welcome to Bean Scene.",
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
