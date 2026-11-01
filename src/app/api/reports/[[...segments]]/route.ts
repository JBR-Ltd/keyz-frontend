import { createCatchAllHandlers } from "@/app/api/_catchAllProxy";

export const { DELETE, GET, PATCH, POST, PUT } = createCatchAllHandlers("/api/reports");
