import { loadFont as loadCormorant } from "@remotion/google-fonts/CormorantGaramond";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

export const serif = loadCormorant("normal", {
  weights: ["300", "400", "500", "600"],
  subsets: ["latin"],
}).fontFamily;

export const sans = loadInter("normal", {
  weights: ["300", "400", "500", "600"],
  subsets: ["latin"],
}).fontFamily;

export const colors = {
  ink: "#0A0908",
  cream: "#F2EFE9",
  gold: "#C9A961",
  goldSoft: "#8A7444",
  charcoal: "#1A1816",
  mute: "#736E66",
};