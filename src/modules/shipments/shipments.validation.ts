import { z } from 'zod';

export const getShipmentsQuerySchema = z.object({
  status: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  origin: z.string().optional(),
  destination: z.string().optional(),
});

export type GetShipmentsQuery = z.infer<typeof getShipmentsQuerySchema>;
