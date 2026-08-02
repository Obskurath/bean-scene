import { supabase } from "./supabase";

export type ProductCardData = {
  id: string | number;
  name: string;
  description: string;
  price: number;
  image: string;
};

export async function getProducts(): Promise<ProductCardData[]> {
  const { data, error } = await supabase.from("products").select("*");

  if (error) {
    console.error("Error loading products from Supabase:", error.message);
    return [];
  }

  return (data || []).map((item) => ({
    id: item.id,
    name: item.nombre,
    description: item.descripcion,
    price: Number(item.precio),
    image: item.imagen_url,
  }));
}
