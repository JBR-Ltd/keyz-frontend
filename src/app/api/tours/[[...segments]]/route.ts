// src/app/api/tours/[[...segments]]/route.ts
//
// One catch-all for every authenticated tour request. The frontend path is
// the backend path: whatever the browser asks for under /api/tours/* gets
// forwarded verbatim to the Java service. Every contract mismatch we used to
// have (floor-plan vs floors/floor-plan, room status, tree) becomes
// impossible because there is no path translation to get wrong.
//
// The only tour route that is NOT here is the public read, which has its own
// file so it can carry allowAnonymous.

import { createCatchAllHandlers } from "@/app/api/_catchAllProxy";

export const { GET, POST, PUT, PATCH, DELETE } = createCatchAllHandlers("/api/tours");
