/**
 * Optional real images for the characters. Drop a file named after the character's id (michael.webp, sam.jpg,
 * brennen.png and so on) into src/assets/portraits/ and the game uses it instead of the drawn sketch. Square images
 * work best, with the face in the middle. Characters without a file keep their drawn portrait.
 */
const files = import.meta.glob("../assets/portraits/*.{webp,jpg,jpeg,png,avif}", { eager: true, query: "?url", import: "default" }) as Record<string, string>;

export const PHOTOS: Record<string, string> = Object.fromEntries(
  Object.entries(files).map(([path, url]) => [path.split("/").pop()!.replace(/\.\w+$/, ""), url]),
);
