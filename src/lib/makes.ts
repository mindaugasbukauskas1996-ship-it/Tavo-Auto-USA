// Dažniausios JAV aukcionų markės (filtrams)
export const MAKES = [
  "Acura", "Alfa Romeo", "Audi", "BMW", "Buick", "Cadillac", "Chevrolet", "Chrysler", "Dodge", "Fiat", "Ford",
  "Genesis", "GMC", "Honda", "Hyundai", "Infiniti", "Jaguar", "Jeep", "Kia", "Land Rover", "Lexus", "Lincoln",
  "Maserati", "Mazda", "Mercedes-Benz", "Mini", "Mitsubishi", "Nissan", "Polestar", "Porsche", "Ram", "Rivian",
  "Subaru", "Tesla", "Toyota", "Volkswagen", "Volvo",
];

export const POPULAR_MAKES = ["Toyota", "BMW", "Audi", "Mercedes-Benz", "Ford", "Volkswagen", "Tesla", "Lexus", "Jeep", "Honda"];

export const YEARS = Array.from({ length: 2027 - 1990 + 1 }, (_, i) => 2027 - i);
