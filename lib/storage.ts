import type { AppData, Deck, Settings, StudyEvent } from "./types";

const DB_NAME = "daneoteum-db";
const DB_VERSION = 1;
const defaults: AppData = { decks: [], events: [], settings: { theme: "system", newCardsPerDay: 20, direction: "term-to-meaning" } };

function openDb() { return new Promise<IDBDatabase>((resolve, reject) => { const request = indexedDB.open(DB_NAME, DB_VERSION); request.onupgradeneeded = () => { const db = request.result; ["decks", "events", "settings"].forEach((store) => { if (!db.objectStoreNames.contains(store)) db.createObjectStore(store, { keyPath: store === "settings" ? "id" : "id" }); }); }; request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); }); }
async function all<T>(store: string): Promise<T[]> { const db = await openDb(); return new Promise((resolve, reject) => { const req = db.transaction(store, "readonly").objectStore(store).getAll(); req.onsuccess = () => resolve(req.result as T[]); req.onerror = () => reject(req.error); }); }
async function put<T extends { id: string }>(store: string, value: T) { const db = await openDb(); return new Promise<void>((resolve, reject) => { const req = db.transaction(store, "readwrite").objectStore(store).put(value); req.onsuccess = () => resolve(); req.onerror = () => reject(req.error); }); }
export async function loadData(): Promise<AppData> { const [decks, events, saved] = await Promise.all([all<Deck>("decks"), all<StudyEvent>("events"), all<Settings & { id: string }>("settings")]); return { decks, events, settings: saved[0] ? { theme: saved[0].theme, newCardsPerDay: saved[0].newCardsPerDay, direction: saved[0].direction } : defaults.settings }; }
export async function saveDeck(deck: Deck) { await put("decks", deck); }
export async function saveEvent(event: StudyEvent) { await put("events", event); }
export async function saveSettings(settings: Settings) { await put("settings", { id: "settings", ...settings }); }
export async function replaceData(data: AppData) { const db = await openDb(); const tx = db.transaction(["decks", "events", "settings"], "readwrite"); ["decks", "events", "settings"].forEach((store) => tx.objectStore(store).clear()); data.decks.forEach((d) => tx.objectStore("decks").put(d)); data.events.forEach((e) => tx.objectStore("events").put(e)); tx.objectStore("settings").put({ id: "settings", ...data.settings }); return new Promise<void>((resolve, reject) => { tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); }); }
export async function clearData() { await replaceData(defaults); }
