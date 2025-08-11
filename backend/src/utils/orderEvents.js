import { EventEmitter } from "events";
export const orderEvents = new EventEmitter();
// sınırsız dinleyici (dev ortamında warning olmasın)
orderEvents.setMaxListeners(0);