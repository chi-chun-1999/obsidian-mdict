import fs from 'fs';

// Read the mdx and mdd files path from folder path
export function getMdxMddPaths(folderPath: string): { mdxPath: string; mddPath: string | null } | null {
	if (!fs.existsSync(folderPath)) {
		return null;
	}
	const files = fs.readdirSync(folderPath);
	const mdxFile = files.find(file => file.endsWith('.mdx'));
	const mddFile = files.find(file => file.endsWith('.mdd'));
	if (!mdxFile) {
		return null;
	}
	const mdxPath = `${folderPath}/${mdxFile}`;
	const mddPath = mddFile ? `${folderPath}/${mddFile}` : null;
	return { mdxPath, mddPath };
}

