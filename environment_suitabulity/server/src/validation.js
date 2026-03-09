import { z } from "zod";

export const TankId = z.enum(["TankA", "TankB", "TankC"]);

export const SensorDataInput = z.object({
  tankId: TankId,
  temperature: z.number().finite(),
  ph: z.number().finite(),
  tds: z.number().finite(),
  light: z.number().finite()
});

