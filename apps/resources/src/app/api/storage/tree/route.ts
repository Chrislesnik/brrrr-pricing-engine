import { NextResponse } from "next/server";
import { listFiles } from "@/lib/storage";

interface TreeNode {
  name: string;
  path: string;
  children?: TreeNode[];
}

async function buildTree(rootPath: string = ""): Promise<TreeNode[]> {
  const { folders } = await listFiles(rootPath);

  const nodes: TreeNode[] = [];

  for (const folderName of folders) {
    const folderPath = rootPath ? `${rootPath}/${folderName}` : folderName;
    const children = await buildTree(folderPath);

    nodes.push({
      name: folderName,
      path: folderPath,
      ...(children.length > 0 ? { children } : {}),
    });
  }

  return nodes;
}

export async function GET() {
  try {
    const tree = await buildTree();
    return NextResponse.json(tree);
  } catch (error) {
    console.error("Error building folder tree:", error);
    return NextResponse.json([], { status: 500 });
  }
}
