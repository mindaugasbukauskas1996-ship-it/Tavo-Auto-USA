import { test } from "node:test";
import assert from "node:assert/strict";
import { guessSizeClass, guessVehicleType } from "./vehicle.ts";

test("kėbulo klasės", () => {
  assert.equal(guessSizeClass("SEDAN", "Sedan 4d"), "regular");
  assert.equal(guessSizeClass("AUTOMOBILE", null), "regular");
  assert.equal(guessSizeClass("SUV", "Sport Utility"), "large");
  assert.equal(guessSizeClass("PICKUP", "Crew Pickup"), "large");
  assert.equal(guessSizeClass("MOTORCYCLE", null), "moto");
  assert.equal(guessSizeClass("MOTORCYCLE", "Touring"), "moto_large");
  assert.equal(guessSizeClass("TRUCK", "Cargo Van"), "oversize");
});

test("muito tipas", () => {
  const now = new Date("2026-10-11");
  assert.equal(guessVehicleType("regular", 2014, now), "car");
  assert.equal(guessVehicleType("regular", 1990, now), "classic");
  assert.equal(guessVehicleType("moto", 2020, now), "moto");
});
