// Bendra svetainės informacija. Tušti laukai svetainėje nerodomi.
export const SITE = {
  name: "Tavo auto USA",
  tagline: "Automobiliai iš JAV Copart ir IAAI aukcionų su pristatymu į Klaipėdą.",
  phone: "", // pvz. "+370 600 00000"
  email: "", // pvz. "info@tavoauto.lt"
  telegram: "", // pvz. "https://t.me/tavoautousa"
  facebook: "",
  instagram: "",
};

export const telHref = (p: string) => `tel:${p.replace(/\s/g, "")}`;
