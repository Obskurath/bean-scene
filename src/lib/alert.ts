import Swal from "sweetalert2";

export const showAlert = {
  success: (title: string, text?: string, timer = 1500) => {
    return Swal.fire({
      icon: "success",
      title: title,
      text: text,
      timer: timer,
      showConfirmButton: false,
      background: "var(--filler-color)",
      color: "var(--header-color)",
      customClass: {
        popup: "border border-[var(--border-color)] rounded-3xl shadow-xl",
      },
    });
  },
  error: (title: string, text: string) => {
    return Swal.fire({
      icon: "error",
      title: title,
      text: text,
      confirmButtonColor: "var(--header-color)",
      background: "var(--filler-color)",
      color: "var(--text-color)",
      customClass: {
        popup: "border border-[var(--border-color)] rounded-3xl shadow-xl",
        confirmButton:
          "rounded-full px-6 py-2.5 font-semibold text-white tracking-wider",
      },
    });
  },
};
