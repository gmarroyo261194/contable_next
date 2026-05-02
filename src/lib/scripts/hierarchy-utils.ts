import { prisma } from "../prisma";

/**
 * Recalcula recursivamente el path, level y hasChildren para todas las cuentas.
 * Utiliza Adjacency List para reconstruir el Materialized Path.
 */
export async function recalculateHierarchy() {
  console.log("Iniciando recalculo de jerarquía de cuentas...");

  // 1. Obtener todas las cuentas raíz (parentId = null)
  const roots = await prisma.cuenta.findMany({
    where: { padreId: null }
  });

  for (const root of roots) {
    await processNode(root, "/", 0);
  }

  console.log("Jerarquía recalculada con éxito.");
}

async function processNode(node: any, parentPath: string, parentLevel: number) {
  const currentPath = `${parentPath}${node.id}/`;
  const currentLevel = parentLevel + 1;

  // Buscar hijos
  const children = await prisma.cuenta.findMany({
    where: { padreId: node.id }
  });

  const hasChildren = children.length > 0;

  // Actualizar nodo actual
  await prisma.cuenta.update({
    where: { id: node.id },
    data: {
      path: currentPath,
      level: currentLevel,
      hasChildren: hasChildren
    }
  });

  // Procesar hijos recursivamente
  for (const child of children) {
    await processNode(child, currentPath, currentLevel);
  }
}
