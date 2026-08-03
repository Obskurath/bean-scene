import { atom } from "nanostores";
import Swal from "sweetalert2";

export interface CartItem {
  id: string | number;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

const isBrowser = typeof window !== "undefined";
const initialCart =
  isBrowser && localStorage.getItem("cart")
    ? JSON.parse(localStorage.getItem("cart")!)
    : [];

export const cartStore = atom<CartItem[]>(initialCart);

if (isBrowser) {
  cartStore.subscribe((cart) => {
    localStorage.setItem("cart", JSON.stringify(cart));
  });
}

export function addToCart(product: Omit<CartItem, "quantity">) {
  const currentCart = cartStore.get();
  const existingIndex = currentCart.findIndex((item) => item.id === product.id);

  if (existingIndex > -1) {
    const newCart = [...currentCart];
    newCart[existingIndex].quantity += 1;
    cartStore.set(newCart);
  } else {
    cartStore.set([...currentCart, { ...product, quantity: 1 }]);
  }

  if (isBrowser) {
    Swal.fire({
      toast: true,
      position: "bottom-end",
      icon: "success",
      title: "Coffee is brewing!",
      text: `${product.name} added to your cart.`,
      showConfirmButton: false,
      timer: 2500,
      timerProgressBar: true,
      background: "#FFF9F1",
      color: "#603809",
      iconColor: "#F9C06A",
      customClass: {
        title: "font-heading font-bold",
        popup: "border border-[#F9C06A]",
      },
    });
  }
}

export function removeFromCart(productId: string | number) {
  const currentCart = cartStore.get();
  const existingItem = currentCart.find((item) => item.id === productId);

  if (existingItem) {
    if (existingItem.quantity > 1) {
      cartStore.set(
        currentCart.map((item) =>
          item.id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item,
        ),
      );
    } else {
      cartStore.set(currentCart.filter((item) => item.id !== productId));
    }
  }
}

export function clearCart() {
  cartStore.set([]);
}
