import { auth } from "@/auth";
import { db } from "./db";

export const prisma = db.$extends({
  query: {
    $allModels: {
      async create({ model, args, query }) {
        if (model === 'AuditLog') return query(args);
        let userId = 'system';
        try {
          const session = await auth();
          if (session?.user?.id) userId = session.user.id;
        } catch {
          // Ignore error during build/static generation
        }

        args.data = {
          ...args.data,
          createdBy: (args.data as any).createdBy || userId, // eslint-disable-line @typescript-eslint/no-explicit-any
          updatedBy: (args.data as any).updatedBy || userId, // eslint-disable-line @typescript-eslint/no-explicit-any
        };
        return query(args);
      },
      async update({ model, args, query }) {
        if (model === 'AuditLog') return query(args);
        let userId = 'system';
        try {
          const session = await auth();
          if (session?.user?.id) userId = session.user.id;
        } catch {
          // Ignore error during build/static generation
        }

        args.data = {
          ...args.data,
          updatedBy: (args.data as any).updatedBy || userId, // eslint-disable-line @typescript-eslint/no-explicit-any
        };
        return query(args);
      },
      async updateMany({ model, args, query }) {
        if (model === 'AuditLog') return query(args);
        let userId = 'system';
        try {
          const session = await auth();
          if (session?.user?.id) userId = session.user.id;
        } catch {
          // Ignore error during build/static generation
        }

        if (args.data) {
          args.data = {
            ...args.data,
            updatedBy: (args.data as any).updatedBy || userId, // eslint-disable-line @typescript-eslint/no-explicit-any
          };
        }
        return query(args);
      },
      async upsert({ model, args, query }) {
        if (model === 'AuditLog') return query(args);
        let userId = 'system';
        try {
          const session = await auth();
          if (session?.user?.id) userId = session.user.id;
        } catch (e) {
          // Ignore error during build/static generation
        }

        args.create = {
          ...args.create,
          createdBy: (args.create as any).createdBy || userId, // eslint-disable-line @typescript-eslint/no-explicit-any
          updatedBy: (args.create as any).updatedBy || userId, // eslint-disable-line @typescript-eslint/no-explicit-any
        };
        args.update = {
          ...args.update,
          updatedBy: (args.update as any).updatedBy || userId, // eslint-disable-line @typescript-eslint/no-explicit-any
        };
        return query(args);
      },
    },
  },
});

export default prisma;
